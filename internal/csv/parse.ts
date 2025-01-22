import { Transaction } from "~/models/transaction";
import { CSVParseError, CSVRow } from "./types";

interface CleanedRow {
  date: Date | null;
  date_string: string;
  amount: number | null;
  description: string;
  currency: string;
}

export function cleanRow(row: CSVRow): CleanedRow {
  const trimExtraSpaces = (x: string) => x.trim().replace(/\s+/g, " ");
  return {
    date: parseDate(cleanSpaces(row.date)),
    date_string: cleanSpaces(row.date),
    amount: parseAmount(cleanSpaces(row.amount.toString())),
    description: trimExtraSpaces(row.description.trim()).toLowerCase(),
    currency: cleanSpaces(row.currency.trim()).toUpperCase(),
  };
}

export function validateRow(
  row: CleanedRow,
  originalRow: CSVRow,
  lineNo: number
): CSVParseError[] {
  const errors: CSVParseError[] = [];

  const date = row.date;
  if (date === null) {
    errors.push({
      type: "InvalidLine",
      message: `Invalid date format(DD-MM-YYYY): ${originalRow.date}`,
      lineNo,
    });
  }

  const amount = row.amount;
  if (amount === null) {
    errors.push({
      type: "InvalidLine",
      message: `Invalid amount format: ${originalRow.amount}`,
      lineNo,
    });
  }

  if (row.description === "") {
    errors.push({
      type: "InvalidLine",
      message: "Description cannot be empty",
      lineNo,
    });
  }

  if (row.description.length > 253) {
    errors.push({
      type: "InvalidLine",
      message: "Description cannot be more than 253 characters",
      lineNo,
    });
  }

  return errors;
}

export const mergeCSVErrors = (
  errors: CSVParseError[],
  lineNo: number
): CSVParseError | null => {
  if (errors.length === 0) {
    return null;
  }

  if (errors.length === 1) {
    return errors[0];
  } else {
    return {
      type: "MultipleErrors",
      message: errors.map((e) => e.message).join(", "),
      lineNo,
      errors,
    };
  }
};

export function handleRow(
  row: CSVRow,
  lineno: number
): {
  tnx: Transaction;
  err: CSVParseError | null;
} {
  const tnx = new Transaction();

  const cleanedRow = cleanRow(row);
  const errors = validateRow(cleanedRow, row, lineno);

  tnx.transaction_date = cleanedRow.date || new Date();
  tnx.transaction_date_string = cleanedRow.date_string;
  tnx.amount = cleanedRow.amount || 0;
  tnx.description = cleanedRow.description;
  tnx.currency = cleanedRow.currency;

  let err: CSVParseError | null = mergeCSVErrors(errors, lineno);

  return {
    tnx,
    err,
  };
}

function parseDate(date: string): Date | null {
  if (date === "") {
    return null;
  }

  // Check if the date is in the format DD-MM-YYYY or DD/MM/YYYY
  const regex = /^\d{2}[-\/]\d{2}[-\/]\d{4}$/;

  if (!regex.test(date)) {
    return null; // Invalid format
  }

  // Split the date by either '-' or '/'
  const separator = date.includes("-") ? "-" : "/";
  const [day, month, year] = date.split(separator);

  const parsedDate = new Date(`${year}-${month}-${day}`);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function parseAmount(amount: string): number | null {
  if (amount === "") {
    return null;
  }

  // valid number regex
  const validNumberRegex = /^[+-]?\d+(\.\d+)?$/;
  if (!validNumberRegex.test(amount)) {
    return null;
  }

  const parsedAmount = parseFloat(amount);
  return parsedAmount;
}

function cleanSpaces(x: string): string {
  return x.trim().replace(/\s/g, "");
}
