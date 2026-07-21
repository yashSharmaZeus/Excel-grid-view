import type { IMouseControl } from "../Interface/IMouseControl.js";
import type { CellData } from "../Model/CellModel.js";
import type { SelectionManager } from "./SelectionManager.js";
import { ViewportManager } from "./ViewportManager.js";

export class CellSelect implements IMouseControl {
    private selectedCell: { row: number, col: number };
    constructor(
        private viewport: ViewportManager,
        private selectionManager: SelectionManager,
        private summary: ()=>void,
    ) {
        this.selectedCell = { row: -1, col: -1 };
    }

    hitTest(x: number, y: number): boolean {
        const cell = this.selectionManager.getSelectedCell(x, y);
        const res: boolean = cell !== null;
        if (cell) {
            this.selectedCell = cell;
            this.viewport.setCursorStyle("cell");
        }
        return res;
    }

    onDown(x: number, y: number): void {
        this.selectionManager.isDragging = true;

        const cell = this.selectedCell;
        this.viewport.ensureCellVisible(cell.row, cell.col);
        this.selectionManager.selectedFirst = { row: cell.row, col: cell.col };
        this.selectionManager.selectedLast = { row: cell.row, col: cell.col };
        this.selectionManager.selectCell(cell.row, cell.col);
        this.summary();
        this.viewport.onRefresh();
    }

    onMove(x: number, y: number): void {
        if (!this.selectionManager.isDragging) return;
        const cell = this.selectionManager.getSelectedCell(x,y);
        if (!cell) return;
        this.selectionManager.selectedLast = { row: cell.row, col: cell.col };
        this.summary();
        this.viewport.onRefresh();
    }

    onUp(): void {
        this.selectionManager.isDragging = false;
    }

}