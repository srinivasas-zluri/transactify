import { parseCSV } from "~/internal/csv/main";
import { createCSVFile } from "./utils";

describe("data with spaces", () => {
  it("check parsing of data with spaces in between", async () => {
    const extraColumnsCSV = `DaTe,amount,desCription,Currency, extra_column
  2025 -01 -08, 3 0 2, payment, cad, false
  `;
    const filePath = createCSVFile("error-columns.csv", extraColumnsCSV);

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
