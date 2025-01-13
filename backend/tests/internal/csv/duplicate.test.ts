import { parseCSV } from "~/internal/csv/main";
import { createCSVFile } from "./utils";

describe("Duplication Check Tests", () => {
  it("should detect duplicates with same transaction date and description", async () => {
    const duplicateCSV = `DaTe,amount,desCription,Currency
    08/01/2025, 300, payment, CAD
    08/01/2025, 300, payment, CAD`;

    const filePath = createCSVFile("duplicate-rows.csv", duplicateCSV);
    const result = await parseCSV(filePath);

    expect(result.validationErrors).toEqual({
      "2": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
    });
    expect(result.rows).toEqual({});
  });

  it("should detect duplicates with leading/trailing spaces in values", async () => {
    const duplicateWithSpacesCSV = `DaTe,amount,desCription,Currency
    08/01/2025, 300, \tpayment, CAD
    08/01/2025, 300, payment , CAD`;

    const filePath = createCSVFile(
      "duplicate-with-spaces.csv",
      duplicateWithSpacesCSV
    );
    const result = await parseCSV(filePath);

    expect(result.validationErrors).toEqual({
      "2": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
    });
    expect(result.rows).toEqual({});
  });

  it("should detect duplicates with different cases in description", async () => {
    const caseSensitiveCSV = `DaTe,amount,desCription,Currency
    08/01/2025, 300, Payment, CAD
    08/01/2025, 300, payment, CAD`;

    const filePath = createCSVFile(
      "duplicate-case-sensitive.csv",
      caseSensitiveCSV
    );
    const result = await parseCSV(filePath);

    expect(result.validationErrors).toEqual({
      "2": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
    });
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("08/01/2025"),
        amount: 300,
        description: "Payment",
        currency: "CAD",
        is_deleted: false,
        transaction_date_string: "08/01/2025",
      },
    });
  });

  it("should detect three duplicates ", async () => {
    const threeDuplicatesCSV = `DaTe,amount,desCription,Currency
    08/01/2025, 300, payment, CAD
    08/01/2025, 300, payment, CAD
    08/01/2025, 300, payment, CAD
    08/01/2025, 300, payment, CAD`;
    const filePath = createCSVFile("three-duplicates.csv", threeDuplicatesCSV);
    const result = await parseCSV(filePath);
    expect(result.validationErrors).toEqual({
      "2": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
      "3": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
      "4": {
        message: "Duplicate entries found for 08/01/2025 payment",
        type: "RepeatedElementsFound",
        duplicationKey: "08/01/2025 payment",
      },
    });
  });

  it("should detect no duplication with missing or different columns", async () => {
    const missingDataCSV = `DaTe,amount,desCription,Currency
    08/01/2025, 300, payment, CAD`;

    const filePath = createCSVFile("missing-columns.csv", missingDataCSV);
    const result = await parseCSV(filePath);

    expect(result.validationErrors).toEqual({});
    expect(result.rows).toEqual({
      1: {
        transaction_date: new Date("2025-01-08"),
        is_deleted: false,
        amount: 300,
        description: "payment",
        currency: "CAD",
        transaction_date_string: "08/01/2025",
      },
    });
  });
});
