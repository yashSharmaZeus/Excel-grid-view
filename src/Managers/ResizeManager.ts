import type { ViewportManager } from "./ViewportManager.js";
import { HistoryManager, SetResizeCommand } from "./HistoryManager.js";

export class ResizeManager {
  private readonly RESIZE_MARGIN = 5;

  private _resizing: { type: 'col' | 'row'; index: number; startPos: number; startSize: number } | null = null;
  private _startResizeSize: number = 0;

  constructor(
    private viewport: ViewportManager,
    private history: HistoryManager,
    private rowCount: number,
    private colCount: number,
    private onRefresh: () => void,
  ) { }

  public isResizing(): boolean {
    return this._resizing !== null;
  }

  public getResizingTarget(x: number, y: number): { type: 'col' | 'row'; index: number } | null {
    const targetX = x + this.viewport.getScrollX();
    const targetY = y + this.viewport.getScrollY();

    let accX = 0;
    for (let c = 0; c < this.colCount; c++) {
      accX += this.viewport.getColWidth(c);
      if (Math.abs(targetX - accX) <= this.RESIZE_MARGIN) return { type: 'col', index: c };
      if (targetX < accX) break;
    }
    let accY = 0;
    for (let r = 0; r < this.rowCount; r++) {
      accY += this.viewport.getRowHeight(r);
      if (Math.abs(targetY - accY) <= this.RESIZE_MARGIN) return { type: 'row', index: r };
      if (targetY < accY) break;
    }
    return null;
  }

  public startResize(type: 'col' | 'row', index: number, x: number, y: number): void {
    const startSize = type === 'col' ? this.viewport.getColWidth(index) : this.viewport.getRowHeight(index);
    const startPos = type === 'col' ? x : y;
    this._resizing = { type, index, startPos, startSize };
    this._startResizeSize = startSize;
  }

  public updateResize(x: number, y: number): void {
    if (!this._resizing) return;
    const delta = this._resizing.type === 'col'
      ? x - this._resizing.startPos
      : y - this._resizing.startPos;
    const newSize = Math.max(20, this._resizing.startSize + delta);

    if (this._resizing.type === 'col') {
      this.viewport.setColWidth(this._resizing.index, newSize);
    } else {
      this.viewport.setRowHeight(this._resizing.index, newSize);
    }
  }

  public endResize(): void {
    if (!this._resizing) return;

    const { type, index } = this._resizing;
    const finalSize = type === 'col' ? this.viewport.getColWidth(index) : this.viewport.getRowHeight(index);

    if (finalSize !== this._startResizeSize) {
      const resizeCommand = new SetResizeCommand(
        (t, i, s) => {
          if (t === 'col') this.viewport.setColWidth(i, s!);
          else this.viewport.setRowHeight(i, s!);
          this.onRefresh();
        },
        type,
        index,
        this._startResizeSize,
        finalSize
      );
      this.history.execute(resizeCommand);
    }
    this._resizing = null;
  }
}