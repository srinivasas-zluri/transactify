import { DBServices } from "~/db";
import { handleRow } from "~/internal/csv/main";
import { CSVParseError, CSVRow } from "~/internal/csv/types";
import { Transaction } from "~/models/transaction";

export class TransactionService {
  private db: DBServices;

  constructor(db: DBServices) {
    this.db = db;
  }

  get em() {
    return this.db.em.fork();
  }

  async createTransaction(
    transaction: Transaction,
  ) {
    const em = this.em;
    await em.persistAndFlush(transaction);
    return transaction;
  }

  async createTransactions(
    transactions: Transaction[]
  ): Promise<{ duplicates: Transaction[] }> {
    const em = this.em;
    // TODO: Optimize the search of the transactions later
    // find duplicates with the db where (transaction_date, description) is the same
    const duplicates = await em.find(
      Transaction,
      transactions.map((t) => ({
        transaction_date_string: t.transaction_date_string,
        description: t.description,
        is_deleted: false,
      }))
    );
    // create a set of duplicates
    const duplicatesSet = new Set(
      duplicates.map((t) => t.transaction_date_string + t.description)
    );
    // filter out duplicates
    transactions = transactions.filter(
      (t) => !duplicatesSet.has(t.transaction_date_string + t.description)
    );
    await em.persistAndFlush(transactions);
    return { duplicates };
  }

  async getAllTransactions() {
    return this.em.find(Transaction, { is_deleted: false });
  }

  async getTransactionById(id: number) {
    return this.em.findOne(Transaction, { id, is_deleted: false });
  }

  async getTransactions(page: number, limit: number) {
    // return with if next and prev page are available
    const totalTransactions = await this.em.count(Transaction, {
      is_deleted: false,
    });
    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const transactions = await this.em.find(
      Transaction,
      { is_deleted: false },
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { transaction_date: "asc" },
      }
    );
    return { transactions, hasNextPage, hasPrevPage };
  }

  // async getTransactionById(id: number) {
  //   return this.em.findOne(Transaction, { id });
  // }

  async updateTransaction(
    id: number,
    transaction: Transaction,
    validateRowFn: (row: CSVRow) => {
      tnx: Transaction;
      err: CSVParseError | null;
    } = (x) => handleRow(x, 0)
  ): Promise<Transaction | null> {
    const em = this.em.fork();
    const originalTransaction = await em.findOne(Transaction, {
      id,
      is_deleted: false,
    });
    console.log("originalTransaction", originalTransaction);
    if (!originalTransaction) {
      return null;
    }
    // build the csvrow for partial updates
    const transactionBuilder = {
      date: cleanString(transaction.transaction_date_string),
      amount: cleanString(transaction.amount?.toString()),
      description: cleanString(transaction.description),
      currency: cleanString(transaction.currency),
    } as {
      date: string;
      amount: string;
      description: string;
      currency: string;
    };

    // handle partial values
    transactionBuilder.date = checkString(transactionBuilder.date)
      ? transactionBuilder.date
      : originalTransaction.transaction_date_string;
    transactionBuilder.amount = checkString(transactionBuilder.amount)
      ? transactionBuilder.amount
      : originalTransaction.amount.toString();
    transactionBuilder.description = checkString(transactionBuilder.description)
      ? transactionBuilder.description
      : originalTransaction.description;
    transactionBuilder.currency = checkString(transactionBuilder.currency)
      ? transactionBuilder.currency
      : originalTransaction.currency;

    // validate the transaction
    const { tnx, err } = validateRowFn(transactionBuilder);
    if (err !== null) {
      throw new TransactionParseError(err);
    }

    // update the transaction
    originalTransaction.transaction_date = tnx.transaction_date;
    originalTransaction.transaction_date_string = tnx.transaction_date_string;
    originalTransaction.amount = tnx.amount;
    originalTransaction.description = tnx.description;
    originalTransaction.currency = tnx.currency;

    await em.persistAndFlush(originalTransaction);
    return originalTransaction;
  }

  // delete transaction
  async deleteTransaction(id: number) {
    const em = this.em.fork();
    const transaction = await em.findOne(Transaction, {
      id,
      is_deleted: false,
    });
    if (!transaction) {
      return null;
    }
    transaction.is_deleted = true;
    await em.persistAndFlush(transaction);
    return transaction;
  }

  //   // delete multiple transactions
  //   async deleteTransactions(ids: number[]) {
  //     const em = this.em;
  //     const transactions = await em.find(Transaction, { id: { $in: ids } });
  //     if (!transactions) {
  //       return null;
  //     }
  //     await em.removeAndFlush(transactions);
  //     return transactions;
  //   }
}

function cleanString(value: string | undefined | null) {
  if (!value) {
    return "";
  }
  // remove leading and trailing spaces
  value = value.trim();
  // remove multiple spaces
  value = value.replace(/\s+/g, " ");
  return value;
}

function checkString(value: string) {
  // Check if the value is not null or empty
  return value && value !== "";
}

export class TransactionParseError extends Error {
  constructor(err: CSVParseError) {
    super(err.message);
    this.name = err.type;
    this.stack = new Error().stack;
  }
}
