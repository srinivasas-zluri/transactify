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
  const cleanDate = cleanSpaces(row.date);
  const date = parseDate(cleanDate);
  if (date !== null) {
    tnx.transaction_date = date;
  } else {
    errors.push({
      type: "InvalidLine",
      message: `Invalid date format(DD-MM-YYYY): ${row.date}`,
      lineNo: lineno,
    });
  }

  // Parse the amount
  const amount = parseAmount(cleanSpaces(row.amount));
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

  // Set the transaction date string
  tnx.transaction_date_string = cleanDate;

  return {
    tnx,
    err: errors.length > 0 ? errors[0] : null,
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

  const parsedDate = new Date(date);
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