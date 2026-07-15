import type { ViewportManager } from "./ViewportManager.js";

export class SelectionManager {
  public isDragging = false;
  public selectedFirst: { row: number; col: number } | null = null;
  public selectedLast: { row: number; col: number } | null = null;

  private _selectedCell: { row: number; col: number } | null = null;

  constructor(private viewport: ViewportManager) { }

  public selectCell(row: number, col: number): void {
    this._selectedCell = { row, col };
  }

  public getActiveCell(): { row: number; col: number } | null {
    return this._selectedCell;
  }

  public getSelectedCell(x: number, y: number): { row: number; col: number } | null {
    return this.viewport.getSelectedCell(x, y);
  }

  public getSelectedRow(y: number): number {
    return this.viewport.getSelectedRow(y);
  }

  public getSelectedCol(x: number): number {
    return this.viewport.getSelectedCol(x);
  }
}