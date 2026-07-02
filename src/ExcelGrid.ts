interface CellData {
  value: string;
  style?: {
    background: string;
    color: string;
  }
}

class ExcelGrid {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _data: Map<string, CellData> = new Map();

  private _rowCount: number;
  private _columnCunt: number;
  private _defaultRowHeight: number = 25;
  private _defaultColWidth: number = 100;

  private _scrollX: number = 0;
  private _scrollY: number = 0;

  private selectedCell: { row: number; col: number } | null = null;

  constructor(canvasId: string, rowCount: number, columnCunt: number) {
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCunt = columnCunt;

    this.canvasEventsBinding();
    this.resizeCanvas();
    this.renderCanvas();
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;

    const width = this._canvas.clientWidth;
    const height = this._canvas.clientHeight;

    this._canvas.width = width * dpr;
    this._canvas.height = height * dpr;

    this._ctx.scale(dpr, dpr);
  }

  private renderCanvas(): void {
    const width = this._canvas.clientWidth;
    const height = this._canvas.clientHeight;

    this._ctx.clearRect(0, 0, width, height);
    this._ctx.save();

    const startCol = Math.floor(this._scrollX / this._defaultColWidth);
    const endCol = Math.min(this._columnCunt - 1, Math.ceil((this._scrollX + width) / this._defaultColWidth));
    const startRow = Math.floor(this._scrollY / this._defaultRowHeight);
    const endRow = Math.min(this._rowCount - 1, Math.ceil((this._scrollY + height) / this._defaultRowHeight));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const x = (c * this._defaultColWidth) - this._scrollX;
        const y = (r * this._defaultRowHeight) - this._scrollY;

        this._ctx.strokeStyle = "#aeaeae";
        this._ctx.lineWidth = 1;
        this._ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, this._defaultColWidth, this._defaultRowHeight);

        const cellData = this._data.get(`${r},${c}`);
        if (cellData && cellData.value) {
          this._ctx.fillStyle = '#000000';
          this._ctx.fillText(
            cellData.value,
            x + 5,
            y + (this._defaultRowHeight / 2),
            this._defaultColWidth - 10
          );
        }
      }
    }
    if (this.selectedCell) {
      const selectX = (this.selectedCell.col * this._defaultColWidth) - this._scrollX;
      const selectY =  (this.selectedCell.row * this._defaultRowHeight) - this._scrollY;

      this._ctx.strokeStyle = '#bc04ff'; 
      this._ctx.lineWidth = 2;
      this._ctx.strokeRect(selectX, selectY, this._defaultColWidth, this._defaultRowHeight);
    }
  }

  private getSelectedCell(x: number, y: number): { row: number, col: number } | null {
    const selectedCellX = x + this._scrollX;
    const selectedCellY = y + this._scrollY;

    const col = Math.floor(selectedCellX / this._defaultColWidth)
    const row = Math.floor(selectedCellY / this._defaultRowHeight)
    if (row >= 0 && row < this._rowCount && col >= 0 && col < this._columnCunt) {
      return { row, col };
    }
    return null;
  }

  private canvasEventsBinding(): void {
    this._canvas.addEventListener("wheel", (event) => {
      event.preventDefault();

      this._scrollX = Math.max(0, this._scrollX + event.deltaX);
      this._scrollY = Math.max(0, this._scrollY + event.deltaY);
      this.renderCanvas();
    }, { passive: false });

    this._canvas.addEventListener("mousedown", (event)=>{
      const rect = this._canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const cell = this.getSelectedCell(mouseX,mouseY);
      if(cell){
        this.selectedCell = cell;
        this.renderCanvas();
      }
    })

    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.renderCanvas();
    });
  }

  public setCellValue(row: number, col: number, value: string): void {
    const key = `${row},${col}`;
    this._data.set(key, { value });
    this.renderCanvas();
  }
}

export { ExcelGrid };