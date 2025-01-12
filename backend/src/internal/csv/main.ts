import csvParser from "csv-parser";
import { existsSync, createReadStream } from "node:fs";
import { CSVRow, CSVParsedInfo, ValidationError, CSVParseError, CSVWriter } from "./types";
import { handleRow } from "./parse";

type DuplicationResult = { seen: true; lineNo: number } | { seen: false };

function checkDuplicationBuilder(): (
  value: string,
  index: number
) => DuplicationResult {
  const seen: { [dateAndDescription: string]: number /* linenumber */ } = {};
  return (value: string, index: number) => {
    const key = value;
    if (seen[key] !== undefined) {
      return { seen: true, lineNo: seen[key] };
    }
    seen[key] = index;
    return { seen: false };
  };
}

export function parseCSV(
  filePath: string,
  {
    seperator = ",",
    errorFileWriter = { writeRows: () => {} } as CSVWriter,
  } = {}
): Promise<CSVParsedInfo> {
  return new Promise((resolve, reject) => {
    // Check if the file exists
    if (!existsSync(filePath)) {
      reject({ type: "FileNotFound", filePath });
      return;
    }

    // Check if allowed file extensions
    if (!filePath.toLowerCase().endsWith(".csv")) {
      reject({
        type: "InvalidFormat",
        message: "Only CSV files are allowed.",
      });
      return;
    }

    const result: CSVParsedInfo = {
      rows: {},
      parsingErrors: [],
      validationErrors: {},
    };

    const errorRows: {
      [linenumber: number]: {
        error: ValidationError | CSVParseError;
        row: CSVRow;
      };
    } = {};

    const duplicationRows: {
      [key: string]: number[];
    } = {};

    const pushParseError = (
      error: CSVParseError,
      row: CSVRow,
      lineNo: number
    ) => {
      result.parsingErrors.push(error);
      errorRows[lineNo] = { error, row };
    };

    const pushValidationError = (
      error: ValidationError,
      row: CSVRow,
      lineNo: number
    ) => {
      result.validationErrors[lineNo] = error;
      errorRows[lineNo] = { error, row };
    };

    try {
      const fileStream = createReadStream(filePath);
      const checkDuplication = checkDuplicationBuilder();

      const csvOptions: csvParser.Options = {
        // strict: true,
        mapHeaders: ({ header }) => header.trim().toLowerCase(), // Trim headers
        mapValues: ({ value }) => (value ? value.trim() : value), // Trim values
        separator: seperator,
      };
      const parser = csvParser(csvOptions);
      const expectedHeaders = ["date", "amount", "description", "currency"];

      // TODO: Check if there is a better package
      let linenumber = 0;

      fileStream
        .pipe(parser)
        // check if all the headers are present
        .on("headers", (headers) => {
          // Check if all expected headers are present
          const missingHeaders = expectedHeaders.filter(
            (header) => !headers.includes(header)
          );
          if (missingHeaders.length > 0) {
            reject({
              type: "InvalidFormat",
              message: `The headers ${missingHeaders.join(
                ", "
              )} aren't present`,
            });
          }
        })
        .on("data", (data: any) => {
          linenumber++;
          const missingFields = expectedHeaders.filter(
            (header) => !Object.keys(data).includes(header)
          );
          // find out if it's a blank line
          const isBlankLine =
            missingFields.length === expectedHeaders.length ||
            missingFields.length === expectedHeaders.length - 1;
          if (isBlankLine) {
            return;
          }
          // find if all the fields are blank
          const allFieldsBlank = expectedHeaders.every(
            (header) => data[header] === ""
          );
          if (allFieldsBlank) {
            return;
          }
          if (missingFields.length > 0) {
            pushParseError(
              {
                type: "InvalidLine",
                message: `Missing fields in the row: ${JSON.stringify(data)}`,
                lineNo: linenumber,
              },
              data,
              linenumber
            );
            return;
          }
          // handle parsing of the row
          const row: CSVRow = {
            date: data.date,
            amount: data.amount,
            description: data.description,
            currency: data.currency,
          };
          const { tnx, err: parseErr } = handleRow(row, linenumber);
          // return if parse error
          if (parseErr !== null) {
            pushParseError(parseErr, row, linenumber);
            return;
          }
          // check for duplication row
          const key = `${tnx.transaction_date_string} ${tnx.description}`;
          const isDuplicate = checkDuplication(key, linenumber);

          // if not duplicate, add to the result and return
          if (!isDuplicate.seen) {
            result.rows[linenumber] = tnx;
            return;
          }

          // if duplicate, add to the validation errors
          if (duplicationRows[key] === undefined) {
            duplicationRows[key] = [isDuplicate.lineNo];
          }
          duplicationRows[key].push(linenumber);
          pushValidationError(
            {
              type: "RepeatedElementsFound",
              message: `Duplicate entries found for ${key}`,
              duplicationKey: key,
            },
            row,
            linenumber
          );
        })
        .on("end", () => {
          const errorRowsArray = Object.entries(errorRows).map(
            ([lineNo, { error, row }]) => ({
              lineNo,
              errorType: error.type,
              message:
                error.type === "RepeatedElementsFound"
                  ? `Duplicate elements found in the following line numbers ${duplicationRows[
                      error.duplicationKey
                    ].join(", ")}`
                  : error.message,
              ...row,
            })
          );
          // write the error rows to a file if it's not empty
          if (errorRowsArray.length > 0) {
            errorFileWriter.writeRows(errorRowsArray);
          }

          resolve(result);
        })
        .on("error", (err) => {
          result.parsingErrors.push({
            type: "UnknownError",
            message: `An unknown error occurred.`,
          });
          resolve(result);
        });
    } catch (error: unknown) {
      reject({
        type: "UnknownError",
        message: `An unknown error occurred.`,
      });
    }
  });
}

// async function main() {
//   // read the csv file and process the data
//   console.log(await parseCSV("C:/projects/zluri/transactify/test.csv"));
// }

// main();
