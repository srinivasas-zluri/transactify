import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { TransactionService } from "~/services/transaction.service";
import { Transaction } from "~/models/transaction";

describe("API Routes testing", () => {
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

  it("should upload a file and create transactions", async () => {
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
    // You can also add more checks to ensure the transactions have been saved in the DB
  });
 
});