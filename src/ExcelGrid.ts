import { Data } from "./Data.js";
import { Render } from "./Render.js";
import { HistoryManager, SetCellCommand } from "./History.js";
import { EventManager } from "./EventManager.js";
import type { GridController } from "./GridController.js";
import { FormulaEngine } from "./FormulaEngine.js";
import type { CellData } from "./Type.js";
import { SummaryCalculator } from "./SummaryCalculator.js";



class ExcelGrid implements GridController {
  private _canvas: HTMLCanvasElement;

  private _ctx: CanvasRenderingContext2D;

  private data: Data;
  private _engine: FormulaEngine;
  private history = new HistoryManager();
  private _summaryCalculator: SummaryCalculator;
  private _rowCount: number;
  private _columnCount: number;
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

  private renderer = new Render();
  public isDragging = false;
  public selectedFirst = { row: -1, col: -1 };
  public selectedLast = { row: -1, col: -1 };

  constructor(canvasId: string, rowCount: number, columnCunt: number, data: Data) {
    this.data = data;
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCount = columnCunt;
    this._engine = new FormulaEngine(this.data)
    this._summaryCalculator = new SummaryCalculator(this.data);

    new EventManager(this._canvas, this, this._headerWidth, this._headerHeight, this._rowCount, this._columnCount,).bind();
    this.resizeCanvas();
    this.renderCanvas();
  }

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

  public addScrollX(col: number): void {
    this._scrollX += this.getColWidth(col);
  }

  public addScrollY(row: number): void {
    this._scrollY += this.getRowHeight(row);
  }

  public subtractScrollX(col: number): void {
      this._scrollX = Math.max(0,this._scrollX - this.getColWidth(col));
  }

  public subtractScrollY(row: number): void {
    this._scrollY = Math.max(0, this._scrollY -this.getRowHeight(row));
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

  public startResize(type: 'col' | 'row', index: number, x: number, y: number): void {
    const startSize = type === 'col' ? this.getColWidth(index) : this.getRowHeight(index);
    const startPos = type === 'col' ? x : y;
    this._resizing = { type, index, startPos, startSize };
  }

  public updateResize(x: number, y: number): void {
    if (!this._resizing) return;
    const delta = this._resizing.type === 'col'
      ? x - this._resizing.startPos
      : y - this._resizing.startPos;
    const newSize = Math.max(20, this._resizing.startSize + delta);

    if (this._resizing.type === 'col') {
      this._colWidths.set(this._resizing.index, newSize);
    } else {
      this._rowHeights.set(this._resizing.index, newSize);
    }

  }

  public endResize(): void {
    this._resizing = null;
  }

  public isResizing(): boolean {
    return this._resizing !== null;
  }

  public summary(): void {
    const col1: number = this.selectedFirst.col;
    const col2: number = this.selectedLast.col;
    const row1: number = this.selectedFirst.row;
    const row2: number = this.selectedLast.row;
    this._summaryCalculator.setValues(col1, col2, row1, row2)
  }

  public getResizingTarget(x: number, y: number): { type: 'col' | 'row'; index: number } | null {
    const targetX = x + this._scrollX;
    const targetY = y + this._scrollY;

    let accX = 0;
    for (let c = 0; c < this._columnCount; c++) {
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

  public selectCell(row: number, col: number): void {
    this._selectedCell = { row, col };
  }
  public isEditing(): boolean {
    return this._editingCell !== null;
  }

  public getInputElement(): HTMLInputElement | null {
    return this._input;
  }

  public undo(): void {
    this.history.undo();
  }

  public redo(): void {
    this.history.redo();
  }

  public handleWindowResize(): void {
    this.resizeCanvas();
  }

  public getSelectedCol(x: number): number {
    const targetX = x + this._scrollX;

    let col = -1, accX = 0;
    for (let c = 0; c < this._columnCount; c++) {
      const w = this.getColWidth(c);
      if (targetX >= accX && targetX < accX + w) {
        col = c;
        break
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
        break
      }
      accY += h;
    }
    return row;
  }

  private createInputBox(): HTMLInputElement {
    const input = document.createElement('input');
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '2px solid #04ffab';
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

  public startEdit(row: number, col: number): void {
    this._editingCell = { row, col };
    if (!this._input) {
      this._input = this.createInputBox();
    }

    const x = this.getColX(col) - this._scrollX;
    const y = this.getRowY(row) - this._scrollY;
    const w = this.getColWidth(col);
    const h = this.getRowHeight(row);



    const cellData = this.data.getData(row, col);

    this._input.style.left = (x + this._headerWidth) + 'px';
    this._input.style.top = (y + this._headerHeight) + 'px';
    this._input.style.width = w + 'px';
    this._input.style.height = h + 'px';
    this._input.style.display = "block";
    this._input.value = cellData?.value ?? " ";

    this._input.focus();
    this._input.select();
  }

  public commitEdit(): void {
    if (!this._editingCell || !this._input) return;

    const { row, col } = this._editingCell;
    const value = this._input.value;

    this.setCellValue(row, col, value);

    this._input.style.display = 'none';
    this._editingCell = null;
  }

  public cancelEdit(): void {
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
    this.renderer.render({
      ctx: this._ctx,
      canvasWidth: this._canvas.clientWidth,
      canvasHeight: this._canvas.clientHeight,
      rowCount: this._rowCount,
      colCount: this._columnCount,
      headerWidth: this._headerWidth,
      headerHeight: this._headerHeight,
      scrollX: this._scrollX,
      scrollY: this._scrollY,
      getRowHeight: this.getRowHeight.bind(this),
      getColWidth: this.getColWidth.bind(this),
      getRowY: this.getRowY.bind(this),
      getColX: this.getColX.bind(this),
      selectedCell: this._selectedCell,
      input: this._input,
      data: this.data,
      isDragging: this.isDragging,
      selectedFirst: this.selectedFirst,
      selectedLast: this.selectedLast,
    });
  }

  public getSelectedCell(x: number, y: number): { row: number, col: number } | null {
    const row = this.getSelectedRow(y);
    const col = this.getSelectedCol(x);

    return (row >= 0 && col >= 0) ? { row, col } : null;

  }

  public setCellValue(row: number, col: number, value: string): void {
    const oldValue = this.data.getData(row, col);
    let cellValueToStore = value;
    if (value.trim().startsWith("=")) {
      const normalizedFormula = this._engine.normalizeFormula(value);
      this.data.setCellData(row, col, { value: normalizedFormula, row, col });
      try {
        const calculatedResult = this._engine.getValueAt(row, col) as string;
        cellValueToStore = calculatedResult;
      } catch (err) {
        cellValueToStore = "#ERROR!";
      }
    }

    const newValue: CellData = { ...oldValue, value: cellValueToStore, row, col };
    const command = new SetCellCommand(
      (r, c, cellDataPayload) => {
        this.data.setCellData(r, c, cellDataPayload);
        this.refresh();
      },
      row, col, oldValue, newValue
    );
    this.history.execute(command);
  }

  public refresh(): void {
    this.renderCanvas();
  }
}

export { ExcelGrid };