import type { IMouseControl } from "../Interface/IMouseControl.js";
import type { SelectionManager } from "./SelectionManager.js";
import type { ViewportManager } from "./ViewportManager.js";

export class RowHeaderSelect implements IMouseControl {
    constructor(
        private colCount: number,
        private selectionManager: SelectionManager,
        private viewport: ViewportManager,
        private summary: () => void,
    ) { }

    hitTest(x: number): boolean {
        const res: boolean = x < 0;
        if (res) {
            this.viewport.setCursorStyle("cell")
        }
        return res;
    }

    onDown(_x: number, y: number): void {
        this.selectionManager.isDragging = true;

        const row = this.selectionManager.getSelectedRow(y);
        this.selectionManager.selectedFirst = { row: row, col: 0 };
        this.selectionManager.selectedLast = { row: row, col: this.colCount - 1 };
        this.selectionManager.selectCell(row, 0);
        this.viewport.ensureCellVisible(row, 0);
        this.summary();
        this.viewport.onRefresh();
    }

    onMove(_x: number, y: number): void {
        if (!this.selectionManager.isDragging) return;
        const row = this.selectionManager.getSelectedRow(y);

        this.selectionManager.selectedLast = { row: row, col: this.colCount - 1 };
        this.viewport.onRefresh();

        
    }
    onUp(): void {
        this.selectionManager.isDragging = false;
        this.summary()

    }
}
