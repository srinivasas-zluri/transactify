import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import { Transaction } from "~/models/transaction";

describe("get paginated requests", () => {
  let server: http.Server;
  beforeAll(async () => {
    await startApp(testDBConfig);
    server = app.listen(0);

    // reset the db
    const db: DBServices = await app.get("db");
    await db.orm.getMigrator().up();
    await db.em.nativeDelete(Transaction, {});
  });

  afterAll(async () => {
    const db: DBServices = await app.get("db");
    await db.em.nativeDelete(Transaction, {});
    db.orm.close();

    // Close the server
    server.close();

    // reset mocks
    jest.resetAllMocks();
  });

  beforeEach(async () => {
    // reset mocks
    jest.resetAllMocks();
  });

  it("should return a transaction by id", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "All transactions created successfully"
    );

    const transactions = await request(app).get("/api/v1/transaction?page=1&limit=10");
    const transactionId = transactions.body.transactions[0].id;

    const getResponse = await request(app).get(
      `/api/v1/transaction/${transactionId}`
    );
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("id", transactionId);
  });

  it("should return 404 if transaction is not found", async () => {
    const getResponse = await request(app).get(`/api/v1/transaction/1`);
    expect(getResponse.status).toBe(404);
  });

  it("should return 500 if there is an error", async () => {
    // mock the getTransactionById method to throw an error
    jest
      .spyOn(TransactionService.prototype, "getTransactionById")
      .mockImplementation(() => {
        throw new Error("Error");
      });
    const response = await request(app).get(`/api/v1/transaction/1`);
    expect(response.status).toBe(500);
  });
});
