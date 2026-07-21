import { SelectionManager } from "./SelectionManager.js";
import { ViewportManager } from "./ViewportManager.js";
// import { ResizeManager } from "./ResizeManager.js";
import { EditManager } from "./EditManager.js";
import { SummaryCalculator } from "../Helper/SummaryCalculator.js";
import type { IMouseControl } from "../Interface/IMouseControl.js";
import { RowResize } from "./RowResize.js";
import { ColResize } from "./ColResize.js";
import type { HistoryManager } from "./HistoryManager.js";
import { CellSelect } from "./CellSelect.js";
import { ColumnHeaderSelect } from "./ColHeaderSelect.js";
import { RowHeaderSelect } from "./RowHeaderSelect.js";

interface EventManagerConfig {
    canvas: HTMLCanvasElement;
    selectionManager: SelectionManager;
    viewPort: ViewportManager;
    editManager: EditManager;
    summaryCalculator: SummaryCalculator;
    history: HistoryManager,
    headerWidth: number;
    headerHeight: number;
    rowCount: number;
    colCount: number;
    onRefresh: () => void;
}

export class EventManager {
    private mouseControllers: IMouseControl[];
    private activeController: IMouseControl | null = null;

    constructor(private config: EventManagerConfig) {
        this.mouseControllers = [
            new ColumnHeaderSelect(this.config.rowCount, this.config.selectionManager, this.config.viewPort,()=>this.summary()),
            new RowHeaderSelect(this.config.colCount, this.config.selectionManager, this.config.viewPort,()=>this.summary()),
            new RowResize(this.config.viewPort, this.config.history, this.config.rowCount),
            new ColResize(this.config.viewPort, this.config.history, this.config.rowCount),
            new CellSelect(this.config.viewPort, this.config.selectionManager,()=>this.summary()),
        ]
    }


    public bind(): void {
        this.bindWheel();
        this.bindMouseDown();
        this.bindDblClick();
        this.bindMouseMove();
        this.bindMouseUp();
        this.bindWindowResize();
        this.bindKeyboard();
    }


    private findController(x: number, y: number): IMouseControl | null {
        return this.mouseControllers.find((s) => s.hitTest(x, y)) ?? null;
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

            this.activeController = this.findController(x, y);
            this.activeController?.onDown(x, y);
        })
    }

    private bindDblClick(): void {
        this.config.canvas.addEventListener("dblclick", (event) => {
            const cell = this.config.selectionManager.getActiveCell();
            if (cell) {
                this.config.editManager.startEdit(cell.row, cell.col);
            }
        })
    }

    private bindMouseMove(): void {
        window.addEventListener("mousemove", (event) => {
            const { x, y } = this.LocalCord(event);
            this.findController(x, y);
            this.activeController?.onMove(x, y);
        });
    }

    private bindMouseUp(): void {
        window.addEventListener("mouseup", () => {
            this.activeController?.onUp();
        });
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
                    this.config.history.undo();
                    this.config.onRefresh();

                }
                else if ((lowerKey === 'z' && event.shiftKey) || lowerKey === 'y') {
                    event.preventDefault();
                    this.config.history.redo();
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