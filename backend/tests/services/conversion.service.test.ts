import { convertCurrency } from "~/services/conversion.service";

// Mock the currency data module first
jest.mock("~/services/selected_currencies.json", () => ({
  "2025-01-01": {
    USD: 1.0,
    EUR: 0.9,
    GBP: 0.75,
    XRA: 0.88,
  },
  "2025-01-02": {
    USD: 1.0,
    EUR: 0.88,
    GBP: 0.76,
  },
}));

describe("convertCurrency function", () => {
  it("should return correct amount for valid conversion", () => {
    const args = {
      from: "USD",
      amount: 100,
      year: "2025",
      month: "01",
      day: "01",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBe(100);
    expect(result.err).toBeNull();
  });

  it("should return an error for unsupported currency", () => {
    const args = {
      from: "INRA",
      amount: 100,
      year: "2025",
      month: "01",
      day: "01",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBeNull();
  });

  it("should return an error when no conversion rate is found for the given date", () => {
    const args = {
      from: "USD",
      amount: 100,
      year: "2025",
      month: "01",
      day: "03", // Date not present in mockCurrencyData
    };
    const result = convertCurrency(args);
    expect(result.amount).toBeNull();
    expect(result.err).toBe("No conversion rates found for 2025-01-03");
  });

  it("should return an error for unsupported currency", () => {
    const args = {
      from: "INR",
      amount: 100,
      year: "2025",
      month: "01",
      day: "01",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBeNull();
    expect(result.err).toBe("Currency INR not supported");
  });

  it("should return an error when no conversion rate is found for the from currency on a given date", () => {
    const args = {
      from: "XRA", 
      amount: 100,
      year: "2025",
      month: "01",
      day: "02",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBeNull();
    expect(result.err).toBe("No conversion rate found for XRA on 2025-01-02");
  });

  it("should return correct amount for valid conversion with EUR currency on a different date", () => {
    const args = {
      from: "EUR",
      amount: 100,
      year: "2025",
      month: "01",
      day: "02",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBe(88); // 100 * 0.88 = 88
    expect(result.err).toBeNull();
  });

  it("should handle invalid date formats", () => {
    const args = {
      from: "USD",
      amount: 100,
      year: "2025",
      month: "13", // Invalid month
      day: "01",
    };
    const result = convertCurrency(args);
    expect(result.amount).toBeNull();
    expect(result.err).toBe("No conversion rates found for 2025-13-01");
  });
});
