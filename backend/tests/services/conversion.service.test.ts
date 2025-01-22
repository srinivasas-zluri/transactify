import { convertCurrency } from "~/services/conversion.service";

// Mock the filesystem to return the sample JSON
jest.mock("fs", () => ({
  readFileSync: jest.fn().mockReturnValue(
    JSON.stringify({
      "2021-01-01": {
        USD: 74.25,
        EUR: 88.5,
      },
      "2021-01-02": {
        USD: 74.4,
        EUR: 88.75,
      },
      "2024-01-02": {
        APKI: 88.75,
      },
    })
  ),
}));

describe("convertCurrency function", () => {
  it("should convert USD to INR correctly for 2021-01-01", () => {
    const result = convertCurrency({
      from: "usd",
      amount: 1,
      year: "2021",
      month: "01",
      day: "01",
    });
    expect(result.amount).toBe(74.25);
    expect(result.err).toBeNull();
  });

  it("should return an error if the currency is not supported", () => {
    const result = convertCurrency({
      from: "gbp", // GBP is not in the data
      amount: 1,
      year: "2021",
      month: "01",
      day: "01",
    });
    expect(result.amount).toBeNull();
    expect(result.err).toBe("Currency gbp not supported");
  });

  it("should return an error if the date has no conversion rates", () => {
    const result = convertCurrency({
      from: "usd",
      amount: 1,
      year: "2020", // There is no data for 2020
      month: "01",
      day: "01",
    });
    expect(result.amount).toBeNull();
    expect(result.err).toBe("No conversion rates found for 2020-01-01");
  });

  it("should return an error if the from currency does not exist for the given date", () => {
    const result = convertCurrency({
      from: "usd", // USD exists, but check with EUR for another date
      amount: 1,
      year: "2021",
      month: "01",
      day: "02",
    });
    expect(result.amount).toBe(74.4);
    expect(result.err).toBeNull();
  });


  it("return an error if on invalid currency ", () => {
    const result = convertCurrency({
      from: "apki", 
      amount: 1,
      year: "2021",
      month: "01",
      day: "01",
    });
    expect(result.err).toBe("No conversion rate found for apki on 2021-01-01");
  });
});
