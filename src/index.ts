import { ExcelGrid } from "./ExcelGrid.js";
import { Data } from "./Data.js";
let rowCount: number = 1_00_0000;
let colCount: number = 500;
const data = new Data();
const sheet = new ExcelGrid('excelCanvas', rowCount, colCount, data);




type JSONRowData = Record<string, string | number | boolean | null | undefined>;

// async function fetchJSONData<T extends JSONRowData>(path: string): Promise<void> {
//   try {
//     console.log("started", Date.now());
//     let response: Response | null = await fetch(path);

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     let items: T[] | null = await response.json();
    
//     if (!items || items.length === 0 || !items[0]) return;
    
//     const headers = Object.keys(items[0]) as Array<keyof T & string>;

//     headers.forEach((header: string, colIndex: number) => {
//       data.setData(0, colIndex, header);
//     });
    
//     items.forEach((item: T, rowIndex: number) => {
//       const currentRow = rowIndex + 1;
//       headers.forEach((header: keyof T & string, colIndex: number) => {
//         const value = item[header];
//         const displayValue = value !== null && value !== undefined ? String(value) : "";
//         data.setData(currentRow, colIndex, displayValue);
//       });
//     });

//     console.log("ended", Date.now());
//     sheet.refresh();

    
//     items = null;
//     response = null;
//   } catch (error) {
//     console.error('Fetch failed:', error);
//   }
// }


// await fetchJSONData('./../dummy_data.json');


// document.querySelector("#load-file")?.addEventListener("click", ()=>{
  
// })

document.querySelector("#load-file")?.addEventListener("change", async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  try {
    console.log("Loading local file started", Date.now());
  
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

