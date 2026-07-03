interface CellData {
  value: string;
  style?: {
    background: string;
    color: string;
  }
}

class ExcelGrid {
  private _canvas: HTMLCanvasElement;
  // private input = document.createElement('input');
  private _ctx: CanvasRenderingContext2D;
  private _data: Map<string, CellData> = new Map();

  private _rowCount: number;
  private _columnCunt: number;
  private _defaultRowHeight: number = 25;
  private _defaultColWidth: number = 100;

  private _scrollX: number = 0;
  private _scrollY: number = 0;

  private _input: HTMLInputElement | null = null;
  private _editingCell: { row: number; col: number } | null = null;
  private _selectedCell: { row: number; col: number } | null = null;

  // private _rowHeight = new Map<number, number>();
  // private _colWidth = new Map<number, number>();
  // private _colOffset: number[] = [];
  // private _rowOverRideOffsets: { row: number; cumulativeDelta: number }[] = []
  // private _resizing: { type: 'col' | 'row'; index: number; startPos: number; startSize: number } | null = null;
  // private _HoverResize: { type: 'col' | 'row'; index: number } | null = null;

  // private _activeInputListener: ((e: KeyboardEvent) => void) | null = null;
  // private _activeBlurListener: (() => void) | null = null;

  constructor(canvasId: string, rowCount: number, columnCunt: number) {
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCunt = columnCunt;

    // this.rebuildColOffsets();
    this.canvasEventsBinding();
    this.resizeCanvas();
    this.renderCanvas();
  }

  // private getColWidth(col: number) {
  //   return this._colWidth.get(col) ?? this._defaultColWidth;
  // }

  // private getRowHeight(col: number) {
  //   return this._rowHeight.get(col) ?? this._defaultColWidth;
  // }

  // private getColumnX(col: number): number {
  //   let x = 0;
  //   for (let i = 0; i < col; i++) {
  //     x += this.getColWidth(i);
  //   }
  //   return x;
  // }

  // private getRowY(row: number): number {
  //   let y = 0;
  //   for (let i = 0; i < row; i++) {
  //     y += this.getRowHeight(i);
  //   }
  //   return y;
  // }

  // private rebuildColOffsets(): void {
  //   const offsets = new Array<number>(this._columnCunt + 1);
  //   offsets[0] = 0;
  //   for (let c = 0; c < this._columnCunt; c++) {
  //     offsets[c + 1] = offsets[c]! + this.getColWidth(c);
  //   }
  //   this._colOffset = offsets;
  // }

  // private rebuildRowOverrideOffsets(): void {
  //   const rows = Array.from(this._rowHeight.keys()).sort((a, b) => a - b);
  //   let cumulativeDelta = 0;
  //   const result: { row: number; cumulativeDelta: number }[] = [];
  //   for (const row of rows) {
  //     const delta = this._rowHeight.get(row)! - this._defaultRowHeight;
  //     cumulativeDelta += delta;
  //     result.push({ row, cumulativeDelta });
  //   }
  //   this._rowOverRideOffsets = result;
  // }

  // private getRowTop(row: number): number {
  //   let base = row * this._defaultRowHeight;

  //   let lo = 0, hi = this._rowOverRideOffsets.length;
  //   while (lo < hi) {
  //     const mid = (lo + hi) >> 1;
  //     if (this._rowOverRideOffsets[mid]!.row < row) lo = mid + 1;
  //     else hi = mid;
  //   }
  //   if (lo > 0) base += this._rowOverRideOffsets[lo - 1]!.cumulativeDelta;
  //   return base;
  // }

  // private rowAtY(y: number): number {
  //   let row = Math.floor(y / this._defaultRowHeight);
  //   while (this.getRowTop(row) > y) row--;
  //   while (this.getRowTop(row + 1) <= y) row++;
  //   return row;
  // }

  // private colAtX(x: number): number {
  //   let lo = 0, hi = this._colOffset.length - 1;
  //   while (lo < hi) {
  //     const mid = (lo + hi + 1) >> 1;
  //     if (this._colOffset[mid]! <= x) lo = mid;
  //     else hi = mid - 1;
  //   }
  //   return lo;
  // }


  private createInputBox(): HTMLInputElement {
    const input = document.createElement('input');
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = 'none';
    input.style.position = "absolute";
    this._canvas.parentElement?.appendChild(input);

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.commitEdit();
        this.refresh();
      } else if (event.key === 'Esc') {
        this.cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      this.commitEdit();
      this.refresh();
    });

    return input;
  }

  private startEdit(row: number, col: number): void {
    if (!this._input) {
      this._input = this.createInputBox();
    }

    const x = (col * this._defaultColWidth) - this._scrollX;
    const y = (row * this._defaultRowHeight) - this._scrollY;

    const cellData = this._data.get(`${row},${col}`);

    this._input.style.left = x + 'px';
    this._input.style.top = y + 'px';
    this._input.style.width = this._defaultColWidth + 'px';
    this._input.style.height = this._defaultRowHeight + 'px';
    this._input.style.display = "block";
    this._input.value = cellData?.value ?? " ";

    this._input.focus();
    this._input.select();
  }

  private commitEdit(): void {
    if (!this._editingCell || !this._input) return;

    const { row, col } = this._editingCell;
    const value = this._input.value;

    this.setCellValue(row, col, value);

    this._input.style.display = 'none';
    this._editingCell = null;
  }

  private cancelEdit(): void {
    if (!this._input) return;

    this._input.style.display = 'none';
    this._editingCell = null;
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
    // const startCol = this.colAtX(this._scrollX)
    // const endCol = this.colAtX(this._scrollX + width)
    // const startRow = this.rowAtY(this._scrollY)
    // const endRow = this.colAtX(this._scrollY + height)
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

    if (this._selectedCell) {
      const selectX = (this._selectedCell.col * this._defaultColWidth) - this._scrollX;
      const selectY = (this._selectedCell.row * this._defaultRowHeight) - this._scrollY;

      this._ctx.strokeStyle = '#bc04ff';
      this._ctx.fillStyle = '#fb26ff10'
      this._ctx.fillRect(selectX, selectY, this._defaultColWidth, this._defaultRowHeight)
      this._ctx.lineWidth = 2;
      this._ctx.strokeRect(selectX, selectY, this._defaultColWidth, this._defaultRowHeight);
      if (this._input) {
        this._input.style.left = selectX + 'px';
        this._input.style.top = selectY + 'px';
      }
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

    this._canvas.addEventListener("mousedown", (event) => {
      if (this._editingCell) {
        this.commitEdit();
      }
      const rect = this._canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const cell = this.getSelectedCell(mouseX, mouseY);
      if (cell) {
        this._selectedCell = cell;
        this.renderCanvas();
      }
    })

    this._canvas.addEventListener("dblclick", (event) => {

      const rect = this._canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.left;

      const cell = this.getSelectedCell(mouseX, mouseY);
      if (cell) {
        this._editingCell = cell;
        this.startEdit(cell.row, cell.col);
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
    // console.log(row, "  ", col, "  ", value);
    // console.log(this._data.get(key));
    // // this.renderCanvas();
  }

  public refresh(): void {
    console.log("rendering!!!!!!!!!!!!!!!!!")
    this.renderCanvas();
  }
}

export { ExcelGrid };