import { parseCSV } from "~/csv/main";
import { createCSVFile } from "./utils";
describe("data with spaces", () => {
  it("check parsing of data with spaces in between", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  08 -01 -2025, 3 0 2, payment, cad, false`;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

    const result = await parseCSV(filePath);

    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 302,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should fail for amount with spaces and invalid amount", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  08/01/2025, 3 -0 2, payment, cad, false`;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        lineNo: 1,
        message: "Invalid amount format: 3 -0 2",
        type: "InvalidLine",
      },
    ]);

    expect(result.rows).toEqual({});
  });

  it("should fail for future date", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  08/01/2026, 302, payment, cad, false`;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        lineNo: 1,
        message: "Date cannot be in the future",
        type: "InvalidLine",
      },
    ]);

    expect(result.rows).toEqual({});
  });

  it("should validate amount and description correctly", async () => {
    const invalidCSV = `DaTe,amount,desCription,Currency,extra_column
  08/01/2025, 12345678901, payment, cad, false
  08/01/2025, 123.456, payment, cad, false
  08/01/2025, 123.45678, payment, cad, false
  08/01/2025, 123.45, ${"a".repeat(254)}, cad, false
  08/01/2025, .68, some desc, cad, false
  09/01/2025, -.1, some other desc, cad, false`;

    const filePath = createCSVFile("validation-test.csv", invalidCSV);

    const result = await parseCSV(filePath);

    expect(result.parsingErrors).toEqual([
      {
        lineNo: 1,
        message:
          "Amount cannot be more than 10 digits before the decimal point",
        type: "InvalidLine",
      },
      {
        lineNo: 2,
        message: "Amount cannot be more than 2 digits after the decimal point",
        type: "InvalidLine",
      },
      {
        lineNo: 3,
        message: "Amount cannot be more than 2 digits after the decimal point",
        type: "InvalidLine",
      },
      {
        lineNo: 4,
        message: "Description cannot be more than 253 characters",
        type: "InvalidLine",
      },
    ]);

    expect(result.rows).toEqual({
      "5": {
        amount: 0.68,
        currency: "CAD",
        description: "some desc",
        is_deleted: false,
        transaction_date: new Date("2025-01-08"),
        transaction_date_string: "08/01/2025",
      },
      "6": {
        amount: -0.1,
        currency: "CAD",
        description: "some other desc",
        is_deleted: false,
        transaction_date: new Date("2025-01-09"),
        transaction_date_string: "09/01/2025",
      },
    });
  });
});
