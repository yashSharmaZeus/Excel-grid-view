import type { CellData } from "../Model/CellModel.js";
import type { ICommand } from "../Interface/ICommand.js";

export class SetCellCommand implements ICommand {
    constructor(
        private setter: (row: number, col: number, value: CellData | null) => void,
        private row: number,
        private col: number,
        private oldValue: CellData | null,
        private newValue: CellData | null
    ) { }

    undo(): void {
        this.setter(this.row, this.col, this.oldValue);
    }

    redo(): void {
        this.setter(this.row, this.col, this.newValue);
    }
}
export class SetResizeCommand implements ICommand {
    constructor(
        private resize: ( index: number, size: number | null) => void,
        // private type: 'col' | 'row',
        private index: number,
        private oldValue: number,
        private newValue: number
    ) { }

    undo(): void {
        this.resize( this.index, this.oldValue);
    }

    redo(): void {
        this.resize( this.index, this.newValue);
    }
}

// export class SetResizeCommand implements ICommand {
//     constructor(
//         private resize: (type: 'row' | 'col', index: number, size: number | null) => void,
//         private type: 'col' | 'row',
//         private index: number,
//         private oldValue: number,
//         private newValue: number
//     ) { }

//     undo(): void {
//         this.resize(this.type, this.index, this.oldValue);
//     }

//     redo(): void {
//         this.resize(this.type, this.index, this.newValue);
//     }
// }

export class HistoryManager {
    private undoStack: ICommand[] = [];
    private redoStack: ICommand[] = [];

    constructor(private maxSize: number = 100) { }

    public execute(command: ICommand): void {
        command.redo();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    public undo(): boolean {
        const command = this.undoStack.pop();
        if (!command) return false;
        command.undo();
        this.redoStack.push(command);
        return true;
    }

    public redo(): boolean {
        const command = this.redoStack.pop();
        if (!command) return false;
        command.redo();
        this.undoStack.push(command);
        return true;
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}