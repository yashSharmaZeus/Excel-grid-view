import type { Data } from "../Data.js";
import type { ViewportManager } from "./ViewportManager.js";
import type { FormulaEngine } from "../FormulaEngine.js";
import { HistoryManager, SetCellCommand } from "./HistoryManager.js";
import { CellData } from "../Model/CellModel.js";

export class EditManager {
  private _input: HTMLInputElement | null = null;
  private _editingCell: { row: number; col: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private data: Data,
    private viewport: ViewportManager,
    private engine: FormulaEngine,
    private history: HistoryManager,
    private headerWidth: number,
    private headerHeight: number,
    private onRefresh: () => void,
  ) { }

  public isEditing(): boolean {
    return this._editingCell !== null;
  }

  public getInputElement(): HTMLInputElement | null {
    return this._input;
  }

  private createInputBox(): HTMLInputElement {
    const input = document.createElement('input');
    input.id = "input-cell"
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '2px solid #04ffab';
    input.style.position = "absolute";
    this.canvas.parentElement?.appendChild(input);

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.commitEdit();
        this.onRefresh();
      } else if (event.key === 'Escape') {
        this.cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      this.commitEdit();
      this.onRefresh();
    });

    return input;
  }

  public startEdit(row: number, col: number): void {
    this._editingCell = { row, col };
    if (!this._input) {
      this._input = this.createInputBox();
    }

    const x = this.viewport.getColX(col) - this.viewport.getScrollX();
    const y = this.viewport.getRowY(row) - this.viewport.getScrollY();
    const w = this.viewport.getColWidth(col);
    const h = this.viewport.getRowHeight(row);

    const cellData = this.data.getData(row, col);

    this._input.style.left = (x + this.headerWidth) + 'px';
    this._input.style.top = (y + this.headerHeight) + 'px';
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

  public setCellValue(row: number, col: number, value: string): void {
    const oldValue = this.data.getData(row, col);
    let cellValueToStore = value;
    if (value.trim().startsWith("=")) {
      const normalizedFormula = this.engine.normalizeFormula(value);
      this.data.setCellData(row, col,  new CellData(normalizedFormula, row, col));
      try {
        const calculatedResult = this.engine.getValueAt(row, col) as string;
        cellValueToStore = calculatedResult;
      } catch (err) {
        cellValueToStore = "#ERROR!";
      }
    }

    const newValue: CellData = new CellData(cellValueToStore.toString(), row, col);
    const command = new SetCellCommand(
      (r, c, cellDataPayload) => {
        this.data.setCellData(r, c, cellDataPayload);
        this.onRefresh();
      },
      row, col, oldValue, newValue
    );
    this.history.execute(command);
  }
}