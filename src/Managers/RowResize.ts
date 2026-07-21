import type { IMouseControl } from "../Interface/IMouseControl.js";
import { ViewportManager } from "./ViewportManager.js";
import { HistoryManager, SetResizeCommand } from "./HistoryManager.js";

export class RowResize implements IMouseControl {
    private _activeRow: number = -1;
    private _startResizeSize: number = 0;
    private _resizing: {index:number, startPos: number; startSize: number } | null = null;


    constructor(
        private viewport: ViewportManager,
        private history: HistoryManager,
        private rowCount: number,

    ) { }

    private readonly RESIZE_MARGIN = 5;
    hitTest(x: number, y: number): boolean {
        const targetY = y + this.viewport.getScrollY();

        let accY = 0;
        for (let r = 0; r < this.rowCount; r++) {
            accY += this.viewport.getRowHeight(r);
            if (Math.abs(targetY - accY) <= this.RESIZE_MARGIN) {
                this._activeRow = r;
                this.viewport.setCursorStyle('row-resize');
                return true;
            }
            if (targetY < accY) break;
        }
        return false;
    }

    onDown(x: number, y: number): void {
        const startSize = this.viewport.getRowHeight(this._activeRow);
        const startPos = y;
        const index = this._activeRow;
        this._resizing = {index, startPos, startSize };
        this._startResizeSize = startSize;
    }

    onMove(x: number, y: number): void {
        if (!this._resizing) return;
        const delta = y - this._resizing.startPos;
        const newSize = Math.max(20, this._resizing.startSize + delta);
        this.viewport.setRowHeight(this._resizing.index, newSize);
        this.viewport.onRefresh();
    }

    onUp(): void {
        if (!this._resizing) return;

        const finalSize = this.viewport.getRowHeight(this._activeRow);

        if (finalSize !== this._startResizeSize) {
            const resizeCommand = new SetResizeCommand(
                ( i, s) => {
                    this.viewport.setRowHeight(i, s!);
                },
                this._activeRow,
                this._startResizeSize,
                finalSize
            );
            this.history.execute(resizeCommand);
        }
        this._resizing = null;
    }

}