import fs from "fs";
import path from "path";
import { CSVParseError } from "~/internal/csv/errors";
import { parseCSV } from "~/internal/csv/main";

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
                      2025-01-08,100.00,Payment,CAD
                      2025-01-09,50.50,Refund,USD`;
    const filePath = createCSVFile("valid-file.csv", validCSV);

    const result = parseCSV(filePath);
    expect(result).toEqual([
      {
        id: 1,
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "Payment",
        currency: "CAD",
        is_deleted: false,
      },
      {
        id: 2,
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "Refund",
        currency: "USD",
        is_deleted: false,
      },
    ]);
  });

  it("should return InvalidFormat error when the file is not a CSV", async () => { 
    const filePath = createCSVFile("invalid-file.txt", "This is not a CSV file");

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidFormat",
      message: "Only CSV files are allowed.",
    } as CSVParseError);

  });

  it("should return FileNotFound error when the file does not exist", async () => {
    const filePath = path.join(tempDir, "nonexistent-file.csv");

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "FileNotFound",
      filePath,
    } as CSVParseError);
  });

  it("should return InvalidFormat error if the CSV format is incorrect", async () => {
    const invalidCSV = `id,transaction_date,amount,description,currency,is_deleted
1,2025-01-08,100.00,Payment,CAD`;
    const filePath = createCSVFile("invalid-format.csv", invalidCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidFormat",
      message: "Invalid CSV format",
    } as CSVParseError);
  });

  it("should return InvalidLine error if a specific line is malformed", async () => {
    const malformedCSV = `id,transaction_date,amount,description,currency,is_deleted
1,2025-01-08,100.00,Payment,CAD,false
2,,Invalid,Amount,,true`;
    const filePath = createCSVFile("malformed-line.csv", malformedCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidLine",
      lineNo: 2,
    } as CSVParseError);
  });

  it("should return an empty array when CSV is empty", async () => {
    const emptyCSV = "";
    const filePath = createCSVFile("empty-file.csv", emptyCSV);

    const result = await parseCSV(filePath);
    expect(result).toEqual([]);
  });

  it("should return InvalidLine error when columns are missing from the line", async () => {
    const missingColumnsCSV = `id,transaction_date,amount,description,currency,is_deleted
1,2025-01-08,100.00,Payment,CAD`;
    const filePath = createCSVFile("missing-columns.csv", missingColumnsCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidLine",
      lineNo: 2,
    } as CSVParseError);
  });

  it("should return InvalidLine error when date is in an invalid format", async () => {
    const invalidDateCSV = `id,transaction_date,amount,description,currency,is_deleted
1,2025-01-08,100.00,Payment,CAD,false
2,2025-99-99,50.50,Refund,USD,false`;
    const filePath = createCSVFile("invalid-date-format.csv", invalidDateCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidLine",
      lineNo: 2,
    } as CSVParseError);
  });

  it("should return InvalidLine error if there are extra columns in the CSV", async () => {
    const extraColumnsCSV = `id,transaction_date,amount,description,currency,is_deleted,extra_column
1,2025-01-08,100.00,Payment,CAD,false`;
    const filePath = createCSVFile("extra-columns.csv", extraColumnsCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      type: "InvalidLine",
      lineNo: 2,
    } as CSVParseError);
  });
});
