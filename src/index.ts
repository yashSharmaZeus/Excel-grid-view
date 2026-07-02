import { ExcelGrid } from "./ExcelGrid.js";

let rowCount: number = 1_00_0000;
let colCount: number = 500;
const sheet = new ExcelGrid('excelCanvas',rowCount,colCount);

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
    // 1. Start the network request
    console.log("started")
    const response = await fetch(path);
    console.log("ended")
    
    // 2. Explicitly check if the server responded with an error (like 404 or 500)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // console.log(data);
     const employees: Employee[] = await response.json();

    // 3. Write your Table Headers on Row Index 0
    sheet.setCellValue(0, 0, "ID");
    sheet.setCellValue(0, 1, "First Name");
    sheet.setCellValue(0, 2, "Last Name");
    sheet.setCellValue(0, 3, "Age");
    sheet.setCellValue(0, 4, "Salary");

    // 4. Iterate over the parsed array and write data starting at Row Index 1
    employees.forEach((employee, index) => {
      const currentRow = index + 1; // Shifts row indices down by 1 to skip the header
      console.log(currentRow);
      sheet.setCellValue(currentRow, 0, employee.id.toString());
      sheet.setCellValue(currentRow, 1, employee.firstName);
      sheet.setCellValue(currentRow, 2, employee.lastName);
      sheet.setCellValue(currentRow, 3, employee.Age.toString());
      sheet.setCellValue(currentRow, 4, employee.Salary.toString());
    });

    console.log(`Successfully wrote ${employees.length} rows to the sheet!`);
    
  } catch (error) {
    // 4. Handle any network drops or JSON parsing syntax errors
    console.error('Fetch failed:', error);
  }
}

fetchJSONData('./../dummy_data.json');

