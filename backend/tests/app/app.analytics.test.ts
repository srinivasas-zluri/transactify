import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { Transaction } from "~/models/transaction";
import { TransactionService } from "~/services/transaction.service";

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

describe("GET /api/v1/transaction/analytics", () => {
  let server: http.Server;

  beforeAll(async () => {
    await startApp(testDBConfig); // Starts the app and sets up the database
    server = app.listen(0);

    // Reset DB and apply migrations before tests
    const db: DBServices = await app.get("db");
    await db.orm.getMigrator().up();
    await db.em.nativeDelete(Transaction, {});
  });

  afterAll(async () => {
    const db: DBServices = await app.get("db");
    await db.em.nativeDelete(Transaction, {});
    db.orm.close();
    server.close();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const db: DBServices = await app.get("db");
    await db.em.nativeDelete(Transaction, {});

    // create some transactions use for loop
    for (let i = 1; i < 10; i++) {
      const dateString = `2024-01-${i}`;
      const date = new Date(dateString);
      const transaction = createTestTransaction({
        description: `Transaction ${i}`,
        transaction_date_string: `2024-01-${i}`,
        transaction_date: date,
      });
      await db.em.persistAndFlush(transaction);
    }
  });

  it("should return analytics for a valid date range and granularity", async () => {
    const start_date = "2024-01-01";
    const end_date = "2024-01-31";
    const group_by_currency = "false";
    const granularity = "month";

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        currency: null,
        month: "2024-01-01 00:00:00+00",
        total_amount: "800",
        total_inr_amount: "800",
      },
    ]);
  });

  it("should return an error for invalid granularity", async () => {
    const start_date = "2024-01-01";
    const end_date = "2024-01-31";
    const group_by_currency = "false";
    const granularity = "hour"; // Invalid granularity

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Invalid granularity. It should be "day", "month", or "year".'
    );
  });

  it("should return an error when the date range exceeds 60 days for 'day' granularity", async () => {
    const start_date = "2024-01-01";
    const end_date = "2024-03-02"; // Exceeds 60 days
    const group_by_currency = "false";
    const granularity = "day";

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'For "day" granularity, the date range cannot exceed 60 days.'
    );
  });

  it("should return the correct min and max date when no dates are provided", async () => {
    const response = await request(app).get("/api/v1/transaction/analytics");

    expect(response.status).toBe(200);

    const resp = response.body;
    expect(resp[0]).toHaveProperty("total_inr_amount");
  });

  // Additional test cases for edge cases and other scenarios
  it("should return an empty array if there are no transactions in the given date range", async () => {
    const start_date = "2025-01-01";
    const end_date = "2025-01-31";
    const group_by_currency = "false";
    const granularity = "month";

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should return analytics with correct granularity for 'year'", async () => {
    const start_date = "2024-01-01";
    const end_date = "2024-12-31";
    const group_by_currency = "false";
    const granularity = "year";

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        currency: null,
        month: "2024-01-01 00:00:00+00",
        total_amount: "800",
        total_inr_amount: "800",
      },
    ]);
  });

  it("should return correct totals when there are multiple currencies", async () => {
    // Creating transactions in multiple currencies
    const db: DBServices = await app.get("db");
    const transaction1 = createTestTransaction({
      currency: "USD",
      description: "USD Transaction",
      transaction_date_string: "2024-01-01",
      transaction_date: new Date("2024-01-01"),
    });
    const transaction2 = createTestTransaction({
      currency: "EUR",
      description: "EUR Transaction",
      amount: 200,
      inr_amount: 200,
      transaction_date_string: "2024-01-01",
      transaction_date: new Date("2024-01-01"),
    });
    await db.em.persistAndFlush([transaction1, transaction2]);

    const start_date = "2024-01-01";
    const end_date = "2024-01-31";
    const group_by_currency = "true";
    const granularity = "month";

    const all_tnxs = await db.em.find(Transaction, {});
    console.log({ all_tnxs });

    const response = await request(app).get(
      `/api/v1/transaction/analytics?start_date=${start_date}&end_date=${end_date}&group_by_currency=${group_by_currency}&granularity=${granularity}`
    );

    expect(response.status).toBe(200);
    console.log({ data: response.body });
    expect(response.body).toEqual([
      {
        month: "2024-01-01 00:00:00+00",
        total_amount: "200",
        total_inr_amount: "200",
        currency: "EUR",
      },
      {
        month: "2024-01-01 00:00:00+00",
        total_amount: "900",
        total_inr_amount: "900",
        currency: "USD",
      },
    ]);
  });
});
