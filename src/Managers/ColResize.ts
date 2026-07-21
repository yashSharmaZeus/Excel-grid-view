import type { IMouseControl } from "../Interface/IMouseControl.js";
import { ViewportManager } from "./ViewportManager.js";
import { HistoryManager, SetResizeCommand } from "./HistoryManager.js";

export class ColResize implements IMouseControl {
    private _activeCol: number = -1;
    private _startResizeSize: number = 0;
    private _resizing: {index:number, startPos: number; startSize: number } | null = null;


    constructor(
        private viewport: ViewportManager,
        private history: HistoryManager,
        private colCount: number,
    ) { }

    private readonly RESIZE_MARGIN = 5;
    hitTest(x: number, y: number): boolean {
        const targetX = x + this.viewport.getScrollX();
        let accX = 0;
        for (let c = 0; c < this.colCount; c++) {
            accX += this.viewport.getColWidth(c);
            if (Math.abs(targetX - accX) <= this.RESIZE_MARGIN) {
                this._activeCol = c;
                this.viewport.setCursorStyle("col-resize")
                return true;
            }
            if (targetX < accX) break;
        }
        return false;
    }

    onDown(x: number, y: number): void {
        const startSize = this.viewport.getColWidth(this._activeCol);
        const startPos = x;
        const index =  this._activeCol ;
        this._resizing = { index, startPos, startSize };
        this._startResizeSize = startSize;
    }
    
    onMove(x: number, y: number): void {
        if (!this._resizing) return;
        const delta = x - this._resizing.startPos;
        const newSize = Math.max(20, this._resizing.startSize + delta);
        this.viewport.setColWidth(this._resizing.index, newSize);
        this.viewport.onRefresh();
    }

    onUp(): void {
        if (!this._resizing) return;

        const finalSize = this.viewport.getColWidth(this._activeCol);

        if (finalSize !== this._startResizeSize) {
            const resizeCommand = new SetResizeCommand(
                (i, s) => {
                    this.viewport.setColWidth(i, s!);
                },
                this._activeCol,
                this._startResizeSize,
                finalSize
            );
            this.history.execute(resizeCommand);
        }
        this._resizing = null;
    }

}