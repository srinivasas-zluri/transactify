import { Transaction } from "~/models/transaction";

export type IOError =
  | { type: "FileNotFound"; filePath: string }
  | { type: "InvalidFormat"; message: string };

export type CSVParseError =
  | { type: "InvalidLine"; lineNo: number; message: string }
  | { type: "UnknownError"; message: string };

export type ValidationError =
  | { type: "RepeatedElementsFound"; message: string; duplicationKey: string }
  | { type: "DateInFuture"; message: string };

export type CSVParsedInfo = {
  rows: {
    [linenumber: number]: Transaction;
  };
  validationErrors: {
    [linenumber: number]: ValidationError;
  }
  parsingErrors: CSVParseError[];
};

export type CSVValidationError = { type: "Duplicate entries"; value: string };

export type CSVRow = {
  date: string;
  amount: string;
  description: string;
  currency: string;
};
