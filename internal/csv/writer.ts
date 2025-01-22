import { createObjectCsvWriter } from "csv-writer";
import { CSVWriter, ErrorRow, IOError } from "./types";

export class FileCSVWriter implements CSVWriter {
  private filepath: string;
  private headerWritten: boolean;

  constructor(filePath: string) {
    this.filepath = filePath;
    this.headerWritten = false;
  }

  async writeRows(rows: ErrorRow[]): Promise<IOError | null> {
    try {
      if (rows.length === 0) {
        console.log("No data to write.");
        return null;
      }

      const headers = {
        lineNo: "lineNo",
        message: "message",
        date: "date",
        amount: "amount",
        description: "description",
        currency: "currency",
      };

      const csvWriter = createObjectCsvWriter({
        path: this.filepath,
        header: Object.values(headers),
        append: true,
      });

      if (!this.headerWritten) {
        await csvWriter.writeRecords([headers]);
        this.headerWritten = true;
      }

      await csvWriter.writeRecords(rows);
      return null;
    } catch (error) {
      console.error("Error writing to CSV file:", error);
      return { type: "WriteError", message: "Error writing to CSV file" };
    }
  }
}
