import { Transaction } from "~/models/transaction";
import { DBServices, initORM } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import ormConfig from "../mikro-orm.test-config";

const createTestTransaction = (
  overrides: Partial<Transaction> = {}
): Transaction => {
  const transaction = new Transaction();
  transaction.amount = 100;
  transaction.description = "Test Transaction";
  transaction.transaction_date_string = "21-09-2021";
  transaction.currency = "USD";
  transaction.inr_amount = 100;
  transaction.transaction_date = new Date();
  Object.assign(transaction, overrides);
  return transaction;
};

describe("TransactionService (with DB)", () => {
  let db: DBServices;
  let transactionService: TransactionService;

  beforeAll(async () => {
    db = await initORM(ormConfig);
    // reset the db
    await db.orm.getMigrator().up();
    transactionService = new TransactionService(db);
  });

  afterAll(async () => {
    // await db.em.nativeDelete(Transaction, {});
    await db.orm.close();
  });

  beforeEach(async () => {
    // clear the db
    await db.em.nativeDelete(Transaction, {});
  });

  it("should create and persist a transaction in the DB", async () => {
    const transaction = createTestTransaction();
    const result = await transactionService.createTransaction(transaction);

    const savedTransaction = await db.em.findOne(Transaction, {
      id: result.id,
    });
    expect(savedTransaction).toBeDefined();
    expect(savedTransaction?.amount).toBe(100);
    expect(savedTransaction?.description).toBe("Test Transaction");
  });

  it("should return all transactions from the DB", async () => {
    const transaction1 = createTestTransaction({
      description: "First Transaction",
    });
    const transaction2 = createTestTransaction({
      description: "Second Transaction",
    });

    await transactionService.createTransaction(transaction1);
    await transactionService.createTransaction(transaction2);

    const transactions = await transactionService.getAllTransactions();
    expect(transactions.length).toBe(2);
    expect(transactions[0].description).toBe("First Transaction");
    expect(transactions[1].description).toBe("Second Transaction");
  });

  it("should return transactions with pagination from the DB", async () => {
    for (let i = 1; i <= 10; i++) {
      const transaction = createTestTransaction({
        description: `Transaction ${i}`,
      });
      await transactionService.createTransaction(transaction);
    }

    const page = 1;
    const limit = 5;
    const { transactions } = await transactionService.getTransactions(
      page,
      limit
    );

    expect(transactions.length).toBe(5);
    expect(transactions[0].description).toBe("Transaction 1");
    expect(transactions[4].description).toBe("Transaction 5");
  });

  // get transaction by id  add 100 transactions and search
  it("should return from a multiple transaction by id", async () => {
    const transactions = [];
    for (let i = 1; i <= 100; i++) {
      const transaction = createTestTransaction({
        description: `Transaction ${i}`,
      });
      transactions.push(transaction);
    }

    await transactionService.createTransactions(transactions);

    // to store the id of the 10th transaction for later use
    // this is done because the id of the transaction is auto-incremented and not reset therefore we can't be sure of the id of the 10th transaction
    const id = transactions[9].id;

    const transaction = await transactionService.getTransactionById(id ?? 10);
    expect(transaction?.description).toBe("Transaction 10");
  });

  it("should create multiple transactions and return the duplicates", async () => {
    const tnxs = [];
    for (let i = 0; i < 10; i++) {
      const transaction = createTestTransaction({
        description: `Transaction ${i}`,
      });
      tnxs.push(transaction);
    }
    await transactionService.createTransactions(tnxs);

    // push some new transactions with same data
    const tnxs2 = [];
    for (let i = 0; i < 10; i++) {
      const transaction = createTestTransaction({
        description: `Transaction ${i * 3}`,
      });
      tnxs2.push(transaction);
    }

    const { duplicates } = await transactionService.createTransactions(tnxs2);
    expect(duplicates.length).toBe(4);
    const transactions = await transactionService.getAllTransactions();
    expect(transactions.length).toBe(16);
  });

  it("should return null if transaction is not found", async () => {
    const result = await transactionService.prepareUpdateTransaction(
      9999,
      new Transaction()
    );
    expect(result).toBeNull();
  });

  it("should delete a transaction and return it", async () => {
    const transaction = createTestTransaction({ description: "Transaction to be deleted" });
    const createdTransaction = await transactionService.createTransaction(transaction);

    const deletedTransaction = await transactionService.deleteTransaction(createdTransaction.id);

    expect(deletedTransaction).not.toBeNull();
    expect(deletedTransaction?.id).toBe(createdTransaction.id);

    const softDeletedTransaction = await db.em.findOne(Transaction, { id: createdTransaction.id, is_deleted: true });
    expect(softDeletedTransaction).toBeDefined();
  });

  it("should return null if transaction is not found during deletion", async () => {
    const result = await transactionService.deleteTransaction(9999);
    expect(result).toBeNull();
  });

  it("should partially update a transaction and save the changes", async () => {
    const transaction = createTestTransaction({ description: "Initial Transaction" });
    const createdTransaction = await transactionService.createTransaction(transaction);
    
    const updatedTransaction = transaction; 
    updatedTransaction.amount = 200;

    const result = await transactionService.updateTransaction(createdTransaction.id, updatedTransaction);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(200);
    expect(result?.description).toBe("Initial Transaction");
  });

  it("should not allow duplicate transactions on update", async () => {
    const transaction1 = createTestTransaction({ description: "initial transaction" });
    const transaction2 = createTestTransaction({ description: "Initial Transaction" });

    await transactionService.createTransaction(transaction1);
    const { id } = await transactionService.createTransaction(transaction2);

    const updatedTransaction = transaction2;
    updatedTransaction.description = transaction1.description;

    await expect(transactionService.updateTransaction(id, updatedTransaction)).rejects.toThrow(
      expect.objectContaining({
        name: "UniqueConstraintViolationException",
        message: expect.stringContaining("duplicate key value violates unique constraint"),
      })
    );
  });

  describe("update", () => {
    it("should not allow invalid data on update", async () => {
      const transaction = createTestTransaction({ description: "Initial Transaction" });
      const createdTransaction = await transactionService.createTransaction(transaction);

      const updatedTransaction = new Transaction();
      updatedTransaction.transaction_date_string = "invalid-date";

      await expect(transactionService.prepareUpdateTransaction(createdTransaction.id, updatedTransaction)).rejects.toThrow(
        expect.objectContaining({
          name: "InvalidLine",
          message: "Invalid date format(DD-MM-YYYY): invalid-date",
        })
      );
    });

    it("should allow some currency on update", async () => {
      const transaction = createTestTransaction({ description: "Initial Transaction" });
      const createdTransaction = await transactionService.createTransaction(transaction);

      const updatedTransaction = new Transaction();
      updatedTransaction.currency = "somting";

      const tnx = await transactionService.prepareUpdateTransaction(createdTransaction.id, updatedTransaction);
      expect(tnx).not.toBeNull();
      expect(tnx?.currency).toBe(createdTransaction.currency);
    });

    it("should not throw an error if the data is already deleted", async () => {
      const transaction = createTestTransaction({ description: "Initial Transaction" });
      const createdTransaction = await transactionService.createTransaction(transaction);

      const duplicateTransaction = createTestTransaction({ description: "Initial Transaction" });
      await expect(transactionService.createTransaction(duplicateTransaction)).rejects.toThrow(
        expect.objectContaining({
          name: "UniqueConstraintViolationException",
          message: expect.stringContaining("duplicate key value violates unique constraint"),
        })
      );

      await transactionService.deleteTransaction(createdTransaction.id);

      const res = await transactionService.createTransaction(duplicateTransaction);
      expect(res).not.toBeNull();
    });

    it("should throw an error for conversion invalid", async () => {
      const transaction = createTestTransaction({ description: "Initial Transaction" });
      const createdTransaction = await transactionService.createTransaction(transaction);

      const updatedTransaction = new Transaction();
      updatedTransaction.amount = 200;
      updatedTransaction.currency = "apki";

      await expect(transactionService.updateTransaction(createdTransaction.id, updatedTransaction)).rejects.toThrow();
    });
  });
});
