import { ExcelGrid } from "./ExcelGrid.js";

let rowCount: number = 1_00_0000;
let colCount: number = 500;
const sheet = new ExcelGrid('excelCanvas', rowCount, colCount);

// Define the structure of your data
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  Age: number;
  Salary: number;
}


// Execute the function targeting your file path
async function fetchJSONData(path: string) {
  try {

    console.log("started")
    const response = await fetch(path);
    console.log("ended")

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const employees: Employee[] = await response.json();

    sheet.setCellValue(0, 0, "ID");
    sheet.setCellValue(0, 1, "First Name");
    sheet.setCellValue(0, 2, "Last Name");
    sheet.setCellValue(0, 3, "Age");
    sheet.setCellValue(0, 4, "Salary");

    employees.forEach((employee, index) => {
      const currentRow = index + 1;
      sheet.setCellValue(currentRow, 0, employee.id.toString());
      sheet.setCellValue(currentRow, 1, employee.firstName);
      sheet.setCellValue(currentRow, 2, employee.lastName);
      sheet.setCellValue(currentRow, 3, employee.Age.toString());
      sheet.setCellValue(currentRow, 4, employee.Salary.toString());
    });
    sheet.refresh();

  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

fetchJSONData('./../dummy_data.json');

