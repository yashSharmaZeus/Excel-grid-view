import { Data } from "./Data.js";
import { Render } from "./Render.js";
import { HistoryManager } from "./Managers/HistoryManager.js";
import { EventManager } from "./Managers/EventManager.js";
import { FormulaEngine } from "./FormulaEngine.js";
import { SummaryCalculator } from "./Helper/SummaryCalculator.js";
import { ViewportManager } from "./Managers/ViewportManager.js";
// import { ResizeManager } from "./Managers/ResizeManager.js";
import { SelectionManager } from "./Managers/SelectionManager.js";
import { EditManager } from "./Managers/EditManager.js";

class ExcelGrid {
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
  // private resizeManager: ResizeManager;
  private selectionManager: SelectionManager;
  private editManager: EditManager;

  constructor(canvasId: string, rowCount: number, columnCunt: number, data: Data) {
    this.data = data;
    this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d')!;
    this._rowCount = rowCount;
    this._columnCount = columnCunt;
    this._engine = new FormulaEngine(this.data);
    this._summaryCalculator = new SummaryCalculator(this.data);

    this.viewport = new ViewportManager(
      this._canvas, this._ctx, this._rowCount, this._columnCount,
      this._defaultRowHeight, this._defaultColWidth, this._headerWidth, this._headerHeight, () => this.refresh()
    );
    this.selectionManager = new SelectionManager(this.viewport);
    this.editManager = new EditManager(
      this._canvas, this.data, this.viewport, this._engine, this.history,
      this._headerWidth, this._headerHeight, () => this.refresh(),
    );
    
    new EventManager({
      canvas: this._canvas,
      selectionManager: this.selectionManager,
      viewPort: this.viewport,
      editManager: this.editManager,
      summaryCalculator: this._summaryCalculator,
      history: this.history,
      headerWidth: this._headerWidth,
      headerHeight: this._headerHeight,
      rowCount: this._rowCount,
      colCount: this._columnCount,
      onRefresh: () => this.refresh(),
    }).bind();
    this.viewport.resizeCanvas();
    this.renderCanvas();
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