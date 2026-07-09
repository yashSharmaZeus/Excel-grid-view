import { ExcelGrid } from "./ExcelGrid.js";
import { Data } from "./Data.js";
let rowCount: number = 1_00_0000;
let colCount: number = 500;
const data = new Data();
const sheet = new ExcelGrid('excelCanvas', rowCount, colCount, data);




type JSONRowData = Record<string, string | number | boolean | null | undefined>;

document.querySelector("#load-file")?.addEventListener("change", async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    console.log("Loading local file started", Date.now());
    data.clearData();
    
    const text = await file.text();

    const items: JSONRowData[] = JSON.parse(text);

    if (!items || items.length === 0 || !items[0]) return;

    const headers = Object.keys(items[0]);

    headers.forEach((header: string, colIndex: number) => {
      data.setData(0, colIndex, header);
    });

    items.forEach((item: JSONRowData, rowIndex: number) => {
      const currentRow = rowIndex + 1;
      headers.forEach((header: string, colIndex: number) => {
        const value = item[header];
        const displayValue = value !== null && value !== undefined ? String(value) : "";
        data.setData(currentRow, colIndex, displayValue);
      });
    });

    console.log("Loading local file ended", Date.now());

    sheet.refresh();

    target.value = "";

  } catch (error) {
    console.error("Failed to read or parse local JSON file:", error);
  }
});

