export interface GridController {

    getScrollX(): number;
    getScrollY(): number;
    setScroll(x: number, y: number): void;
    addScrollX(col: number): void;
    addScrollY(row: number): void;
    subtractScrollX(col: number): void
    subtractScrollY(row: number): void
    
    getResizingTarget(x: number, y: number): { type: 'col' | 'row'; index: number } | null;
    getSelectedCell(x: number, y: number): { row: number; col: number } | null;

    getSelectedRow(y: number): number;
    getSelectedCol(x: number): number;

    startResize(type: 'col' | 'row', index: number, x: number, y: number): void;
    updateResize(x: number, y: number): void;
    endResize(): void;
    isResizing(): boolean;

    selectCell(row: number, col: number): void;
    isDragging: boolean;
    selectedFirst: { row: number; col: number } | null;
    selectedLast: { row: number; col: number } | null;
    startEdit(row: number, col: number): void;
    commitEdit(): void;
    isEditing(): boolean;
    getInputElement(): HTMLInputElement | null;

    undo(): void;
    redo(): void;

    summary(): void;

    refresh(): void;
    handleWindowResize(): void;
}