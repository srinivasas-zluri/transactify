import { parseCSV } from "~/internal/csv/main";
import { createCSVFile } from "./utils";
import { before } from "node:test";

describe("parseCSV function tests", () => {
  const mockErrorFileWriter = {
    writeRows: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail for invalid amount with spaces and invalid format", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
08/01/2025, 3 -0 2, payment, cad, false`;
    const filePath = createCSVFile(
      "invalid-amount-with-spaces.csv",
      extraColumnsCSV
    );

    const result = await parseCSV(filePath, {
      errorFileWriter: mockErrorFileWriter,
    });

    expect(result.parsingErrors).toEqual([
      {
        lineNo: 1,
        message: "Invalid amount format: 3 -0 2",
        type: "InvalidLine",
      },
    ]);
    expect(result.rows).toEqual({});
    expect(mockErrorFileWriter.writeRows).toHaveBeenCalledTimes(1); // Errors should be written once
    expect(mockErrorFileWriter.writeRows).toHaveBeenCalledWith([
      {
        lineNo: "1",
        errorType: "InvalidLine",
        message: "Invalid amount format: 3 -0 2",
        amount: "3 -0 2", // Ensure the row data is logged correctly
        date: "08/01/2025",
        description: "payment",
        currency: "cad",
      },
    ]);
  });

  it("should skip extra columns and handle valid data", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
08/01/2025, 1000, payment, cad, ignored_value`;
    const filePath = createCSVFile(
      "valid-with-extra-columns.csv",
      extraColumnsCSV
    );

    const result = await parseCSV(filePath, {
      errorFileWriter: mockErrorFileWriter,
    });

    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("08-01-2025"),
        amount: 1000,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08/01/2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
    expect(mockErrorFileWriter.writeRows).not.toHaveBeenCalled(); // No errors should be written
  });

  it("should handle empty file gracefully", async () => {
    const emptyCSV = "";
    const filePath = createCSVFile("empty-file.csv", emptyCSV);

    const result = await parseCSV(filePath, {
      errorFileWriter: mockErrorFileWriter,
    });

    expect(result.rows).toEqual({});
    expect(result.parsingErrors).toEqual([]);
    expect(mockErrorFileWriter.writeRows).not.toHaveBeenCalled(); // No errors
  });
});
