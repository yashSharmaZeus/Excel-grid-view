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

  private _headerHeight: number = 25;
  private _headerWidth: number = 50;

  private _input: HTMLInputElement | null = null;
  private _editingCell: { row: number; col: number } | null = null;
  private _selectedCell: { row: number; col: number } | null = null;

  private _rowHeights = new Map<number, number>();
  private _colWidths = new Map<number, number>();
  private _resizing: { type: 'col' | 'row'; index: number; startPos: number; startSize: number } | null = null;
  private readonly RESIZE_MARGIN = 5;

  constructor(canvasId: string, rowCount: number, columnCunt: number) {
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCunt = columnCunt;

    this.canvasEventsBinding();
    this.resizeCanvas();
    this.renderCanvas();
  }

  private getColWidth(col: number) {
    return this._colWidths.get(col) ?? this._defaultColWidth;
  }

  private getRowHeight(col: number) {
    return this._rowHeights.get(col) ?? this._defaultRowHeight;
  }

  private getColX(col: number): number {
    let x = 0;
    for (let i = 0; i < col; i++) {
      x += this.getColWidth(i);
    }
    return x;
  }

  private getRowY(row: number): number {
    let y = 0;
    for (let i = 0; i < row; i++) {
      y += this.getRowHeight(i);
    }
    return y;
  }

  private getResizingTarget(x: number, y: number): { type: 'col' | 'row'; index: number } | null {
    const targetX = x + this._scrollX;
    const targetY = y + this._scrollY;

    let accX = 0;
    for (let c = 0; c < this._columnCunt; c++) {
      accX += this.getColWidth(c);
      if (Math.abs(targetX - accX) <= this.RESIZE_MARGIN) return { type: 'col', index: c };
      if (targetX < accX) break;
    }
    let accY = 0;
    for (let r = 0; r < this._rowCount; r++) {
      accY += this.getRowHeight(r);
      if (Math.abs(targetY - accY) <= this.RESIZE_MARGIN) return { type: 'row', index: r };
      if (targetY < accY) break;
    }
    return null;
  }

  private createInputBox(): HTMLInputElement {
    const input = document.createElement('input');
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '2px solid #bc04ff';
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

  private getData(row:number,col:number):CellData|null{
    return this._data.get(`${row},${col}`)||null;
  }

  

  private startEdit(row: number, col: number): void {
    if (!this._input) {
      this._input = this.createInputBox();
    }

    const x = this.getColX(col) - this._scrollX;
    const y = this.getRowY(row) - this._scrollY;
    const w = this.getColWidth(col);
    const h = this.getRowHeight(row);


    const cellData = this._data.get(`${row},${col}`);

    this._input.style.left = (x + this._headerWidth) + 'px';
    this._input.style.top = (y + this._headerHeight) + 'px';
    this._input.style.width = w + 'px';
    this._input.style.height = h + 'px';
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

    let startCol = 0, accX = 0;
    while (accX + this.getColWidth(startCol) < this._scrollX && startCol < this._columnCunt - 1) {
      accX += this.getColWidth(startCol);
      startCol++;
    }
    let endCol = startCol, x2 = accX;
    while (x2 < this._scrollX + width && endCol < this._columnCunt - 1) {
      x2 += this.getColWidth(endCol);
      endCol++;
    }

    let startRow = 0, accY = 0;
    while (accY + this.getRowHeight(startRow) < this._scrollY && startRow < this._rowCount - 1) {
      accY += this.getRowHeight(startRow);
      startRow++;
    }
    let endRow = startRow, y2 = accY;
    while (y2 < this._scrollY + height && endRow < this._rowCount - 1) {
      y2 += this.getRowHeight(endRow);
      endRow++;
    }

    if (this._selectedCell) {
      const w = this.getColWidth(this._selectedCell.col);
      const h = this.getRowHeight(this._selectedCell.row);

      const selectX = this.getColX(this._selectedCell.col) + this._headerWidth - this._scrollX;
      const selectY = this.getRowY(this._selectedCell.row) + this._headerHeight - this._scrollY;

      this._ctx.strokeStyle = '#bc04ff';
      this._ctx.fillStyle = '#fb26ff10'
      this._ctx.fillRect(selectX, selectY, w, h)
      this._ctx.lineWidth = 2;
      this._ctx.strokeRect(selectX, selectY, w, h);
      if (this._input) {
        this._input.style.left = selectX + 'px';
        this._input.style.top = selectY + 'px';
      }
    }

    for (let r = startRow; r <= endRow; r++) {
      const y = this.getRowY(r) + this._headerHeight - this._scrollY;
      const h = this.getRowHeight(r);

      for (let c = startCol; c <= endCol; c++) {

        const x = this.getColX(c) + this._headerWidth - this._scrollX;
        const w = this.getColWidth(c);

        this._ctx.strokeStyle = "#aeaeae";
        this._ctx.lineWidth = 1;
        this._ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w, h);

        const cellData = this._data.get(`${r},${c}`);
        if (cellData && cellData.value) {
          this._ctx.fillStyle = '#000000';
          this._ctx.fillText(cellData.value, x + 5, y + (h / 2), w - 10);
        }
      }


      this._ctx.fillStyle = '#eacef6'
      this._ctx.fillRect(0, Math.floor(y) + 0.5, this._headerWidth, h)
      this._ctx.strokeStyle = "#000000";
      this._ctx.lineWidth = 1;
      this._ctx.fillStyle = '#000000'
      this._ctx.strokeRect(0, Math.floor(y) + 0.5, this._headerWidth, h);
      this._ctx.fillText((r + 1).toString(), 20, y + (this._headerHeight / 2));
    }

    for (let c = startCol; c <= endCol; c++) {
      const x = this.getColX(c) + this._headerWidth - this._scrollX;
      const w = this.getColWidth(c);

      console.log(c)
      this._ctx.fillStyle = '#eacef6'
      this._ctx.fillRect(Math.floor(x) + 0.5, 0, w, this._headerHeight)
      this._ctx.strokeStyle = "#000000";
      this._ctx.lineWidth = 1;
      this._ctx.fillStyle = '#000000'
      this._ctx.strokeRect(Math.floor(x) + 0.5, 0, w, this._headerHeight);
      let ch: string;
      if (c < 26) {
        ch = String.fromCharCode(c + 65);
      } else {
        let remainder = c % 26;
        ch = String.fromCharCode((c / 26) + 64) + String.fromCharCode(remainder + 65);
      }
      this._ctx.fillText(ch, x + 5, (this._headerHeight / 2));
    }

    this._ctx.fillStyle = '#dfa9ff'
    this._ctx.fillRect(0, 0, this._headerWidth, this._headerHeight)
    this._ctx.strokeRect(0, 0, this._headerWidth, this._headerHeight);

  }

  private getSelectedCell(x: number, y: number): { row: number, col: number } | null {
    const targetX = x + this._scrollX;
    const targetY = y + this._scrollY;

    let col = -1, accX = 0;
    for (let c = 0; c < this._columnCunt; c++) {
      const w = this.getColWidth(c);
      if (targetX >= accX && targetX < accX + w) {
        col = c;
        break
      }
      accX += w;
    }
    let row = -1, accY = 0;
    for (let r = 0; r < this._rowCount; r++) {
      const h = this.getRowHeight(r);
      if (targetY >= accY && targetY < accY + h) {
        row = r;
        break
      }
      accY += h;
    }
    return (row >= 0 && col >= 0) ? { row, col } : null;

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
      const mouseX = event.clientX - this._headerWidth - rect.left;
      const mouseY = event.clientY - this._headerHeight - rect.top;

      const target = this.getResizingTarget(mouseX, mouseY);
      if (target) {
        const startSize = target.type === 'col'
          ? this.getColWidth(target.index)
          : this.getRowHeight(target.index);
        const startPos = target.type === 'col' ? mouseX : mouseY;
        this._resizing = { type: target.type, index: target.index, startPos, startSize };
        return;
      }

      const cell = this.getSelectedCell(mouseX, mouseY);
      if (cell) {
        this._selectedCell = cell;
        this.renderCanvas();
      }
    })

    this._canvas.addEventListener("dblclick", (event) => {

      const rect = this._canvas.getBoundingClientRect();
      const mouseX = event.clientX - this._headerWidth - rect.left;
      const mouseY = event.clientY - this._headerHeight - rect.left;

      const cell = this.getSelectedCell(mouseX, mouseY);
      if (cell) {
        this._editingCell = cell;
        this.startEdit(cell.row, cell.col);
      }
    })

    this._canvas.addEventListener("mousemove", (event) => {
      const rect = this._canvas.getBoundingClientRect();
      const mouseX = event.clientX - this._headerWidth - rect.left;
      const mouseY = event.clientY - this._headerHeight - rect.top;

      if (this._resizing) {
        const delta = this._resizing.type === 'col'
          ? mouseX - this._resizing.startPos
          : mouseY - this._resizing.startPos;
        const newSize = Math.max(20, this._resizing.startSize + delta);

        if (this._resizing.type === 'col') {
          this._colWidths.set(this._resizing.index, newSize);
        }
        if (this._resizing.type === 'row') {
          this._rowHeights.set(this._resizing.index, newSize);
        }
        this.renderCanvas();
        return;
      }
      const target = this.getResizingTarget(mouseX, mouseY);
      this._canvas.style.cursor = target
        ? (target.type === 'col' ? 'col-resize' : 'row-resize')
        : 'cell';
    });

    window.addEventListener("mouseup", () => {
      this._resizing = null;
    });
    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.renderCanvas();
    });


  }

  public setCellValue(row: number, col: number, value: string): void {
    const key = `${row},${col}`;
    this._data.set(key, { value });
  }

  public refresh(): void {
    this.renderCanvas();
  }
}

export { ExcelGrid };