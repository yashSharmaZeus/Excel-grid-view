import type { IMouseControl } from "../Interface/IMouseControl.js";
import { SelectionManager } from "./SelectionManager.js";
import type { ViewportManager } from "./ViewportManager.js";

export class ColumnHeaderSelect implements IMouseControl {
    constructor(
        private rowCount: number,
        private selectionManager: SelectionManager,
        private viewport: ViewportManager,
        private summary: () => void,
    ) { }

    hitTest(x: number, y: number): boolean {
        const res: boolean = y < 0;
        if (res) {
            this.viewport.setCursorStyle("cell")
        }
        return res;
    }

    onDown(x: number, y: number): void {
        this.selectionManager.isDragging = true;
        const col = this.selectionManager.getSelectedCol(x);
        this.selectionManager.selectedFirst = { row: 0, col };
        this.selectionManager.selectedLast = { row: this.rowCount - 1, col };
        this.selectionManager.selectCell(0, col);
        this.viewport.ensureCellVisible(0, col);
        this.summary();
        this.viewport.onRefresh();
    }

    onMove(x: number, y: number): void {
        if (!this.selectionManager.isDragging) return;

        const col = this.selectionManager.getSelectedCol(x);
        this.selectionManager.selectedLast = { row: this.rowCount - 1, col };

        this.viewport.onRefresh();
    }
    onUp(): void {
        this.selectionManager.isDragging = false;
        this.summary()
    }
}