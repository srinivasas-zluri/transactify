import { parseCSV } from "~/internal/csv/main";
import { createCSVFile } from "./utils";

describe("parseCSV", () => {
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
});

describe("valid csv parsing", () => {
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

  it("should handle CSV with extra spaces or tabs between fields", async () => {
    const csvWithSpaces = `date,amount,description,currency
                           2025-01-08, \t 100.00  ,Payment   ,   CAD
                           \t\t2025-01-09,50.50\t,Refund,USD`;
    const filePath = createCSVFile("csv-with-spaces.csv", csvWithSpaces);

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

  it("should ignore extra blank lines", async () => {
    const csvWithBlankLines = `date,amount,description,currency
  
                             2025-01-08,100.00,"Payment
                             ",CAD
  
                             2025-01-09,50.50,Refund,USD
                             
                             `;
    const filePath = createCSVFile(
      "csv-with-blank-lines.csv",
      csvWithBlankLines
    );

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

  it("should parse a CSV with different delimiters like semicolons", async () => {
    const csvWithSemicolons = `date;amount;description;currency
                               2025-01-08;100.00;Payment;CAD
                               2025-01-09;50.50;Refund;USD`;
    const filePath = createCSVFile(
      "csv-with-semicolons.csv",
      csvWithSemicolons
    );

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

  it("should handle CSV with quoted strings containing commas", async () => {
    const csvWithQuotes = `date,amount,description,currency
                           2025-01-08,100.00,"Payment, Discount",CAD
                           2025-01-09,50.50,"Refund, extra",USD`;
    const filePath = createCSVFile("csv-with-quotes.csv", csvWithQuotes);

    const result = await parseCSV(filePath);
    expect(result).toEqual([
      {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "Payment, Discount",
        currency: "CAD",
        is_deleted: false,
      },
      {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "Refund, extra",
        currency: "USD",
        is_deleted: false,
      },
    ]);
  });

  it("should handle CSV with empty fields", async () => {
    const csvWithEmptyFields = `date,amount,description,currency
                                2025-01-08,100.00,,CAD
                                2025-01-09,50.50,,USD`;
    const filePath = createCSVFile(
      "csv-with-empty-fields.csv",
      csvWithEmptyFields
    );

    const result = await parseCSV(filePath);
    expect(result).toEqual([
      {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "",
        currency: "CAD",
        is_deleted: false,
      },
      {
        transaction_date: new Date("2025-01-09"),
        amount: 50.5,
        description: "",
        currency: "USD",
        is_deleted: false,
      },
    ]);
  });

  it("should handle CSV with varied date formats", async () => {
    const csvWithDifferentDateFormats = `date,amount,description,currency
                                        2025/01/08,100.00,Payment,CAD
                                        2025-01-09,50.50,Refund,USD`;
    const filePath = createCSVFile(
      "csv-with-different-date-formats.csv",
      csvWithDifferentDateFormats
    );

    const result = await parseCSV(filePath);
    expect(result).toEqual([
      {
        transaction_date: new Date("2025/01/08"),
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

  it("should handle empty rows with correct behavior", async () => {
    const emptyRowsCSV = `DaTe,amount,desCription,Currency
,,,,,
2025-01-08,100,payment,cad
,,,,,
2025-01-09,200,purchase,usd
,,,,,`;
    const filePath = createCSVFile("empty-rows.csv", emptyRowsCSV);

    await expect(parseCSV(filePath)).resolves.toEqual([
      {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
      },
      {
        transaction_date: new Date("2025-01-09"),
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
      },
    ]);
  });
});
