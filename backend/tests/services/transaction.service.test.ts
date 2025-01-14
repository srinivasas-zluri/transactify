import { Transaction } from "~/models/transaction";
import { DBServices, initORM } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import ormConfig from "../mikro-orm.test-config";

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
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Test Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string = "21-09-2021";
    transaction.currency = "USD";

    const result = await transactionService.createTransaction(transaction);
    expect(result).toEqual(transaction);

    const savedTransaction = await db.em.findOne(Transaction, {
      id: result.id,
    });
    expect(savedTransaction).toBeDefined();
    expect(savedTransaction?.amount).toBe(100);
    expect(savedTransaction?.description).toBe("Test Transaction");
  });

  it("should return all transactions from the DB", async () => {
    const transaction1 = new Transaction();
    transaction1.amount = 50;
    transaction1.description = "First Transaction";
    transaction1.transaction_date = new Date();
    transaction1.transaction_date_string =
      transaction1.transaction_date.toISOString();

    transaction1.currency = "USD";

    const transaction2 = new Transaction();
    transaction2.amount = 75;
    transaction2.description = "Second Transaction";
    transaction2.transaction_date = new Date();
    transaction2.transaction_date_string =
      transaction2.transaction_date.toISOString();
    transaction2.currency = "USD";

    await transactionService.createTransaction(transaction1);
    await transactionService.createTransaction(transaction2);

    const transactions = await transactionService.getAllTransactions();
    expect(transactions.length).toBe(2);
    expect(transactions[0].description).toBe("First Transaction");
    expect(transactions[1].description).toBe("Second Transaction");
  });

  it("should return transactions with pagination from the DB", async () => {
    for (let i = 1; i <= 10; i++) {
      const transaction = new Transaction();
      transaction.amount = 100 + i;
      transaction.description = `Transaction ${i}`;
      transaction.transaction_date = new Date();
      transaction.transaction_date.setDate(
        transaction.transaction_date.getDate() - i
      );
      transaction.transaction_date_string =
        transaction.transaction_date.toISOString();
      transaction.currency = "USD";

      await transactionService.createTransaction(transaction);
    }

    const page = 1;
    const limit = 5;
    const { transactions } = await transactionService.getTransactions(
      page,
      limit
    );

    expect(transactions.length).toBe(5);
    expect(transactions[0].description).toBe("Transaction 10");
    expect(transactions[4].description).toBe("Transaction 6");
  });

  // get transaction by id  add 100 transactions and search
  it("should return a transaction by id", async () => {
    const transactions = [];
    for (let i = 1; i <= 100; i++) {
      const transaction = new Transaction();
      transaction.amount = 100 + i;
      transaction.description = `Transaction ${i}`;
      transaction.transaction_date = new Date();
      transaction.transaction_date.setDate(
        transaction.transaction_date.getDate() - i
      );
      transaction.transaction_date_string =
        transaction.transaction_date.toISOString();
      transaction.currency = "USD";

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
      const transaction = new Transaction();
      transaction.amount = 100;
      transaction.description = "Initial Transaction" + i;
      transaction.transaction_date = new Date();
      transaction.transaction_date_string = "13-09-2021";
      transaction.currency = "USD";
      tnxs.push(transaction);
    }
    await transactionService.createTransactions(tnxs);

    // push some new transactions with same data
    const tnxs2 = [];
    for (let i = 0; i < 10; i++) {
      const transaction = new Transaction();
      transaction.amount = 100;
      transaction.description = "Initial Transaction" + i * 3;
      transaction.transaction_date = new Date();
      transaction.transaction_date_string = "13-09-2021";
      transaction.currency = "USD";
      tnxs2.push(transaction);
    }

    const { duplicates } = await transactionService.createTransactions(tnxs2);
    expect(duplicates.length).toBe(4);
    const transactions = await transactionService.getAllTransactions();
    expect(transactions.length).toBe(16);
  });

  it("should update a transaction and save the changes", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.currency = "USD";
    transaction.transaction_date_string =
      transaction.transaction_date.toISOString();

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );
    const updatedTransaction = new Transaction();
    updatedTransaction.amount = 200;
    updatedTransaction.description = "Updated Transaction";
    updatedTransaction.transaction_date = new Date();
    updatedTransaction.transaction_date_string = "21-09-2021";

    const result = await transactionService.updateTransaction(
      createdTransaction.id,
      updatedTransaction
    );

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(200);
    expect(result?.description).toBe("updated transaction");
  });

  it("should return null if transaction is not found", async () => {
    const result = await transactionService.updateTransaction(
      9999,
      new Transaction()
    );
    expect(result).toBeNull();
  });

  it("should delete a transaction and return it", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Transaction to be deleted";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string =
      transaction.transaction_date.toISOString();
    transaction.currency = "USD";

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );
    const result = await transactionService.deleteTransaction(
      createdTransaction.id
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe(createdTransaction.id);

    const deletedTransaction = await db.em.findOne(Transaction, {
      id: createdTransaction.id,
      is_deleted: true,
    });
    expect(deletedTransaction).toBeDefined();
  });

  it("should return null if transaction is not found", async () => {
    const result = await transactionService.deleteTransaction(9999);
    expect(result).toBeNull();
  });

  it("should update a transaction and save the changes", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.currency = "USD";
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string =
      transaction.transaction_date.toISOString();

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );
    const updatedTransaction = new Transaction();
    updatedTransaction.amount = 200;
    updatedTransaction.description = "Updated Transaction";
    updatedTransaction.transaction_date = new Date();
    updatedTransaction.transaction_date_string = "21-09-2021";

    const result = await transactionService.updateTransaction(
      createdTransaction.id,
      updatedTransaction
    );

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(200);
    expect(result?.description).toBe("updated transaction");
  });

  // partial update
  it("should partially update a transaction and save the changes", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string = "13-09-2021";
    transaction.currency = "USD";

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );
    const updatedTransaction = transaction;
    updatedTransaction.amount = 200;

    const result = await transactionService.updateTransaction(
      createdTransaction.id,
      updatedTransaction
    );

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(200);
    expect(result?.description).toBe("initial transaction");
  });

  // check the unique constraint
  it("should not allow duplicate transactions on update", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string = "13-09-2021";
    transaction.currency = "USD";

    const transaction2 = new Transaction();
    transaction2.amount = 100;
    transaction2.description = "Initial Transaction";
    transaction2.transaction_date = new Date();
    transaction2.transaction_date_string = "14-09-2021";
    transaction2.currency = "USD";

    await transactionService.createTransaction(transaction);
    await transactionService.createTransaction(transaction2);

    const updatedTransaction = transaction2;
    updatedTransaction.description = transaction.description;
    updatedTransaction.transaction_date_string =
      transaction.transaction_date_string;

    expect(
      transactionService.updateTransaction(transaction.id, updatedTransaction)
    ).rejects.toThrow(
      expect.objectContaining({
        name: "UniqueConstraintViolationException",
        message: expect.stringContaining(
          "duplicate key value violates unique constraint"
        ),
      })
    );
  });

  // check the invalid data update
  it("should not allow invalid data on update", async () => {
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string = "13-09-2021";
    transaction.currency = "USD";

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );
    const updatedTransaction = new Transaction();
    updatedTransaction.transaction_date_string = "invalid-date";

    await expect(
      transactionService.updateTransaction(
        createdTransaction.id,
        updatedTransaction
      )
    ).rejects.toThrow(
      expect.objectContaining({
        name: "InvalidLine",
        message: "Invalid date format(DD-MM-YYYY): invalid-date",
      })
    );
  });

  // invalid amount format + empty desc + empty date
  it("should not allow invalid data on update", async () => { 
    const transaction = new Transaction();
    transaction.amount = 100;
    transaction.description = "Initial Transaction";
    transaction.transaction_date = new Date();
    transaction.transaction_date_string = "13-09-2021";
    transaction.currency = "USD";

    const createdTransaction = await transactionService.createTransaction(
      transaction
    );

    const updatedTransaction = new Transaction();
    updatedTransaction.transaction_date_string = "";
    updatedTransaction.amount = 100;
    updatedTransaction.description = "";

    await expect(
      transactionService.updateTransaction(
        createdTransaction.id,
        updatedTransaction
      )
    ).rejects.toThrow(
      expect.objectContaining({
        name: "InvalidLine",
        message: "Description cannot be empty",
      })
    );
  });

  // empty amount
  // invalid num regex
});
