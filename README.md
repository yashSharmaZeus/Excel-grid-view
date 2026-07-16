# Excel-grid-view

Excel like spreadsheet grid built with TypeScript, HTML, Canvas, and vanilla css. Designed to comfortably handle 100,000 rows x 500 columns through virtual rendering, with cell editing, resizing, multi-mode selection, range summaries, and full undo/redo via command pattern.


### Objective
> Demonstrate that spreadsheet-grade UI can be built using OOPs design and canvas rendering

### Install and Run
```bash
npm install
npm run dev
```
open `index.html` in browser. Use **File** button in footer to load json dataset.

### Feature implemented 
1. Canvas rendered Grid (rows, columns, headers, grillings) 
1. Virtual render
1. 100,000 rows x 500 columns
1. Load 50,000 JSON records
1. Column resize
1. Row resize
1. Row/ Column/ range selection
1. Summary bar: Count, min, max, sum, avg
1. Undo/redo for edit and resize
1. Keyboard navigation (Arrow, Enter, Esc, Ctrl+z, Ctrl+y) 
1. Arithmetic operation support 

### Folder and class structure
```bash
Directory structure:
├── README.md
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── src/
    ├── Data.ts
    ├── ExcelGrid.ts
    ├── FormulaEngine.ts
    ├── index.ts
    ├── Render.ts
    ├── SummaryCalculator.ts
    ├── Helper/
    │   └── CellRef.ts
    ├── Interface/
    │   ├── ICommand.ts
    │   └── IGridController.ts
    ├── Managers/
    │   ├── EditManager.ts
    │   ├── EventManager.ts
    │   ├── HistoryManager.ts
    │   ├── ResizeManager.ts
    │   ├── SelectionManager.ts
    │   └── ViewportManager.ts
    └── Model/
        └── CellModel.ts

```

### OOP Concepts Applied

- **Encapsulation:** every manager keeps its state (_scrollX, _resizing, _selectedCell, _editingCell) private, exposed only through methods. 
- **Abstraction:** IGridController and ICommand define contracts; EventManager and HistoryManager code against those contracts, not concrete classes.
- **Polymorphism:** HistoryManager.execute(command) calls execute()/undo() on whatever ICommand it's given (SetCellCommand, SetResizeCommand) without knowing which one it is.
- **Composition over inheritance:** ExcelGrid has a `ViewportManager`, `ResizeManager`, `SelectionManager`, `EditManager`, `Render`, `FormulaEngine`, `SummaryCalculator`, `HistoryManager`, rather than inheriting from any of them. There's no natural "is-a" hierarchy among these concerns, so composition keeps each piece independently testable.
- **Constructor-based dependency injection:** managers receive their collaborators (`ViewportManager`, `HistoryManager`, a `refresh` callback) through the constructor instead of instantiating them internally.

### SOLID principle applied
1. Single Responsibility
1. Open/Closed
1. Liskov Substitution
1. Interface Segregation
1. Dependency Inversion

### Command Pattern and Undo/Redo

- **Contract**: `ICommand` defines `execute()` and `undo()`.
- **Commands**: `SetCellCommand` (old value ↔ new value), `SetResizeCommand` (old size ↔ new size).
- **Execution**: an action (commit an edit, finish a resize drag) constructs the relevant command with both the before and after state, then calls HistoryManager.execute(command), which runs execute() and pushes the command onto the undo stack, clearing the redo stack.
- **Undo/Redo**: `Ctrl+Z` calls HistoryManager.undo() (pops the undo stack, calls command.undo(), pushes onto the redo stack). `Ctrl+Y`/`Ctrl+Shift+Z` calls HistoryManager.redo() (the reverse). Because every command stores both states, multiple undo/redo operations replay in the correct order regardless of how many actions preceded them.


### Virtual Rendering Approach
- ViewportManager tracks the current scroll position.
- It calculates pixel offsets for rows and columns.
- It converts screen coordinates into grid indices.
- Overridden cell sizes are factored into calculations.

**Render Process**
- Render receives the scroll positions and dimensions.
- It identifies the first visible cell on screen.
- It loops forward to draw subsequent visible cells.
- Drawing stops when the canvas boundaries are reached.
- The system never processes the entire large grid.


### Data Generation and Loading
#### Data generation
data is generated using simple python script that generate 50,000 record.
```python
import json
import random

first_names = ["Samriddh", "jaydeep", "Smit", "Jay", "Rheetik", "Sahil"]
last_names = ["singh", "yadav", "patil", "sharma"]

repeated_list = []
total_rows = 50000

for i in range(total_rows):
    data = {
        "id": i + 1,
        "firstName": random.choice(first_names),
        "lastName": random.choice(last_names),
        "Age": random.randint(22, 65),          
        "Salary": random.randint(400000, 2500000) 
    }
    repeated_list.append(data)
    
    
    if (i + 1) % 10000 == 0:
        print(f"Data entered: row -> {i + 1}")


file_name = "dummy_data_1.json"
with open(file_name, "w") as json_file:
    json.dump(repeated_list, json_file, indent=4)

print(f"Successfully saved {total_rows} randomized items to {file_name}")
```
#### Data loading
- `JsonDataLoader`- reads a JSON array of row records and populates `Data` (`GridDataStore`) cell-by-cell, keyed by `"row,col"`.
- only cells with an actual value occupy memory. A 100,000 × 500 grid is never materialized as 50 million objects — a freshly loaded grid with 50,000 populated records holds roughly that many `CellModel` entries, not one per possible cell.


### Performance observations
- Virtual Rendering: Instead of rendering the entire 100,000 row by 500 column grid, the system calculates and draws only the exact cells visible in the current viewport.
- Large Data Handling: The JsonDataLoader efficiently parses 50,000 generated JSON records and inserts them into a sparse Map structure, minimizing memory overhead and load times.
- Initialization: Loading the entire application and parsing 50,000 records takes roughly ~100-200ms.

### Accessibility considerations
Keyboard Navigation: The grid is fully operable without a mouse. Users can traverse the grid using Arrow keys, open and commit edits using Enter, and safely discard changes using Escape.

### Known limitations and next improvements
- data is not persistent .
- copy/past functionality not present. 