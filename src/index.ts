import { ExcelGrid } from "./ExcelGrid.js";
import { Data } from "./Data.js";

type JSONRowData = Record<string, string | number | boolean | null | undefined>;

class Main {
  private rowCount: number ;
  private colCount: number;
  private data = new Data();
  private sheet: ExcelGrid;
  constructor(canvasId: string,rowCount: number= 1_00_0000, colCount: number = 500) {
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.sheet = new ExcelGrid(canvasId, this.rowCount, this.colCount, this.data);
    this.JsonDataLoader();
  }

  public JsonDataLoader(): void {
    document.querySelector("#load-file")?.addEventListener("change", async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        console.log("Loading local file started", Date.now());
        this.data.clearData();

        const text = await file.text();

        const items: JSONRowData[] = JSON.parse(text);

        if (!items || items.length === 0 || !items[0]) return;

        const headers = Object.keys(items[0]);

        headers.forEach((header: string, colIndex: number) => {
          this.data.setData(0, colIndex, header);
        });

        items.forEach((item: JSONRowData, rowIndex: number) => {
          const currentRow = rowIndex + 1;
          headers.forEach((header: string, colIndex: number) => {
            const value = item[header];
            const displayValue = value !== null && value !== undefined ? String(value) : "";
            this.data.setData(currentRow, colIndex, displayValue);
          });
        });

        console.log("Loading local file ended", Date.now());

        this.sheet.refresh();

        target.value = "";

      } catch (error) {
        console.error("Failed to read or parse local JSON file:", error);
      }
    });
  }
}

const main = new Main('excel-canvas');