import { createObjectCsvWriter } from "csv-writer";
import { CSVWriter, IOError } from "./types";

export class FileCSVWriter implements CSVWriter {
  private filepath: string;

  constructor(filePath: string) {
    this.filepath = filePath;
  }

  async writeRows(rows: any[]): Promise<IOError | null> {
    try {
      if (rows.length === 0) {
        console.log("No data to write.");
        return null;
      }

      // Use the first row's keys as the header for the CSV file
      const headers = Object.keys(rows[0]).map((key) => ({
        id: key,
        title: key,
      }));

      const csvWriter = createObjectCsvWriter({
        path: this.filepath,
        header: headers,
        append: true,
      });

      await csvWriter.writeRecords(rows);
      return null;
    } catch (error) {
      console.error("Error writing to CSV file:", error);
      return { type: "WriteError", message: "Error writing to CSV file" };
    }
  }
}
