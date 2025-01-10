import { Transaction } from "~/models/transaction";
import { CSVParseError, CSVRow } from "./types";

export function handleRow(
  row: CSVRow,
  lineno: number
): {
  tnx: Transaction;
  err: CSVParseError | null;
} {
  const tnx = new Transaction();
  const errors: CSVParseError[] = [];

  // Parse the date
  const date = parseDate(row.date);
  if (date !== null) {
    tnx.transaction_date = date;
  } else {
    errors.push({
      type: "InvalidLine",
      message: `Invalid date format(YYYY-MM-DD): ${row.date}`,
      lineNo: lineno,
    });
  }

  // Parse the amount
  const amount = parseAmount(row.amount);
  if (amount !== null) {
    tnx.amount = amount;
  } else {
    errors.push({
      type: "InvalidLine",
      message: `Invalid amount format: ${row.amount}`,
      lineNo: lineno,
    });
  }

  if (row.description === "") {
    errors.push({
      type: "InvalidLine",
      message: "Description cannot be empty",
      lineNo: lineno,
    });
  }

  // Parse the description
  tnx.description = row.description.trim();

  // Parse the currency
  tnx.currency = row.currency.trim().toUpperCase();

  return {
    tnx,
    err: errors.length > 0 ? errors[0] : null,
  };
}

function parseDate(date: string): Date | null {
  // remove leading and trailing spaces
  date = date.trim();

  // remove inbetween spaces
  date = date.replace(/\s/g, "");

  if (date === "") {
    return null;
  }

  // check if date is the format YYYY-MM-DD
  const regex = /^\d{4}[-\/]\d{2}[-\/]\d{2}$/;

  if (!regex.test(date)) {
    return null; // Invalid format
  }

  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function parseAmount(amount: string): number | null {
  // remove leading and trailing spaces
  amount = amount.trim();

  // remove inbetween spaces
  amount = amount.replace(/\s/g, "");

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
