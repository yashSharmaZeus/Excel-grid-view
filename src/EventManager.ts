import type { GridController } from "./GridController.js";

export class EventManager {
    constructor(
        private canvas: HTMLCanvasElement,
        private controller: GridController,
        private headerWidth: number,
        private headerHeight: number,
        private rowCount: number,
        private colCount: number,
    ) { }

    public bind(): void {
        this.bindWheel();
        this.bindMouseDown();
        this.bindDblClick();
        this.bindMouseMove();
        this.bindMouseUp();
        this.bindWindowResize();
        this.bindKeyboard();
    }

    private LocalCord(event: MouseEvent): { x: number, y: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - this.headerWidth - rect.left,
            y: event.clientY - this.headerHeight - rect.top,
        }
    }

    private bindWheel(): void {
        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();

            const x = Math.max(0, this.controller.getScrollX() + event.deltaX);
            const y = Math.max(0, this.controller.getScrollY() + event.deltaY);
            this.controller.setScroll(x, y);
            this.controller.refresh();
        }, { passive: false });
    }

    private bindMouseDown(): void {
        this.canvas.addEventListener("mousedown", (event) => {
            if (this.controller.isEditing()) {
                this.controller.commitEdit();
            }
            this.controller.selectedFirst = null;
            this.controller.selectedLast = null;
            const { x, y } = this.LocalCord(event);
            const target = this.controller.getResizingTarget(x, y);
            if (target) {
                this.controller.startResize(target.type, target.index, x, y)
                return;
            }

            this.controller.isDragging = true;

            const cell = this.controller.getSelectedCell(x, y);
            if (y < 0) {
                let col = this.controller.getSelectedCol(x)
                this.controller.selectedFirst = { row: 0, col: col };
                this.controller.selectedLast = { row: this.rowCount, col: col };
                this.controller.summary();
                this.controller.refresh();
                return;
            }
            if (x < 0) {
                let row = this.controller.getSelectedRow(y)
                this.controller.selectedFirst = { row: row, col: 0 };
                this.controller.selectedLast = { row: row, col: this.colCount };
                this.controller.summary();
                this.controller.refresh();
                return;

            }
            if (cell) {
                this.controller.selectedFirst = { row: cell.row, col: cell.col };
                this.controller.selectCell(cell.row, cell.col);
                this.controller.refresh();
                return;
            }
        })
    }

    private bindDblClick(): void {
        this.canvas.addEventListener("dblclick", (event) => {
            const { x, y } = this.LocalCord(event);
            const cell = this.controller.getSelectedCell(x, y);
            if (cell) {
                this.controller.startEdit(cell.row, cell.col);
            }
        })
    }

    private bindMouseMove(): void {

        window.addEventListener("mousemove", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const { x, y } = this.LocalCord(event);
            if (this.controller.isResizing()) {
                this.controller.updateResize(x, y);
                this.controller.refresh();
                return;
            }

            if (this.controller.isDragging) {
                const cell = this.controller.getSelectedCell(x, y);
                if (!cell) return;
                this.controller.selectedLast = { row: cell.row, col: cell.col };
                this.controller.refresh();
                return;
            }
            const target = this.controller.getResizingTarget(x, y);
            this.canvas.style.cursor = target
                ? (target.type === 'col' ? 'col-resize' : 'row-resize')
                : 'cell';
        });
    }

    private bindMouseUp(): void {
        window.addEventListener("mouseup", () => {
            this.controller.endResize();
        });
        this.canvas.addEventListener("mouseup", () => {
            this.controller.isDragging = false;
            this.controller.summary();
        })
    }

    private bindWindowResize(): void {
        window.addEventListener("resize", () => {
            this.controller.handleWindowResize();
            this.controller.refresh();
        });
    }

    private bindKeyboard(): void {
        window.addEventListener("keydown", (event) => {
            const isMod = event.ctrlKey;
            if (document.activeElement === this.controller.getInputElement()) return;
            const key = event.key;
            if (isMod) {
                const lowerKey = event.key.toLowerCase();
                if (lowerKey === 'z' && !event.shiftKey) {
                    event.preventDefault();
                    this.controller.undo();
                    this.controller.refresh();

                }
                else if ((lowerKey === 'z' && event.shiftKey) || lowerKey === 'y') {
                    event.preventDefault();
                    this.controller.redo();
                    this.controller.refresh();
                }
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {

                const currentCell = this.controller.selectedFirst || { row: 0, col: 0 };
                let nextRow = currentCell.row;
                let nextCol = currentCell.col;
                switch (key) {
                    case 'ArrowUp':
                        nextRow = Math.max(0, nextRow - 1);
                        this.controller.subtractScrollY(nextRow);
                        this.controller.refresh();
                        break;
                    case 'ArrowDown':
                        nextRow = Math.min(this.rowCount - 1, nextRow + 1);
                        this.controller.addScrollY(nextRow);
                        this.controller.refresh();
                        break;
                    case 'ArrowLeft':
                        nextCol = Math.max(0, nextCol - 1);
                        this.controller.subtractScrollX(nextCol);
                        this.controller.refresh();
                        break;
                    case 'ArrowRight':
                        nextCol = Math.min(this.colCount - 1, nextCol + 1);
                        this.controller.addScrollX(nextCol);
                        this.controller.refresh();
                        break;
                }

                if (nextRow !== currentCell.row || nextCol !== currentCell.col) {
                    event.preventDefault();
                    this.controller.selectedFirst = { row: nextRow, col: nextCol };
                    this.controller.selectedLast = { row: nextRow, col: nextCol };

                    this.controller.selectCell(nextRow, nextCol);
                    this.controller.refresh();
                }
            }
        })
    }
}