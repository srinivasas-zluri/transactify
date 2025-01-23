import { Request, Response } from "express";
import {
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

export class TransactionController {
  private transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }
  // Create a single transaction
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      // check the headers of the data
      const transactionData = getValidatedTransactionData(req.body);
      if (transactionData === null) {
        res.status(400).json({ message: "Invalid transaction data" });
        return;
      }

      // check if the data that's sent is valid or not
      const { cleanedRow, errs } = validateTransactionData(transactionData);
      if (errs !== null) {
        res.status(400).json({ message: errs.message });
        return;
      }

      // convert the currency
      const { amount, err } = getConvertedCurrency({
        date: cleanedRow.date_string,
        amount: cleanedRow.amount!,
        currency: cleanedRow.currency,
      });

      if (err != null) {
        res.status(400).json({ message: err });
        return;
      }

      // create a new transaction
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

    // check if the file is a csv file
    const ext = path.extname(req.file.path);
    console.log({ ext });
    if (req.file.mimetype !== "text/csv" || ext.toLowerCase() !== ".csv") {
      res.status(400).json({ message: "Invalid file type" });
      return;
    }

    try {
      // take the file path add -errors to it
      const errorWriterFile = this.getErrorWriterFilePath(req.file.path);
      const CSVWriter = new FileCSVWriter(errorWriterFile);

      // parse the csv file
      const { rows, parsingErrors, validationErrors } = await parseCSV(
        req.file.path,
        { errorFileWriter: CSVWriter }
      );

      // convert the currency
      const { rowsWithoutErrors, conversionErrors } = this.processCSVRows(
        rows,
        CSVWriter
      );

      // create the transactions and check for duplicates
      const { duplicates } = await this.transactionService.createTransactions(
        rowsWithoutErrors
      );

      // check if there are any errors
      const numErrors =
        parsingErrors.length +
        Object.keys(validationErrors).length +
        conversionErrors;
      if (numErrors == 0 && duplicates.length == 0) {
        res.status(201).json({
          message: "All transactions created successfully",
        });
        return;
      }

      // generate error rows for duplicates
      const errorRowsArray = generateErrorsForFoundDuplicates(rows, duplicates);

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

      // check if the page and limit are valid
      const isInLimit = pageInt > 0 && limitInt > 0;
      const isParamNaN = isNaN(pageInt) || isNaN(limitInt);
      if (!isInLimit || isParamNaN) {
        res.status(400).json({ message: "Invalid page or limit" });
        return;
      }

      // check if the page and limit are too high
      if (limitInt > 100) {
        res.status(400).json({ message: "Page or limit too high" });
        return;
      }

      // get the transactions
      const { transactions, hasNextPage, hasPrevPage, totalTransactions } =
        await this.transactionService.getTransactions(pageInt, limitInt);
      res.status(200).json({
        transactions,
        totalTransactions,
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
      const { id: _id } = req.params;
      console.log({ _id });
      console.log({ _id });
      const id = Number(_id);
      if (Number.isNaN(id)) {
        res.status(400).json({ message: "Invalid transaction ID" });
        return;
      }

      // get the transaction that needs to be updated
      const transactionData = req.body as Transaction;
      const updatedTransaction =
        await this.transactionService.prepareUpdateTransaction(
          id,
          transactionData
        );
      if (!updatedTransaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }

      // convert the currency
      const { amount, err } = getConvertedCurrency({
        date: updatedTransaction.transaction_date_string,
        amount: updatedTransaction.amount,
        currency: updatedTransaction.currency,
      });
      if (err || amount == null || Number.isNaN(amount)) {
        res.status(400).json({ message: err });
        return;
      }
      updatedTransaction.inr_amount = amount;

      // update the transaction
      const tnxUpdated = await this.transactionService.updateTransaction(
        id,
        updatedTransaction
      );

      res.status(200).json(tnxUpdated);
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
      res.status(500).json({ message: "Failed to update transaction" });
      return;
    }
  }

  // Delete multiple transactions (if needed)
  async deleteTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body; // expects an array of IDs
      console.log({ ids });
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: "Invalid or missing 'ids' array" });
        return;
      }
      const deletedTransactions =
        await this.transactionService.deleteTransactions(ids);
      res.status(200).json(deletedTransactions);
      return;
    } catch (error) {
      console.error("Error deleting transactions:", error);
      res.status(500).json({ message: "Failed to delete transactions" });
      return;
    }
  }

  getErrorWriterFilePath(filePath: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ".csv");
    return path.join(dir, `${base}-errors.csv`);
  }

  // Process rows from CSV, handle conversion errors
  private processCSVRows(
    rows: { [lineNo: number]: Transaction },
    CSVWriter: FileCSVWriter
  ) {
    let conversionErrors = 0;
    const rowsWithoutErrors = Object.entries(rows).reduce(
      (acc, [lineno, transaction]) => {
        const lineNo = parseInt(lineno);
        const { amount, err } = getConvertedCurrency({
          date: transaction.transaction_date_string,
          amount: transaction.amount,
          currency: transaction.currency,
        });
        if (err || amount == null) {
          CSVWriter.writeRows([
            {
              ...transaction,
              lineNo,
              date: transaction.transaction_date_string,
              message: err,
            },
          ]);
          conversionErrors++;
        } else {
          transaction.inr_amount = amount;
          acc.push(transaction);
        }
        return acc;
      },
      [] as Transaction[]
    );
    return { rowsWithoutErrors, conversionErrors };
  }
}

interface TransactionData {
  date: string;
  amount: string;
  description: string;
  currency: string;
}

function getValidatedTransactionData(data: any): TransactionData | null {
  const requiredFields = ["date", "amount", "description", "currency"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return null;
    }
  }
  return data as TransactionData;
}

function validateTransactionData(data: TransactionData) {
  const cleanedRow = cleanRow(data);
  const TEMP_LINE_NO = 0;
  const errs = mergeCSVErrors(
    validateRow(cleanedRow, data, TEMP_LINE_NO),
    TEMP_LINE_NO
  );
  return { cleanedRow, errs };
}

function getConvertedCurrency({
  date,
  amount,
  currency,
}: {
  date: string;
  amount: number;
  currency: string;
}) {
  const splitDate = date.split("-");
  return convertCurrency({
    from: currency,
    amount: amount,
    year: splitDate[2],
    month: splitDate[1],
    day: splitDate[0],
  });
}

function generateErrorsForFoundDuplicates(
  rows: { [lineNo: number]: Transaction },
  duplicates: Transaction[]
) {
  // Create a set of keys for the duplicates
  const keySet = new Set(
    duplicates.map((t) => t.transaction_date_string + t.description)
  );

  // Find the line numbers of the duplicates
  const duplicatesLineNumbers = Object.entries(rows).reduce((prev, curr) => {
    const [lineNoString, tnx] = curr;
    const lineNo = parseInt(lineNoString);
    if (keySet.has(tnx.transaction_date_string + tnx.description)) {
      return [...prev, lineNo];
    }
    return prev;
  }, [] as number[]);

  // Create an array of error rows
  const errorRowsArray = [
    ...duplicatesLineNumbers.map((lineNo) => {
      return {
        lineNo: lineNo,
        message: "Duplicate entry already in db",
        date: rows[lineNo].transaction_date_string,
        ...rows[lineNo],
      };
    }),
  ];

  return errorRowsArray;
}
