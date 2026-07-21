import { SelectionManager } from "./SelectionManager.js";
import { ViewportManager } from "./ViewportManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { EditManager } from "./EditManager.js";
import { SummaryCalculator } from "../Helper/SummaryCalculator.js";

interface EventManagerConfig {
  canvas: HTMLCanvasElement;
  selectionManager: SelectionManager;
  viewPort: ViewportManager;
  resizeManager: ResizeManager;
  editManager: EditManager;
  summaryCalculator: SummaryCalculator;
  headerWidth: number;
  headerHeight: number;
  rowCount: number;
  colCount: number;
  onRefresh: () => void; // Standard naming convention for callbacks
}

export class EventManager {
    constructor(private config: EventManagerConfig) {}
    public bind(): void {
        this.bindWheel();
        this.bindMouseDown();
        this.bindDblClick();
        this.bindMouseMove();
        this.bindMouseUp();
        this.bindWindowResize();
        this.bindKeyboard();
    }

    public summary(): void {
    if (!this.config.selectionManager.selectedFirst || !this.config.selectionManager.selectedLast) return;
    const col1 = this.config.selectionManager.selectedFirst.col;
    const col2 = this.config.selectionManager.selectedLast.col;
    const row1 = this.config.selectionManager.selectedFirst.row;
    const row2 = this.config.selectionManager.selectedLast.row;
    this.config.summaryCalculator.setValues(col1, col2, row1, row2);
  }

    private LocalCord(event: MouseEvent): { x: number, y: number } {
        const rect = this.config.canvas.getBoundingClientRect();
        return {
            x: event.clientX - this.config.headerWidth - rect.left,
            y: event.clientY - this.config.headerHeight - rect.top,
        }
    }

    private bindWheel(): void {
        this.config.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();

            const x = Math.max(0, this.config.viewPort.getScrollX() + event.deltaX);
            const y = Math.max(0, this.config.viewPort.getScrollY() + event.deltaY);
            this.config.viewPort.setScroll(x, y);
            this.config.onRefresh();
        }, { passive: false });
    }

    private bindMouseDown(): void {
        this.config.canvas.addEventListener("mousedown", (event) => {
            if (this.config.editManager.isEditing()) {
                this.config.editManager.commitEdit();
            }
            const { x, y } = this.LocalCord(event);

            this.config.selectionManager.isDragging = true;

            const cell = this.config.selectionManager.getSelectedCell(x, y);
            
            if (cell) {
                this.config.viewPort.ensureCellVisible(cell.row,cell.col);
                this.config.selectionManager.selectedFirst = { row: cell.row, col: cell.col };
                this.config.selectionManager.selectedLast = { row: cell.row, col: cell.col };
                this.config.selectionManager.selectCell(cell.row, cell.col);
                this.summary();
                this.config.summaryCalculator.setValues
                this.config.onRefresh();
            }
            const target = this.config.resizeManager.getResizingTarget(x, y);
            if (target) {
                this.config.resizeManager.startResize(target.type, target.index, x, y)
                return;
            }
            if (y < 0) {
                let col = this.config.selectionManager.getSelectedCol(x)
                this.config.selectionManager.selectedFirst = { row: 0, col: col };
                this.config.selectionManager.selectedLast = { row: this.config.rowCount, col: col };
                this.config.selectionManager.selectCell(0, col);
                this.summary();
                this.config.onRefresh();
                return;
            }
            if (x < 0) {
                let row = this.config.selectionManager.getSelectedRow(y)
                this.config.selectionManager.selectedFirst = { row: row, col: 0 };
                this.config.selectionManager.selectCell(row, 0);
                this.config.selectionManager.selectedLast = { row: row, col: this.config.colCount };
                this.summary();
                this.config.onRefresh();
                return;

            }

        })
    }

    private bindDblClick(): void {
        this.config.canvas.addEventListener("dblclick", (event) => {
            // const { x, y } = this.LocalCord(event);
            const cell = this.config.selectionManager.getActiveCell();
            if (cell) {
                this.config.editManager.startEdit(cell.row, cell.col);
            }
        })
    }

    private bindMouseMove(): void {

        window.addEventListener("mousemove", (event) => {
            const { x, y } = this.LocalCord(event);
            if (this.config.resizeManager.isResizing()) {
                this.config.resizeManager.updateResize(x, y);
                this.config.onRefresh();
                return;
            }

            if (this.config.selectionManager.isDragging) {
                const cell = this.config.selectionManager.getSelectedCell(x, y);
                if (!cell) return;
                this.config.selectionManager.selectedLast = { row: cell.row, col: cell.col };
                this.summary();
                this.config.onRefresh();
                return;
            }
            const target = this.config.resizeManager.getResizingTarget(x, y);
            this.config.canvas.style.cursor = target
                ? (target.type === 'col' ? 'col-resize' : 'row-resize')
                : 'cell';
        });
    }

    private bindMouseUp(): void {
        window.addEventListener("mouseup", () => {
            this.config.resizeManager.endResize();
        });
        this.config.canvas.addEventListener("mouseup", () => {
            this.config.selectionManager.isDragging = false;
            this.summary();
        })
    }

    private bindWindowResize(): void {
        window.addEventListener("resize", () => {
            this.config.viewPort.resizeCanvas();
            this.config.onRefresh();
        });
    }

    private bindKeyboard(): void {
        window.addEventListener("keydown", (event) => {
            const isMod = event.ctrlKey;
            if (document.activeElement === this.config.editManager.getInputElement()) return;
            const key = event.key;
            if (isMod) {
                const lowerKey = event.key.toLowerCase();
                if (lowerKey === 'z' && !event.shiftKey) {
                    event.preventDefault();
                    this.config.editManager.undo();
                    this.config.onRefresh();

                }
                else if ((lowerKey === 'z' && event.shiftKey) || lowerKey === 'y') {
                    event.preventDefault();
                    this.config.editManager.redo();
                    this.config.onRefresh();
                }
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                const currentCell = this.config.selectionManager.selectedFirst || { row: 0, col: 0 };
                let nextRow = currentCell.row;
                let nextCol = currentCell.col;
                switch (key) {
                    case 'ArrowUp':
                        nextRow = Math.max(0, nextRow - 1);
                        break;
                    case 'ArrowDown':
                        nextRow = Math.min(this.config.rowCount - 1, nextRow + 1);
                        break;
                    case 'ArrowLeft':
                        nextCol = Math.max(0, nextCol - 1);
                        break;
                    case 'ArrowRight':
                        nextCol = Math.min(this.config.colCount - 1, nextCol + 1);
                        break;
                }

                if (nextRow !== currentCell.row || nextCol !== currentCell.col) {
                    event.preventDefault();
                    this.config.selectionManager.selectedFirst = { row: nextRow, col: nextCol };
                    this.config.selectionManager.selectedLast = { row: nextRow, col: nextCol };
                    this.config.selectionManager.selectCell(nextRow, nextCol);
                    this.config.viewPort.ensureCellVisible(nextRow, nextCol);
                    this.config.onRefresh();
                }
            }
            if (key === "Enter") {
                const cell = this.config.selectionManager.getActiveCell();
                if (cell) {
                    this.config.editManager.startEdit(cell.row, cell.col);
                }
            }
        })
    }
}