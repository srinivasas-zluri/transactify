import fs from "fs";
import path from "path";
import { CSVParseError } from "~/internal/csv/errors";
import { parseCSV } from "~/internal/csv/main";
import { Transaction } from "~/models/transaction";

describe("parseCSV", () => {
  const tempDir = path.join(__dirname, "temp");

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const createCSVFile = (filename: string, content: string) => {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  it("should parse a valid CSV file and return an array of transactions", async () => {
    const validCSV = `date,amount,description,currency
                      2025-01-08, \t 100.00  ,Payment   ,   CAD
                      \t\t2025-01-09,50.50\t,Refund,USD`;
    const filePath = createCSVFile("valid-file.csv", validCSV);

    const result = await parseCSV(filePath);
    expect(result).toEqual([
      {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "Payment",
        currency: "CAD",
        is_deleted: false,
      },
      {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "Refund",
        currency: "USD",
        is_deleted: false,
      },
    ]);
  });

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

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidLine",
      lineNo: 2,
    } as CSVParseError);
  });

  it("should return InvalidLine error when date is in an invalid format", async () => {
    const invalidDateCSV = `date,amount,description,currency
  1,100.00,Payment,CAD,false
  2,2025-99-99,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
      { lineNo: 1, message: "Invalid date format(YYYY-MM-DD): 1", type: "InvalidLine" },
      { lineNo: 2, message: "Invalid date format(YYYY-MM-DD): 2", type: "InvalidLine" },
    ]);
  });

  it("Ignore extra columns", async () => {
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
});
