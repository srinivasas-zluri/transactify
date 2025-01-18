import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import { Transaction } from "~/models/transaction";

describe("testing single create route", () => {
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

  it("should create a transaction", async () => {
    const data = {
      date: "08-01-2024",
      amount: 100,
      description: "payment",
      currency: "cad",
    };
    const response = await request(app).post("/api/v1/transaction/").send(data);
    expect(response.status).toBe(201);
  });

  it("should return 400 if transaction data is missing required fields", async () => {
    const invalidData = {
      amount: 100,
      description: "payment",
      currency: "CAD",
    };

    const response = await request(app)
      .post("/api/v1/transaction/")
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid transaction data");
  });

  // send no data
  it("should return 400 if no data is sent", async () => {
    const response = await request(app).post("/api/v1/transaction/").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid transaction data");
  });

  it("should return 400 if the amount is not a valid number", async () => {
    const invalidData = {
      date: "08-01-2024",
      amount: "not-a-number",
      description: "payment",
      currency: "CAD",
    };

    const response = await request(app)
      .post("/api/v1/transaction/")
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid amount format: not-a-number");
  });

  it("should return 500 if there is a generic server error", async () => {
    // Mock the service to throw a generic error
    jest
      .spyOn(TransactionService.prototype, "createTransaction")
      .mockRejectedValue(new Error("Unexpected error"));

    const validData = {
      date: "08-01-2024",
      amount: 100,
      description: "payment",
      currency: "CAD",
    };

    const response = await request(app)
      .post("/api/v1/transaction/")
      .send(validData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to create transaction");
  });
});
