import { parseCSV } from "~/csv/main";
import { createCSVWithBOM } from "./utils";
describe("BOM in CSV parse", () => {
  it("should correctly parse a CSV with BOM", async () => {
    const bomCSV = `DaTe,amount,description,Currency\n08-01-2025,100,payment,cad\n09-01-2025,200,purchase,usd\n`;
    const filePath = createCSVWithBOM("bom-test.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
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
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });

    expect(res.parsingErrors).toEqual([]);
  });

  it("should handle BOM correctly when there are leading whitespaces in the first column", async () => {
    const bomCSV = ` DaTe , amount , description , Currency \n 08-01-2025 , 100 , payment , cad \n 09-01-2025 , 200 , purchase , usd \n`;
    const filePath = createCSVWithBOM("bom-leading-whitespace.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
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
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(res.parsingErrors).toEqual([]);
  });

  it("should parse a CSV with BOM and special characters correctly", async () => {
    const bomCSV = `DaTe,amount,description,Currency\n08-01-2025,100,paŸment,cad\n09-01-2025,200,pürchase,usd\n`;
    const filePath = createCSVWithBOM("bom-special-chars.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "paÿment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 200.0,
        description: "pürchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });

    expect(res.parsingErrors).toEqual([]);
  });

  it("should handle BOM in empty CSV file", async () => {
    const bomCSV = ``;
    const filePath = createCSVWithBOM("bom-empty.csv", bomCSV);

    await expect(parseCSV(filePath)).rejects.toEqual({
      message: "The headers date, amount, description, currency aren't present",
      type: "InvalidFormat",
    });
  });

  it("should not fail on CSV with BOM and extra whitespace between columns", async () => {
    const bomCSV = `DaTe ,   amount   , description , Currency\n 08-01-2025 , 100 , payment , cad \n 09-01-2025 , 200 , purchase , usd\n`;
    const filePath = createCSVWithBOM("bom-extra-whitespace.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
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
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });
    expect(res.parsingErrors).toEqual([]);
  });

  it("should handle BOM and various encoding issues gracefully", async () => {
    const bomCSV = `DaTe,amount,description,Currency\n08-01-2025,100,paŸment,cad\n09-01-2025,200,pürchase,usd\n`;
    const filePath = createCSVWithBOM("bom-encoding-issues.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        amount: 100.0,
        description: "paÿment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08-01-2025",
      },
      2: {
        transaction_date: new Date("2025-01-09"),
        amount: 200.0,
        description: "pürchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });

    expect(res.parsingErrors).toEqual([]);
  });

  it("should handle BOM without modifying the first row", async () => {
    const bomCSV = `DaTe,amount,description,Currency\n08-01-2025,100,payment,cad\n09-01-2025,200,purchase,usd\n`;
    const filePath = createCSVWithBOM("bom-no-modify-first-row.csv", bomCSV);

    const res = await parseCSV(filePath);
    expect(res.rows).toEqual({
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
        amount: 200.0,
        description: "purchase",
        currency: "USD",
        is_deleted: false,
        transaction_date_string: "09-01-2025",
      },
    });

    expect(res.parsingErrors).toEqual([]);
  });
});
