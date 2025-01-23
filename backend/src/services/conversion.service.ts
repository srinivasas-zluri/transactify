// This file contains the logic to convert currency from one to another
// Reads the conversion rates from a JSON file and converts the currency
// Usage:
// import { convertCurrency } from "~/services/conversion.service";
// const res = convertCurrency({
//     from: "usd",
//     amount: 1,
//     year: "2021",
//     month: "01",
//     day: "01"
// })
// console.log(res);
import * as importedCurrencyData from "./selected_currencies.json";

type CurrencyData = {
  [date: string]: {
    [currency: string]: number; // assuming the currency data maps to a numeric value
  };
};

const currencyData: CurrencyData = importedCurrencyData as CurrencyData;


const currencyKeys = new Set();
for (const date in currencyData) {
  for (const currency in currencyData[date]) {
    currencyKeys.add(currency);
  }
}

interface ConvertCurrencyArgs {
  from: string;
  amount: number;
  year: string;
  month: string;
  day: string;
}

export function convertCurrency(
  args: ConvertCurrencyArgs
): { amount: number; err: null } | { amount: null; err: string } {
  if (!currencyKeys.has(args.from.toUpperCase())) {
    return {
      amount: null,
      err: `Currency ${args.from} not supported`,
    };
  }
  const { from, amount, year, month, day } = args;
  const date = `${year}-${month}-${day}`;
  // checkc if the date is present in the currency data
  if (!currencyData[date]) {
    return {
      amount: null,
      err: `No conversion rates found for ${date}`,
    };
  }

  // check if the from currency is present in the currency data
  const rate = currencyData[date][from.toUpperCase()];
  if (!rate) {
    return {
      amount: null,
      err: `No conversion rate found for ${from} on ${date}`,
    };
  }
  return { amount: amount * rate, err: null };
}