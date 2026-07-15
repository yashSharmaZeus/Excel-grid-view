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