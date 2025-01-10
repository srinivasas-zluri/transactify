import fs from "fs";
import path from "path";
import { CSVParseError } from "~/internal/csv/types";
import { parseCSV } from "~/internal/csv/main";
import { createCSVFile, tempDir } from "./utils";
const parse = require("~/internal/csv/parse");

describe("parseCSV", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `daTe,amount,DESCRIPTION,currency
  2025-01-08,100.00,Payment,cad,false
  ,Invalid,Amount,true`;
    const filePath = createCSVFile("malformed-line.csv", malformedCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        type: "InvalidLine",
        lineNo: 2,
        message: "Invalid date format(YYYY-MM-DD): ",
      } as CSVParseError,
    ]);
  });

  it("should return an empty array when CSV is empty", async () => {
    const emptyCSV = "";
    const filePath = createCSVFile("empty-file.csv", emptyCSV);

    const result = await parseCSV(filePath);
    expect(result).toEqual([]);
  });

  it("should return InvalidLine error when date is in an invalid format", async () => {
    const invalidDateCSV = `date,amount,description,currency
  2025-01-08,100.00,Payment,CAD,false
  2025-99-99,50.50,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        lineNo: 2,
        message: "Invalid date format(YYYY-MM-DD): 2025-99-99",
        type: "InvalidLine",
      } as CSVParseError,
    ]);
  });

  it("should return InvalidLine error when date is in an invalid format", async () => {
    const invalidDateCSV = `date,amount,description,currency
  1,100.00,Payment,CAD,false
  2,2025-99-99,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        lineNo: 1,
        message: "Invalid date format(YYYY-MM-DD): 1",
        type: "InvalidLine",
      },
      {
        lineNo: 2,
        message: "Invalid date format(YYYY-MM-DD): 2",
        type: "InvalidLine",
      },
    ]);
  });

  it("ignore extra columns", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  2025-01-08,100.00,Payment,CAD,false`;
    const filePath = createCSVFile("extra-columns.csv", extraColumnsCSV);

    await expect(parseCSV(filePath)).resolves.toEqual([
      {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "Payment",
        currency: "CAD",
        is_deleted: false,
      },
    ]);
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
  2025-01-08,100.00,Payment,cad,false
  2025-01-08, ,Invalid,Amount,true`;
    const filePath = createCSVFile("malformed-amount.csv", malformedCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
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

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        type: "InvalidFormat",
        message: "Only CSV files are allowed.",
      } as CSVParseError,
    ]);
  });

  it("should return FileNotFound error when the file does not exist", async () => {
    const filePath = path.join(tempDir, "nonexistent-file.csv");

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        type: "FileNotFound",
        filePath,
      } as CSVParseError,
    ]);
  });
});

describe("check other errors", () => {
  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("Throw error if fs.createReadStream is called with an invalid file", async () => {
    const invalidFilePath = createCSVFile("missing-headers.csv", "");

    jest.spyOn(fs, "createReadStream").mockImplementation(() => {
      throw new Error("File not found");
    });

    await expect(parseCSV(invalidFilePath)).rejects.toEqual([
      {
        type: "UnknownError",
        message: `An unknown error occurred.`,
      },
    ]);
  });

  it("Throw error if an exception occurs in the parser", async () => {
    jest.spyOn(parse, "handleRow").mockImplementation(() => {
      throw new Error("Parser error");
    });
    const data = `date,amount,description,currency
    2025-01-08,100.00,Payment,CAD,false`;
    const filePath = createCSVFile("parser-error.csv", data);
    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        type: "UnknownError",
        message: `An unknown error occurred.`,
      },
    ]);
  });

  // empty description should throw error
  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `daTe,amount,DESCRIPTION,currency
  2025-01-08,100.00,,cad,false
  2025-01-08,50.50, ,USD,false`;
    const filePath = createCSVFile("malformed-description.csv", malformedCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
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
});
