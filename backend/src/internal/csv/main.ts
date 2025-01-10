import csvParser from "csv-parser";
import { existsSync, createReadStream } from "node:fs";
import { Transaction } from "~/models/transaction";
import { CSVParseError, CSVRow } from "./types";
import { handleRow } from "./parse";

export function parseCSV(
  filePath: string,
  { seperator = "," } = {}
): Promise<Transaction[] | CSVParseError[]> {
  return new Promise((resolve, reject) => {
    // Check if the file exists
    if (!existsSync(filePath)) {
      reject([{ type: "FileNotFound", filePath }]);
      return;
    }

    // Check if allowed file extensions
    if (!filePath.toLowerCase().endsWith(".csv")) {
      reject([
        {
          type: "InvalidFormat",
          message: "Only CSV files are allowed.",
        },
      ]);
      return;
    }

    const result: { rows: Transaction[]; errors: CSVParseError[] } = {
      rows: [],
      errors: [],
    };

    try {
      const fileStream = createReadStream(filePath);

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
            result.errors.push({
              type: "InvalidLine",
              message: `Missing fields in the row: ${JSON.stringify(data)}`,
              lineNo: linenumber,
            });
            return;
          }
          const row: CSVRow = {
            date: data.date,
            amount: data.amount,
            description: data.description,
            currency: data.currency,
          };
          const { tnx, err } = handleRow(row, linenumber);
          if (err === null) {
            result.rows.push(tnx);
          } else {
            result.errors.push(err);
          }
        })
        .on("end", () => {
          if (result.errors.length > 0) {
            reject(result.errors);
          }
          resolve(result.rows);
        })
        .on("error", (err) => {
          result.errors.push({
            type: "UnknownError",
            message: `An unknown error occurred.`,
          });
          reject(result.errors);
        });
    } catch (error: unknown) {
      result.errors.push({
        type: "UnknownError",
        message: `An unknown error occurred.`,
      });
      reject(result.errors);
    }
  });
}

// async function main() {
//   // read the csv file and process the data
//   console.log(await parseCSV("C:/projects/zluri/transactify/test.csv"));
// }

// main();
