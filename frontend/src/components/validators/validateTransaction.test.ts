import { describe, it, expect } from "vitest";
import { validateTransaction } from "./validateTransaction";

describe("validateTransaction", () => {
  const validTransaction = {
    date: "24-01-2025",
    description: "Test transaction",
    amount: 100,
    currency: "USD",
  };

  const invalidDateFormat = {
    ...validTransaction,
    date: "2025-01-24", // Incorrect date format
  };

  const invalidDate = {
    ...validTransaction,
    date: "32-01-2025", // Invalid day
  };

  const futureDate = {
    ...validTransaction,
    date: "24-01-2026", // Future date
  };

  const longDescription = {
    ...validTransaction,
    description: "A".repeat(255), // 255 characters
  };

  const shortDescription = {
    ...validTransaction,
    description: "A", // 1 character
  };

  const missingCurrency = {
    ...validTransaction,
    currency: "", // Empty string for currency
  };

  const zeroAmount = {
    ...validTransaction,
    amount: 0, // Zero amount
  };

  const emptyAmount = {
    ...validTransaction,
    amount: "", // Empty string for amount
  };

  it("should return no errors for a valid transaction", () => {
    const result = validateTransaction(validTransaction);
    expect(result).toBeNull();
  });

  it("should return an error for invalid date format", () => {
    const result = validateTransaction(invalidDateFormat);
    expect(result?.date).toBe("Invalid date");
  });

  it("should return an error for invalid date", () => {
    const result = validateTransaction(invalidDate);
    expect(result?.date).toBe("Invalid date");
  });

  it("should return an error for future date", () => {
    const result = validateTransaction(futureDate);
    expect(result?.date).toBe("Date cannot be in the future");
  });

  it("should return an error for description being too long", () => {
    const result = validateTransaction(longDescription);
    expect(result?.description).toBe("Description is too long");
  });

  it("should return an error for description being too short", () => {
    const result = validateTransaction(shortDescription);
    expect(result?.description).toBe("Description is too short");
  });

  it("should return an error for missing currency", () => {
    const result = validateTransaction(missingCurrency);
    expect(result?.currency).toBe("Currency is required");
  });

  it("should return an error for amount being 0", () => {
    const result = validateTransaction(zeroAmount);
    expect(result?.amount).toBe("Amount is required, and can't be 0");
  });

  it("should return an error for empty amount", () => {
    const result = validateTransaction(emptyAmount);
    expect(result?.amount).toBe("Amount is required");
  });
});
