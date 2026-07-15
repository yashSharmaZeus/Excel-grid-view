import { Data } from "./Data.js";
import { Render } from "./Render.js";
import { HistoryManager } from "./Managers/HistoryManager.js";
import { EventManager } from "./Managers/EventManager.js";
// import type {  } from "./GridController.js";
import type { IGridController } from "./Interface/IGridController.js";
import { FormulaEngine } from "./FormulaEngine.js";
import { SummaryCalculator } from "./SummaryCalculator.js";
import { ViewportManager } from "./Managers/ViewportManager.js";
import { ResizeManager } from "./Managers/ResizeManager.js";
import { SelectionManager } from "./Managers/SelectionManager.js";
import { EditManager } from "./Managers/EditManager.js";

class ExcelGrid implements IGridController {
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

  private _headerHeight: number = 25;
  private _headerWidth: number = 50;

  private renderer = new Render();

  private viewport: ViewportManager;
  private resizeManager: ResizeManager;
  private selectionManager: SelectionManager;
  private editManager: EditManager;

  constructor(canvasId: string, rowCount: number, columnCunt: number, data: Data) {
    console.log(canvasId)
    this.data = data;
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCount = columnCunt;
    this._engine = new FormulaEngine(this.data);
    this._summaryCalculator = new SummaryCalculator(this.data);

    this.viewport = new ViewportManager(
      this._canvas, this._ctx, this._rowCount, this._columnCount,
      this._defaultRowHeight, this._defaultColWidth, this._headerWidth, this._headerHeight,
    );
    this.resizeManager = new ResizeManager(
      this.viewport, this.history, this._rowCount, this._columnCount, () => this.refresh(),
    );
    this.selectionManager = new SelectionManager(this.viewport);
    this.editManager = new EditManager(
      this._canvas, this.data, this.viewport, this._engine, this.history,
      this._headerWidth, this._headerHeight, () => this.refresh(),
    );

    new EventManager(this._canvas, this, this._headerWidth, this._headerHeight, this._rowCount, this._columnCount).bind();
    this.viewport.resizeCanvas();
    this.renderCanvas();
  }

  // --- delegated selection state (EventManager reads/writes these directly) ---
  public get isDragging(): boolean { return this.selectionManager.isDragging; }
  public set isDragging(value: boolean) { this.selectionManager.isDragging = value; }
  public get selectedFirst() { return this.selectionManager.selectedFirst; }
  public set selectedFirst(value) { this.selectionManager.selectedFirst = value; }
  public get selectedLast() { return this.selectionManager.selectedLast; }
  public set selectedLast(value) { this.selectionManager.selectedLast = value; }

  // --- viewport / scroll ---
  public getScrollX(): number { return this.viewport.getScrollX(); }
  public getScrollY(): number { return this.viewport.getScrollY(); }
  public setScroll(x: number, y: number): void { this.viewport.setScroll(x, y); }
  public ensureCellVisible(row: number, col: number): void { this.viewport.ensureCellVisible(row, col); }

  // --- resize ---
  public startResize(type: 'col' | 'row', index: number, x: number, y: number): void {
    this.resizeManager.startResize(type, index, x, y);
  }
  public updateResize(x: number, y: number): void { this.resizeManager.updateResize(x, y); }
  public endResize(): void { this.resizeManager.endResize(); }
  public isResizing(): boolean { return this.resizeManager.isResizing(); }
  public getResizingTarget(x: number, y: number): { type: 'col' | 'row'; index: number } | null {
    return this.resizeManager.getResizingTarget(x, y);
  }

  // --- selection ---
  public selectCell(row: number, col: number): void { this.selectionManager.selectCell(row, col); }
  public getActiveCell(): { row: number; col: number } | null { return this.selectionManager.getActiveCell(); }
  public getSelectedCell(x: number, y: number): { row: number; col: number } | null {
    return this.selectionManager.getSelectedCell(x, y);
  }
  public getSelectedRow(y: number): number { return this.selectionManager.getSelectedRow(y); }
  public getSelectedCol(x: number): number { return this.selectionManager.getSelectedCol(x); }

  public summary(): void {
    if (!this.selectedFirst || !this.selectedLast) return;
    const col1 = this.selectedFirst.col;
    const col2 = this.selectedLast.col;
    const row1 = this.selectedFirst.row;
    const row2 = this.selectedLast.row;
    this._summaryCalculator.setValues(col1, col2, row1, row2);
  }

  // --- editing ---
  public isEditing(): boolean { return this.editManager.isEditing(); }
  public getInputElement(): HTMLInputElement | null { return this.editManager.getInputElement(); }
  public startEdit(row: number, col: number): void { this.editManager.startEdit(row, col); }
  public commitEdit(): void { this.editManager.commitEdit(); }
  public cancelEdit(): void { this.editManager.cancelEdit(); }
  public setCellValue(row: number, col: number, value: string): void {
    this.editManager.setCellValue(row, col, value);
  }

  // --- undo/redo ---
  public undo(): void { this.history.undo(); }
  public redo(): void { this.history.redo(); }

  // --- rendering / lifecycle ---
  public handleWindowResize(): void { this.viewport.resizeCanvas(); }

  private renderCanvas(): void {
    this.renderer.render({
      ctx: this._ctx,
      canvasWidth: this._canvas.clientWidth,
      canvasHeight: this._canvas.clientHeight,
      rowCount: this._rowCount,
      colCount: this._columnCount,
      headerWidth: this._headerWidth,
      headerHeight: this._headerHeight,
      scrollX: this.viewport.getScrollX(),
      scrollY: this.viewport.getScrollY(),
      getRowHeight: this.viewport.getRowHeight.bind(this.viewport),
      getColWidth: this.viewport.getColWidth.bind(this.viewport),
      getRowY: this.viewport.getRowY.bind(this.viewport),
      getColX: this.viewport.getColX.bind(this.viewport),
      selectedCell: this.selectionManager.getActiveCell(),
      input: this.editManager.getInputElement(),
      data: this.data,
      isDragging: this.selectionManager.isDragging,
      selectedFirst: this.selectionManager.selectedFirst,
      selectedLast: this.selectionManager.selectedLast,
    });
  }

  public refresh(): void {
    this.renderCanvas();
  }
}

export { ExcelGrid };