import csvParser from "csv-parser";
import { existsSync, createReadStream } from "node:fs";
import { Transaction } from "~/models/transaction";
import { CSVParseError } from "./errors";
import { handleRow } from "./parse";

export function parseCSV(
  filePath: string
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
      };
      const expectedHeaders = ["date", "amount", "description", "currency"];
      
      // TODO: Check if there is a better package
      let linenumber = 0;

      fileStream
        .pipe(csvParser(csvOptions))
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
          const { tnx, err } = handleRow(data, linenumber); // Assuming handleRow is defined
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
        .on("error", (error: Error) => {
          console.log(error)
          result.errors.push({
            type: "UnknownError",
            message: `Error reading file: ${error.message}`,
          });
          reject(result.errors);
        });
    } catch (error: unknown) {
      if (error instanceof Error) {
        result.errors.push({
          type: "UnknownError",
          message: `Error reading file: ${error.message}`,
        });
      } else {
        result.errors.push({
          type: "UnknownError",
          message: `An unknown error occurred.`,
        });
      }
      reject(result.errors);
    }
  });
}

// async function main() {
//   // read the csv file and process the data
//   console.log(await parseCSV("C:/projects/zluri/transactify/test.csv"));
// }

// main();
