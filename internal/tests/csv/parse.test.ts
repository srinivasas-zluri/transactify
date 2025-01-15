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
        transaction_date_string: "08-01-2025"
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
});
