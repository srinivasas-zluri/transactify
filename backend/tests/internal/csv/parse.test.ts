import { parseCSV } from "~/internal/csv/main";
import { createCSVFile } from "./utils";

describe("data with spaces", () => {
  it("check parsing of data with spaces in between", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  08 -01 -2025, 3 0 2, payment, cad, false`;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

    await expect(parseCSV(filePath)).resolves.toEqual([
      {
        transaction_date: new Date("08-01-2025"),
        amount: 302,
        description: "payment",
        currency: "CAD",
        is_deleted: false,
      },
    ]);
  });

  it("should fail for amount with spaces and invalid amount", async () => { 
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  08/01/2025, 3 -0 2, payment, cad, false`;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

    await expect(parseCSV(filePath)).rejects.toEqual([
      {
        lineNo: 1,
        message: "Invalid amount format: 3 -0 2",
        type: "InvalidLine",
      },
    ]);
  });
});
