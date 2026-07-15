export class ViewportManager {
  private _scrollX: number = 0;
  private _scrollY: number = 0;

  private _rowHeights = new Map<number, number>();
  private _colWidths = new Map<number, number>();

  constructor(
    private _canvas: HTMLCanvasElement,
    private _ctx: CanvasRenderingContext2D,
    private _rowCount: number,
    private _columnCount: number,
    private _defaultRowHeight: number = 25,
    private _defaultColWidth: number = 100,
    private _headerWidth: number = 50,
    private _headerHeight: number = 25,
  ) { }

  public getScrollX(): number {
    return this._scrollX;
  }

  public getScrollY(): number {
    return this._scrollY;
  }

  public setScroll(x: number, y: number): void {
    this._scrollX = x;
    this._scrollY = y;
  }

  public getColWidth(col: number): number {
    return this._colWidths.get(col) ?? this._defaultColWidth;
  }

  public getRowHeight(row: number): number {
    return this._rowHeights.get(row) ?? this._defaultRowHeight;
  }

  public setColWidth(col: number, width: number): void {
    this._colWidths.set(col, width);
  }

  public setRowHeight(row: number, height: number): void {
    this._rowHeights.set(row, height);
  }

  public getColX(col: number): number {
    let x = 0;
    for (let i = 0; i < col; i++) {
      x += this.getColWidth(i);
    }
    return x;
  }

  public getRowY(row: number): number {
    let y = 0;
    for (let i = 0; i < row; i++) {
      y += this.getRowHeight(i);
    }
    return y;
  }

  public ensureCellVisible(row: number, col: number): void {
    const cellX = this.getColX(col);
    const cellY = this.getRowY(row);
    const cellW = this.getColWidth(col);
    const cellH = this.getRowHeight(row);

    const viewWidth = this._canvas.clientWidth - this._headerWidth;
    const viewHeight = this._canvas.clientHeight - this._headerHeight;

    let newScrollX = this._scrollX;
    let newScrollY = this._scrollY;

    if (cellX < this._scrollX) {
      newScrollX = cellX;
    } else if (cellX + cellW > this._scrollX + viewWidth) {
      newScrollX = cellX + cellW - viewWidth;
    }

    if (cellY < this._scrollY) {
      newScrollY = cellY;
    } else if (cellY + cellH > this._scrollY + viewHeight) {
      newScrollY = cellY + cellH - viewHeight;
    }

    this._scrollX = Math.max(0, newScrollX);
    this._scrollY = Math.max(0, newScrollY);
  }

  public getSelectedCol(x: number): number {
    const targetX = x + this._scrollX;

    let col = -1, accX = 0;
    for (let c = 0; c < this._columnCount; c++) {
      const w = this.getColWidth(c);
      if (targetX >= accX && targetX < accX + w) {
        col = c;
        break;
      }
      accX += w;
    }
    return col;
  }

  public getSelectedRow(y: number): number {
    const targetY = y + this._scrollY;

    let row = -1, accY = 0;
    for (let r = 0; r < this._rowCount; r++) {
      const h = this.getRowHeight(r);
      if (targetY >= accY && targetY < accY + h) {
        row = r;
        break;
      }
      accY += h;
    }
    return row;
  }

  public getSelectedCell(x: number, y: number): { row: number; col: number } | null {
    const row = this.getSelectedRow(y);
    const col = this.getSelectedCol(x);
    return (row >= 0 && col >= 0) ? { row, col } : null;
  }

  public resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;

    const width = this._canvas.clientWidth;
    const height = this._canvas.clientHeight;

    this._canvas.width = width * dpr;
    this._canvas.height = height * dpr;

    this._ctx.scale(dpr, dpr);
  }
}