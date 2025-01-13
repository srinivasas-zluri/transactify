import fs from "fs";
import path from "path";
import { FileCSVWriter } from "~/internal/csv/writer";
import {
  cleanupTestFile,
  createCSVFile,
  readFileContent,
  testFilePath,
} from "./utils";
import { parseCSV } from "~/internal/csv/main";

describe("Check the generic implementation of the csvwriter", () => {
  beforeEach(() => {
    // Ensure file does not exist before each test
    cleanupTestFile(testFilePath);
  });

  afterEach(() => {
    // Clean up the file after each test
    cleanupTestFile(testFilePath);
  });

  it("should write rows to the CSV file with auto-generated headers", async () => {
    const writer = new FileCSVWriter(testFilePath);

    const rows = [
      { lineNo: 1, errorType: "InvalidLine", message: "Invalid amount format" },
      {
        lineNo: 2,
        errorType: "MissingColumn",
        message: "Missing required column",
      },
    ];

    // Write rows to the CSV file
    const result = await writer.writeRows(rows);

    // Read the file content
    const fileContent = readFileContent(testFilePath);

    // Check that the file content has the correct headers and rows
    expect(fileContent).toContain("lineNo,errorType,message");
    expect(fileContent).toContain("1,InvalidLine,Invalid amount format");
    expect(fileContent).toContain("2,MissingColumn,Missing required column");
    expect(result).toBeNull(); // Ensure no error was returned
  });

  it("should handle empty rows gracefully and return null", async () => {
    const writer = new FileCSVWriter(testFilePath);

    const rows: any[] = [];

    // Write rows to the CSV file
    const result = await writer.writeRows(rows);

    // Check that the file does not exist (no data written)
    expect(fs.existsSync(testFilePath)).toBeFalsy();
    expect(result).toBeNull(); // Ensure no error was returned
  });

  it("should return an error object if there is an issue writing to the file", async () => {
    const invalidFilePath = path.join(
      __dirname,
      "/invalid-folder/test-output.csv"
    );
    const writer = new FileCSVWriter(invalidFilePath);

    const rows = [
      { lineNo: 1, errorType: "InvalidLine", message: "Invalid amount format" },
    ];

    // Try to write rows to the CSV file
    const result = await writer.writeRows(rows);

    // Ensure that the result is an error object
    expect(result).toEqual({
      type: "WriteError",
      message: "Error writing to CSV file",
    });
  });
});

describe("check the impl of csvwriter with parsecsv", () => {
  beforeEach(() => {
    // Ensure file does not exist before each test
    cleanupTestFile(testFilePath);
  });

  afterEach(() => {
    // Clean up the file after each test
    cleanupTestFile(testFilePath);
  });

  it("should write errors to the CSV file", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
    08/01/2025, 3 -0 2, payment, cad, false
    08/01/2025, 3 -0 2, payment, cad, false
    09-01-2025, 100, payment, cad, false
    10-01-2025, 100, payment, cad, false
    10-01-2025, 100, payment, cad, false
    `;
    const filePath = createCSVFile(
      "invalid-data-with-spaces.csv",
      extraColumnsCSV
    );
    const writer = new FileCSVWriter(testFilePath);

    const result = await parseCSV(filePath, {
      errorFileWriter: writer,
    });

    // Read the file content
    const fileContent = readFileContent(testFilePath);

    // Check that the file content has the correct headers and rows

    expect(fileContent).toContain(
      "lineNo,errorType,message,date,amount,description,currency"
    );
    expect(fileContent).toContain("1,InvalidLine,Invalid amount format");
    expect(fileContent).toContain("2,InvalidLine,Invalid amount format");
    expect(fileContent).toContain(
      `5,RepeatedElementsFound,"Duplicate elements found in the following line numbers 4, 5",10-01-2025,100,payment,cad`
    );
    expect(result.rows).toEqual({
      "3": {
        amount: 100,
        currency: "CAD",
        description: "payment",
        is_deleted: false,
        transaction_date: new Date("2025-01-09"),
        transaction_date_string: "09-01-2025",
      },
    });
  });
});
