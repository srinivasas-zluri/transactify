import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import { Transaction } from "~/models/transaction";

describe("check the update request", () => {
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
    db.orm.close();

    // Close the server
    server.close();

    // reset mocks
    jest.resetAllMocks();
  });

  beforeEach(async () => {
    // reset mocks
    jest.resetAllMocks();

    // refersh the db
    const db: DBServices = await app.get("db");
    await db.em.nativeDelete(Transaction, {});
  });

  // check a valid update
  it("should update a transaction", async () => {
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

    const updateResponse = await request(app)
      .put(`/api/v1/transaction/${transactionId}`)
      .send({ amount: 200 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("id", transactionId);
    expect(updateResponse.body).toHaveProperty("amount", 200);
  });

  it("should return 404 if transaction is not found", async () => {
    const updateResponse = await request(app)
      .put(`/api/v1/transaction/1`)
      .send({ amount: 200 });
    expect(updateResponse.status).toBe(404);
  });

  it("should return 409 if there is a UniqueConstraintViolationException", async () => { 
    // don't mock just send the data 
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");
    
    expect(response.status).toBe(201);

    const transactions = await request(app).get("/api/v1/transaction?page=1&limit=10");
    const transaction1 = transactions.body.transactions[0];
    const transaction2 = transactions.body.transactions[1];

    console.log({tnxs: transactions.body.transactions})

    // send the update request again 
    const updateResponse = await request(app)
      .put(`/api/v1/transaction/${transaction2.id}`)
      .send({ 
        transaction_date_string: transaction1.transaction_date_string,
        description: transaction1.description,
       });

    expect(updateResponse.status).toBe(409);
  });

  it("should return 400 if the transaction data is invalid", async () => {
    const updateResponse = await request(app)
      .put(`/api/v1/transaction/invalid`)
      .send({ transaction_date_string: "invalid-date" });
    expect(updateResponse.status).toBe(400);
  });

  // return 400 on invalid update currency 
  it("should return 400 if the currency is invalid", async () => {
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

    const updateResponse = await request(app)
      .put(`/api/v1/transaction/${transactionId}`)
      .send({ currency: "invalid" });
    expect(updateResponse.status).toBe(400);
  });

  it("should return 500 if there is an error", async () => {
    // mock the updateTransaction method to throw an error
    jest
      .spyOn(TransactionService.prototype, "prepareUpdateTransaction")
      .mockImplementation(() => {
        throw new Error("Error");
      });
    const response = await request(app)
      .put(`/api/v1/transaction/1`)
      .send({ amount: 200 });
    expect(response.status).toBe(500);
  });
});
