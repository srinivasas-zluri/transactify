import { parseCSV } from "~/csv/main";
import { createCSVFile } from "./utils";

describe("parse valid csv", () => {
  it("should parse a valid CSV file and return an array of transactions", async () => {
    const validCSV = `date,amount,description,currency
                      08-01-2025, \t 100.00  ,Payment   ,   CAD
                      \t\t09-01-2025,50.50\t,Refund,USD`;
    const filePath = createCSVFile("valid-file.csv", validCSV);

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });
});

describe("valid csv parsing", () => {
  it("should parse a valid CSV file and return an array of transactions", async () => {
    const validCSV = `date,amount,description,currency
                      08-01-2025, \t 100.00  ,Payment   ,   CAD
                      \t\t09-01-2025,50.50\t,Refund,USD`;
    const filePath = createCSVFile("valid-file.csv", validCSV);

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should handle CSV with extra spaces or tabs between fields", async () => {
    const csvWithSpaces = `date,amount,description,currency
                           08-01-2025, \t 100.00  ,Payment   ,   CAD
                           \t\t09-01-2025,50.50\t,Refund,USD`;
    const filePath = createCSVFile("csv-with-spaces.csv", csvWithSpaces);

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should ignore extra blank lines", async () => {
    const csvWithBlankLines = `date,amount,description,currency
    \n
                             08-01-2025,100.00,"Payment
                             ",CAD
    \n
                             09-01-2025,50.50,Refund,USD
    \n`;
    const filePath = createCSVFile(
      "csv-with-blank-lines.csv",
      csvWithBlankLines
    );

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      3: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      6: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should parse a CSV with different delimiters like semicolons", async () => {
    const csvWithSemicolons = `date;amount;description;currency
                               08-01-2025;100.00;Payment;CAD
                               09-01-2025;50.50;Refund;USD`;
    const filePath = createCSVFile(
      "csv-with-semicolons.csv",
      csvWithSemicolons
    );

    const result = await parseCSV(filePath, { seperator: ";" });
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should handle CSV with quoted strings containing commas", async () => {
    const csvWithQuotes = `date,amount,description,currency
                           08-01-2025,100.00,"Payment, Discount",CAD
                           09-01-2025,50.50,"Refund, extra",USD`;
    const filePath = createCSVFile("csv-with-quotes.csv", csvWithQuotes);

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment, discount",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund, extra",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should handle CSV with empty fields", async () => {
    const csvWithEmptyFields = `date,amount,description,currency
                                08-01-2025,100.00,something,
                                09-01-2025,50.50,something,`;
    const filePath = createCSVFile(
      "csv-with-empty-fields.csv",
      csvWithEmptyFields
    );

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "something",
        currency: "",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "something",
        currency: "",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should handle CSV with varied date formats", async () => {
    const csvWithDifferentDateFormats = `date,amount,description,currency
                                        08/01/2025,100.00,Payment,CAD
                                        09-01-2025,50.50,Refund,USD`;
    const filePath = createCSVFile(
      "csv-with-different-date-formats.csv",
      csvWithDifferentDateFormats
    );

    const result = await parseCSV(filePath);
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08/01/2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "refund",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(result.parsingErrors).toEqual([]);
  });

  it("should handle empty rows with correct behavior", async () => {
    const emptyRowsCSV = `DaTe,amount,desCription,Currency
    ,,,,,
    08-01-2025,100,payment,cad
    ,,,,,
    09-01-2025,200,purchase,usd
    ,,,,`;
    const filePath = createCSVFile("empty-rows.csv", emptyRowsCSV);
    const res = await parseCSV(filePath);

    expect(res.parsingErrors).toEqual([]);
    expect(res.rows).toEqual({
      2: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      4: {
        transaction_date: new Date("2025-01-09"),
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
  });
});
