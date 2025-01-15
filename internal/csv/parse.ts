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

  // Parse the description
  row.description = row.description.trim().toLowerCase();
  // remove any extra spaces
  row.description = row.description.replace(/\s+/g, " ");
  if (row.description === "") {
    errors.push({
      type: "InvalidLine",
      message: "Description cannot be empty",
      lineNo: lineno,
    });
  }

  // blit the description
  tnx.description = row.description.trim().toLowerCase();

  // Parse the currency
  tnx.currency = row.currency.trim().toUpperCase();

  // Set the transaction date string
  tnx.transaction_date_string = cleanDate;

  let err: CSVParseError | null = null;
  if (errors.length == 1) {
    err = errors[0];
  } else if (errors.length > 1) {
    err = {
      type: "MultipleErrors",
      message: errors.map((e) => e.message).join(", "),
      lineNo: lineno,
      errors,
    };
  }

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
