import csvParser from "csv-parser";
import { existsSync, createReadStream } from "node:fs";
import {
  CSVRow,
  CSVParsedInfo,
  ValidationError,
  CSVParseError,
  CSVWriter,
} from "./types";
import { handleRow } from "./parse";

type ErrorRows = {
  [linenumber: number]: {
    error: ValidationError | CSVParseError;
    row: CSVRow;
  };
};

export class CSVParseService {
  private filePath: string;
  private separator: string;
  private errorFileWriter: CSVWriter;
  private result: CSVParsedInfo;
  private errorRows: ErrorRows;
  private duplicationRows: { [key: string]: number[] };

  constructor(filePath: string, separator: string, errorFileWriter: CSVWriter) {
    this.filePath = filePath;
    this.separator = separator;
    this.errorFileWriter = errorFileWriter;
    this.result = { rows: {}, parsingErrors: [], validationErrors: {} };
    this.errorRows = {};
    this.duplicationRows = {};
  }

  public async parse(): Promise<CSVParsedInfo> {
    // Check if the file exists
    if (!existsSync(this.filePath)) {
      throw { type: "FileNotFound", filePath: this.filePath };
    }

    // Check if the file is a CSV file
    if (!this.filePath.toLowerCase().endsWith(".csv")) {
      throw {
        type: "InvalidFormat",
        message: "Only CSV files are allowed.",
      };
    }

    try {
      const fileStream = createReadStream(this.filePath);
      const checkDuplication = this.createDuplicationChecker();

      const parserOptions = this.createParserOptions();
      const parser = csvParser(parserOptions);
      const expectedHeaders = ["date", "amount", "description", "currency"];

      return new Promise<CSVParsedInfo>((resolve, reject) => {
        let lineNo = 0;

        fileStream
          .pipe(parser)
          .on("headers", (headers) =>
            this.handleHeaders(headers, expectedHeaders, reject)
          )
          .on("data", (data: any) => {
            lineNo++;
            this.processRow(data, lineNo, expectedHeaders, checkDuplication);
          })
          .on("end", async () => {
            await this.handleEndOfFile(resolve, reject);
          })
          .on("error", (err) => this.handleError(err, resolve));
      });
    } catch (err) {
      throw { type: "UnknownError", message: "An unknown error occurred." };
    }
  }

  private createParserOptions() {
    return {
      mapHeaders: ({ header }: any) => header.trim().toLowerCase(),
      mapValues: ({ value }: any) => (value ? value.trim() : value),
      separator: this.separator,
    };
  }

  private handleHeaders(
    headers: string[],
    expectedHeaders: string[],
    reject: Function
  ) {
    const missingHeaders = expectedHeaders.filter(
      (header) => !headers.includes(header)
    );
    if (missingHeaders.length > 0) {
      reject({
        type: "InvalidFormat",
        message: `The headers ${missingHeaders.join(", ")} aren't present`,
      });
    }
  }

  private processRow(
    data: any,
    lineNo: number,
    expectedHeaders: string[],
    checkDuplication: (value: string, index: number) => DuplicationCheckResult
  ) {
    const missingFields = expectedHeaders.filter(
      (header) => !Object.keys(data).includes(header)
    );

    if (this.isBlankLine(data, missingFields, expectedHeaders)) return;

    if (missingFields.length > 0) {
      this.pushParseError(
        {
          type: "InvalidLine",
          message: `Missing fields in the row: ${JSON.stringify(data)}`,
          lineNo,
        },
        data,
        lineNo
      );
      return;
    }

    const row: CSVRow = {
      date: data.date,
      amount: data.amount,
      description: data.description,
      currency: data.currency,
    };

    const { tnx, err } = handleRow(row, lineNo);
    if (err !== null) {
      this.pushParseError(err, row, lineNo);
      return;
    }

    const key = `${tnx.transaction_date_string} ${tnx.description}`;
    const isDuplicate = checkDuplication(key, lineNo);

    if (!isDuplicate.seen) {
      this.result.rows[lineNo] = tnx;
      return;
    }

    this.handleDuplicate(key, row, lineNo, isDuplicate);
  }

  private isBlankLine(
    data: any,
    missingFields: string[],
    expectedHeaders: string[]
  ) {
    return (
      missingFields.length === expectedHeaders.length ||
      missingFields.length === expectedHeaders.length - 1 ||
      expectedHeaders.every((header) => data[header] === "")
    );
  }

  private handleDuplicate(
    key: string,
    row: CSVRow,
    lineNo: number,
    isDuplicate: { seen: true; lineNo: number }
  ) {
    const isDuplicateRowAlreadySeen = this.duplicationRows[key] !== undefined;
    if (!isDuplicateRowAlreadySeen) {
      this.duplicationRows[key] = [isDuplicate.lineNo];
    }
    this.duplicationRows[key].push(lineNo);
    this.pushValidationError(
      {
        type: "RepeatedElementsFound",
        message: `Duplicate entries found for ${key}`,
        duplicationKey: key,
      },
      row,
      lineNo
    );
  }

  private pushParseError(error: CSVParseError, row: CSVRow, lineNo: number) {
    this.result.parsingErrors.push(error);
    this.errorRows[lineNo] = { error, row };
  }

  private pushValidationError(
    error: ValidationError,
    row: CSVRow,
    lineNo: number
  ) {
    this.result.validationErrors[lineNo] = error;
    this.errorRows[lineNo] = { error, row };
  }

  private async handleEndOfFile(resolve: Function, reject: Function) {
    const errorRowsArray = this.flattenErrorRowsAndDeleteErrorRows();

    if (errorRowsArray.length > 0) {
      try {
        const error = await this.errorFileWriter.writeRows(errorRowsArray);
        if (error !== null) {
          reject(error);
        }
      } catch (err) {
        reject({
          type: "UnknownError",
          message: "An error occurred while writing error rows.",
        });
      }
    }

    resolve(this.result);
  }

  private flattenErrorRowsAndDeleteErrorRows() {
    const handledDuplicateKeys: { [key: string]: boolean } = {};
    return Object.entries(this.errorRows).reduce(
      (prev, [lineNoString, { error, row }]) => {
        const lineNo = parseInt(lineNoString);
        delete this.result.rows[lineNo];
        if (error.type !== "RepeatedElementsFound") {
          return [
            ...prev,
            { lineNo, errorType: error.type, message: error.message, ...row },
          ];
        }

        if (handledDuplicateKeys[error.duplicationKey]) return prev;

        handledDuplicateKeys[error.duplicationKey] = true;
        const dupErrRows = [];
        for (const lineNumber of this.duplicationRows[error.duplicationKey]) {
          delete this.result.rows[lineNumber];
          dupErrRows.push({
            lineNo: lineNumber,
            errorType: error.type,
            message: `Duplicate elements found in the following line numbers ${this.duplicationRows[
              error.duplicationKey
            ].join(", ")}`,
            ...row,
          });
        }
        return [...prev, ...dupErrRows];
      },
      [] as any[]
    );
  }

  private handleError(err: any, resolve: Function) {
    this.result.parsingErrors.push({
      type: "UnknownError",
      message: `An unknown error occurred.`,
    });
    resolve(this.result);
  }

  private createDuplicationChecker(): (
    value: string,
    index: number
  ) => DuplicationCheckResult {
    const seen: { [key: string]: number } = {};
    return (value: string, index: number) => {
      if (seen[value] !== undefined) {
        return { seen: true, lineNo: seen[value] };
      }
      seen[value] = index;
      return { seen: false };
    };
  }
}

type DuplicationCheckResult = { seen: false } | { seen: true; lineNo: number };
