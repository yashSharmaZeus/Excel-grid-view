import type { GridController } from "./GridController.js";

export class EventManager {
    constructor(
        private canvas: HTMLCanvasElement,
        private controller: GridController,
        private headerWidth: number,
        private headerHeight: number
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
            
            console.log(y)
            if(y<0){
                this.controller.selectedFirst = {row:cell!.row,col:0 }
                this.controller.selectedLast = {row:cell!.row , col:10}
                this.controller.refresh();
            }
            if (cell) {
                this.controller.selectedFirst = {row : cell.row, col :cell.col};
                this.controller.selectCell(cell.row, cell.col);
                this.controller.refresh();
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

            if(this.controller.isDragging){
                const cell = this.controller.getSelectedCell(x, y);
                if(!cell) return;
                this.controller.selectedLast = {row : cell.row, col :cell.col}; 
                // console.log(this.controller.selectedLast);
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
            this.controller.isDragging = false;
        });
    }

    private bindWindowResize(): void {
        window.addEventListener("resize", () => {
            this.controller.handleWindowResize();
            this.controller.refresh();
        });
    }

    private bindKeyboard(): void {
        window.addEventListener("keydown", (event) => {
            if (document.activeElement === this.controller.getInputElement()) return;
            const isMod = event.ctrlKey;

            if (!isMod) return;
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.controller.undo();
                this.controller.refresh();

            }
            else if ((key === 'z' && event.shiftKey) || key === 'y') {
                event.preventDefault();
                this.controller.redo();
                this.controller.refresh();

            }
        })
    }
}