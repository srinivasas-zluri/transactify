import { Transaction } from "~/models/transaction";
import { CSVParseError } from "./errors";

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

  // Parse the description
  tnx.description = row.description.trim();

  // Parse the currency
  tnx.currency = row.currency.trim().toUpperCase();

  return {
    tnx,
    err: errors.length > 0 ? errors[0] : null,
  };
}

export type CSVRow = {
  date: string;
  amount: string;
  description: string;
  currency: string;
};

function parseDate(date: string): Date | null {
  date = date.trim();
  if (date === "") {
    return null;
  }

  // check if date is the format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(date)) {
    return null; // Invalid format
  }


  try {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  } catch {
    return null;
  }
}

function parseAmount(amount: string): number | null {
  amount = amount.trim();
  if (amount === "") {
    return null;
  }
  try {
    const parsedAmount = parseFloat(amount);
    return isNaN(parsedAmount) ? null : parsedAmount;
  } catch {
    return null;
  }
}
