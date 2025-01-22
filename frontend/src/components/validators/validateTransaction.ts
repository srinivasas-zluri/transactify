export interface TransactionValidationErrors {
  date?: string;
  description?: string;
  amount?: string;
  currency?: string;
}

interface TransactionData {
  date: string;
  description: string;
  amount: number | string;
  currency: string;
}

export function validateTransaction(
  data: TransactionData
): TransactionValidationErrors | null {
  const errors: { [key: string]: string } = {};
  if (!data.date.match(/\d{2}-\d{2}-\d{4}/)) {
    errors.date = "Invalid date format only dd-mm-yyyy allowed";
  }

  // try to parse the date
  const parsedDate = parseDate(data.date);
  if (!parsedDate) {
    errors.date = "Invalid date";
  }

  // check if date is in future
  if (parsedDate != null && parsedDate > new Date()) {
    errors.date = "Date cannot be in the future";
  }

  if (data.description.length > 254) {
    errors.description = "Description is too long";
  }

  if (data.description.length < 5) {
    errors.description = "Description is too short";
  }

  if (data.currency === "") {
    errors.currency = "Currency is required";
  }

  if (data.amount == 0) {
    errors.amount = "Amount is required, and can't be 0";
  }

  if (data.amount === "") {
    errors.amount = "Amount is required";
  }

  if (Object.keys(errors).length === 0) {
    return null;
  }

  return errors;
}

function parseDate(date: string) {
  const dateParts = date.split("-");
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);
  const parsedDate = new Date(`${year}-${month}-${day}`);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}
