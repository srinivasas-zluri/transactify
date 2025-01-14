import fs from "fs";
import path from "path";
import { CSVParseError } from "~/internal/csv/types";
import { parseCSV } from "~/internal/csv/main";
import { createCSVFile, tempDir } from "./utils";
const parse = require("~/internal/csv/parse");

describe("check invalid parsing cases", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `daTe,amount,DESCRIPTION,currency
  08-01-2025,100.00,Payment,cad,false
  ,Invalid,Amount,true`;
    const filePath = createCSVFile("malformed-line.csv", malformedCSV);
    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        type: "MultipleErrors",
        lineNo: 2,
        message:
          "Invalid date format(DD-MM-YYYY): , Invalid amount format: Invalid",
        errors: [
          {
            lineNo: 2,
            message: "Invalid date format(DD-MM-YYYY): ",
            type: "InvalidLine",
          },
          {
            lineNo: 2,
            message: "Invalid amount format: Invalid",
            type: "InvalidLine",
          },
        ],
      },
    ]);
  });

  it("should return an empty array when CSV is empty", async () => {
    const emptyCSV = "";
    const filePath = createCSVFile("empty-file.csv", emptyCSV);

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({});
    expect(result.parsingErrors).toEqual([]);
  });

  it("should return InvalidLine error when date is in an invalid format", async () => {
    const invalidDateCSV = `date,amount,description,currency
  08-01-2025,100.00,Payment,CAD,false
  99-99-2025,50.50,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    const result = await parseCSV(filePath);

    // Adjusting to expect both invalid date and amount errors on the same line
    expect(result.parsingErrors).toEqual([
      {
        message: "Invalid date format(DD-MM-YYYY): 99-99-2025",
        type: "InvalidLine",
        lineNo: 2,
      },
    ]);
  });

  it("should return InvalidLine error when date, amount is in an invalid format", async () => {
    const invalidDateCSV = `date,amount,description,currency
  1,100.00,Payment,CAD,false
  2,99-99-2025,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        lineNo: 1,
        message: "Invalid date format(DD-MM-YYYY): 1",
        type: "InvalidLine",
      },
      {
        type: "MultipleErrors",
        lineNo: 2,
        message:
          "Invalid date format(DD-MM-YYYY): 2, Invalid amount format: 99-99-2025",
        errors: [
          {
            lineNo: 2,
            message: "Invalid date format(DD-MM-YYYY): 2",
            type: "InvalidLine",
          },
          {
            lineNo: 2,
            message: "Invalid amount format: 99-99-2025",
            type: "InvalidLine",
          },
        ],
      },
    ]);
  });

  it("ignore extra columns", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  13-09-2021,100.00,Payment,CAD,false`;
    const filePath = createCSVFile("extra-columns.csv", extraColumnsCSV);

    const result = await parseCSV(filePath);

    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2021-09-13"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "13-09-2021",
      },
    });
  });

  // missing headers test
  it("throw error for missing headers", async () => {
    const missingHeadersCSV = `amount,desCription,Currency
      100.00,Payment,CAD`;
    const filePath = createCSVFile("missing-headers.csv", missingHeadersCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidFormat",
      message: `The headers ${["date"].join(", ")} aren't present`,
    });
  });

  // check empty amount
  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `daTe,amount,DESCRIPTION,currency
  08-01-2025,100.00,Payment,cad,false
  08-01-2025, ,Invalid,Amount,true`;
    const filePath = createCSVFile("malformed-amount.csv", malformedCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        type: "InvalidLine",
        lineNo: 2,
        message: "Invalid amount format: ",
      } as CSVParseError,
    ]);
  });
});

describe("File Errors", () => {
  it("should return InvalidFormat error when the file is not a CSV", async () => {
    const filePath = createCSVFile(
      "invalid-file.txt",
      "This is not a CSV file"
    );

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidFormat",
      message: "Only CSV files are allowed.",
    });
  });

  it("should return FileNotFound error when the file does not exist", async () => {
    const filePath = path.join(tempDir, "nonexistent-file.csv");

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "FileNotFound",
      filePath,
    });
  });
});

describe("check other errors", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Throw error if fs.createReadStream is called with an invalid file", async () => {
    const invalidFilePath = createCSVFile("missing-headers.csv", "");

    jest.spyOn(fs, "createReadStream").mockImplementation(() => {
      throw new Error("File not found");
    });

    await expect(parseCSV(invalidFilePath)).rejects.toEqual({
      type: "UnknownError",
      message: `An unknown error occurred.`,
    });
  });

  // empty description should throw error
  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `daTe,amount,DESCRIPTION,currency
  08-01-2025,100.00,,cad,false
  08-01-2025,50.50, ,USD,false`;
    const filePath = createCSVFile("malformed-description.csv", malformedCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        type: "InvalidLine",
        lineNo: 1,
        message: "Description cannot be empty",
      } as CSVParseError,
      {
        type: "InvalidLine",
        lineNo: 2,
        message: "Description cannot be empty",
      } as CSVParseError,
    ]);
  });

  it("Throw error if an exception occurs in the parser", async () => {
    jest.spyOn(parse, "handleRow").mockImplementation(() => {
      throw new Error("Parser error");
    });
    const data = `date,amount,description,currency
    08-01-2025,100.00,Payment,CAD,false`;
    const filePath = createCSVFile("parser-error.csv", data);
    const result = await parseCSV(filePath);
    await expect(result.parsingErrors).toEqual([
      {
        type: "UnknownError",
        message: `An unknown error occurred.`,
      },
    ]);
  });
});
