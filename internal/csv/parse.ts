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

  if (date && date > new Date()) {
    errors.push({
      type: "InvalidLine",
      message: "Date cannot be in the future",
      lineNo,
    });
  }

  if (date && date < new Date("2000-01-01")) {
    errors.push({
      type: "InvalidLine",
      message: "Date cannot be before 2014-01-01",
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

  // check if the amount of digits before and after the decimal point is correct
  const amountString = originalRow.amount.toString();
  const isValidAmount = amount !== null;
  const [whole, decimal] = amountString.split(".");
  if (isValidAmount && whole.length > 10) {
    errors.push({
      type: "InvalidLine",
      message: "Amount cannot be more than 10 digits before the decimal point",
      lineNo,
    });
  }

  if (isValidAmount && decimal && decimal.length > 2) {
    errors.push({
      type: "InvalidLine",
      message: "Amount cannot be more than 2 digits after the decimal point",
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

  if (!isValidStrictDate(date)) {
    return null;
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
  // const validNumberRegex = /^[+-]?\d+(\.\d+)?$/;
  // explain the regex
  // ^[+-]? - optional + or - at the start
  // (0|[1-9]\d*)? - optional 0 or a number that doesn't start with 0
  // (\.\d+)? - optional decimal point followed by one or more digits
  const validNumberRegex = /^[+-]?(0|[1-9]\d*)?(\.\d+)?(?<=\d)$/;
  if (!validNumberRegex.test(amount)) {
    return null;
  }

  const parsedAmount = parseFloat(amount);
  return parsedAmount;
}

function cleanSpaces(x: string): string {
  return x.trim().replace(/\s/g, "");
}

function isValidStrictDate(date: string): boolean {
  // check if it's a valid date
  // ex: 31-02-2025 is invalid
  const dateParts = date.split(/[-\/]/);
  const _day = parseInt(dateParts[0], 10);
  const _month = parseInt(dateParts[1], 10);
  const _year = parseInt(dateParts[2], 10);
  if (_day < 1 || _day > 31) {
    return false;
  }
  if (_month < 1 || _month > 12) {
    return false;
  }

  if (_month === 2 && _day > 29) {
    return false;
  }
  if ([4, 6, 9, 11].includes(_month) && _day > 30) {
    return false;
  }
  // check for leap year
  if (
    _month === 2 &&
    _day === 29 &&
    !((_year % 4 === 0 && _year % 100 !== 0) || _year % 400 === 0)
  ) {
    return false;
  }
  return true;
}
