import { Request, Response } from "express";
import {
  CurrencyConversionError,
  TransactionParseError,
  TransactionService,
} from "~/services/transaction.service";
import { Transaction } from "~/models/transaction";
import path from "node:path";
import { parseCSV } from "~/internal/csv/main";
import { FileCSVWriter } from "~/internal/csv/writer";
import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { convertCurrency } from "~/services/conversion.service";
import { cleanRow, mergeCSVErrors, validateRow } from "~/internal/csv/parse";
import fs from "fs";

export class TransactionController {
  private transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }
  // Create a single transaction
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionData = req.body as TransactionData;
      if (!checkValidHeadersPresent(transactionData)) {
        res.status(400).json({ message: "Invalid transaction data" });
        return;
      }

      const cleanedRow = cleanRow(transactionData);
      const TEMP_LINE_NO = 0;
      const errs = mergeCSVErrors(
        validateRow(cleanedRow, transactionData, TEMP_LINE_NO),
        TEMP_LINE_NO
      );

      if (errs !== null) {
        res.status(400).json({ message: errs.message });
        return;
      }

      const splitDate = cleanedRow.date_string!.split("-");

      const { amount, err } = convertCurrency({
        from: cleanedRow.currency!,
        amount: cleanedRow.amount!,
        year: splitDate[2],
        month: splitDate[1],
        day: splitDate[0],
      });

      if (err != null) {
        res.status(400).json({ message: err });
        return;
      }

      const newTnx = new Transaction();
      newTnx.transaction_date = cleanedRow.date!;
      newTnx.transaction_date_string = cleanedRow.date_string!;
      newTnx.amount = cleanedRow.amount!;
      newTnx.description = cleanedRow.description!;
      newTnx.currency = cleanedRow.currency!;
      newTnx.inr_amount = amount;

      const transaction = await this.transactionService.createTransaction(
        newTnx
      );
      res.status(201).json(transaction);
      return;
    } catch (error) {

      if (error instanceof UniqueConstraintViolationException) {
        res.status(409).json({ message: "Transaction already exists" });
        return;
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
      return;
    }
  }

  // Create multiple transactions
  async createTransactions(req: Request, res: Response): Promise<void> {
    // check if the user sent a file
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const ext = path.extname(req.file.path);
    console.log({ ext });
    // check if csv file
    if (req.file.mimetype !== "text/csv" || ext.toLowerCase() !== ".csv") {
      res.status(400).json({ message: "Invalid file type" });
      return;
    }
    try {
      // take the file path add -errors to it
      const errorWriterFile = req.file.path.split(".csv")[0] + "-errors.csv" ;

      // Get the directory of the file
      const dir = path.dirname(errorWriterFile);

      const CSVWriter = new FileCSVWriter(errorWriterFile);
      const { rows, parsingErrors, validationErrors } = await parseCSV(
        req.file.path,
        { errorFileWriter: CSVWriter }
      );
      let conversionErrors = 0;
      Object.entries(rows).forEach(([lineNo, tnx]) => {
        const splitDate = tnx.transaction_date_string.split("-");
        const { amount, err } = convertCurrency({
          from: tnx.currency,
          amount: tnx.amount,
          year: splitDate[2],
          month: splitDate[1],
          day: splitDate[0],
        });
        if (err != null) {
          // reommve the line
          delete rows[Number(lineNo)];
          conversionErrors++;
          // write the errors
          CSVWriter.writeRows([
            {
              lineNo: parseInt(lineNo),
              message: err,
              date: tnx.transaction_date_string,
              ...tnx,
            },
          ]);
          return;
        }
        tnx.inr_amount = amount;
      });

      const transactions = [...Object.values(rows)];
      const { duplicates } = await this.transactionService.createTransactions(
        transactions
      );

      const numErrors =
        parsingErrors.length + Object.keys(validationErrors).length;
      if (numErrors == 0 && duplicates.length == 0 && conversionErrors == 0) {
        res.status(201).json({
          message: "All transactions created successfully",
        });
        return;
      }

      // find the line numbers
      const keySet = new Set(
        duplicates.map((t) => t.transaction_date_string + t.description)
      );
      const duplicatesLineNumbers = Object.entries(rows).reduce(
        (prev, curr) => {
          const [lineNoString, tnx] = curr;
          const lineNo = parseInt(lineNoString);
          if (keySet.has(tnx.transaction_date_string + tnx.description)) {
            return [...prev, lineNo];
          }
          return prev;
        },
        [] as any[]
      );
      // write to the error file
      const errorRowsArray = [
        ...duplicatesLineNumbers.map((lineNo) => ({
          lineNo: lineNo,
          message: "Duplicate entry already in db",
          date: transactions[lineNo - 1].transaction_date_string,
          ...transactions[lineNo - 1],
        })),
      ];

      // write the error rows to a file
      const error = await CSVWriter.writeRows(errorRowsArray);

      if (error !== null) {
        console.error("Error creating transactions:", error);
        res
          .status(500)
          .json({ message: "Server failed to generate an error file" });
        return;
      }

      // return the error file
      res.sendFile(path.resolve(errorWriterFile));
    } catch (error) {
      console.error("Error creating transactions:", error);
      res.status(500).json({ message: "Failed to create transactions" });
      return;
    }
  }

  // Get a transaction by ID
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransactionById(
        Number(id)
      );
      if (!transaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }
      res.status(200).json(transaction);
      return;
    } catch (error) {
      console.error("Error retrieving transaction:", error);
      res.status(500).json({ message: "Failed to retrieve transaction" });
      return;
    }
  }

  // Get paginated transactions
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const pageInt = Number(page);
      const limitInt = Number(limit);
      if (pageInt < 1 || limitInt < 1) {
        res.status(400).json({ message: "Invalid page or limit" });
        return;
      }
      if (limitInt > 100) {
        res.status(400).json({ message: "Page or limit too high" });
        return;
      }
      const { transactions, hasNextPage, hasPrevPage } =
        await this.transactionService.getTransactions(pageInt, limitInt);
      res.status(200).json({
        transactions,
        nextPage: { page: hasNextPage ? pageInt + 1 : null, limit: limitInt },
        prevPage: { page: hasPrevPage ? pageInt - 1 : null, limit: limitInt },
      });
      return;
    } catch (error) {
      console.error("Error retrieving transactions:", error);
      res.status(500).json({ message: "Failed to retrieve transactions" });
      return;
    }
  }

  // Update a transaction by ID
  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transactionData = req.body as Transaction;
      console.log({transactionData})
      const updatedTransaction =
        await this.transactionService.updateTransaction(
          Number(id),
          transactionData
        );
      if (!updatedTransaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }
      res.status(200).json(updatedTransaction);
      return;
    } catch (error) {
      console.log("Error updating transaction:", error);
      // print the instance of error
      console.log({ error });
      if (error instanceof TransactionParseError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof UniqueConstraintViolationException) {
        res.status(409).json({ message: "Transaction already exists" });
        return;
      }
      if (error instanceof CurrencyConversionError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Failed to update transaction" });
      return;
    }
  }

  // Delete a transaction by ID
  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedTransaction =
        await this.transactionService.deleteTransaction(Number(id));
      if (!deletedTransaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }
      res.status(200).json(deletedTransaction);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  }

  // Delete multiple transactions (if needed)
  // async deleteTransactions(req: Request, res: Response) {
  //   try {
  //     const { ids } = req.body; // expects an array of IDs
  //     const deletedTransactions = await this.transactionService.deleteTransactions(ids);
  //     if (!deletedTransactions || deletedTransactions.length === 0) {
  //       return res.status(404).json({ message: "Transactions not found" });
  //     }
  //     return res.status(200).json(deletedTransactions);
  //   } catch (error) {
  //     console.error("Error deleting transactions:", error);
  //     return res.status(500).json({ message: "Failed to delete transactions" });
  //   }
  // }
}

interface TransactionData {
  date: string;
  amount: string;
  description: string;
  currency: string;
}

function checkValidHeadersPresent(data: any): boolean {
  const requiredFields = ["date", "amount", "description", "currency"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return false;
    }
  }
  return true;
}
