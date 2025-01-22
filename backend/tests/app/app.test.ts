import http from "http";
import request from "supertest";
import app, { startApp } from "~/app";
import testDBConfig from "../mikro-orm.test-config";
import { DBServices } from "~/db";
import { Transaction } from "~/models/transaction";
import { FileCSVWriter } from "~/internal/csv/writer";

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

    // reset the db
    const db: DBServices = await app.get("db");
    await db.em.nativeDelete(Transaction, {});
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


  it("should return a file with invalid curreies", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,mywish
      09-01-2024,200,purchase,invalid-currency
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");

    expect(response.status).toBe(200);
  });

  // write duplicates
  it("should upload a file and create transactions with duplicates", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");

    expect(response.status).toBe(201);

    const file2 = Buffer.from(`date,amount,description,currency
      07-01-2024,100,paymeNt,cad
      08-01-2024,100,paymeNt,cad
      09-01-2024,200,puRchase,usd
      09-01-2024,200,puRchasE,usd
      `);

    const response2 = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file2, "test-file.csv");

    expect(response2.status).toBe(200);
    // read the file sent back
  });

  // mock the write rows fn to return an error
  it("should return 500 if there is an error writing to the file", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");

    expect(response.status).toBe(201);

    const file2 = Buffer.from(`date,amount,description,currency
      07-01-2024,100,paymeNt,cad
      08-01-2024,100,paymeNt,cad
      09-01-2024,200,puRchase,usd
      09-01-2024,200,puRchasE,usd
      `);

    jest
      .spyOn(FileCSVWriter.prototype, "writeRows")
      .mockImplementation(async (x) => {
        throw new Error("Error writing to CSV file");
      });

    const response2 = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file2, "test-file.csv");

    expect(response2.status).toBe(500);
    expect(response2.body.message).toBe("Failed to create transactions");
  });

  it("should return 400 if no file is uploaded", async () => {
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("No file uploaded");
  });

  it("should return 400 if file type is not csv", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.txt");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid file type");
  });

  it("should return 500 if there is an error writing to the file invalid double write", async () => {
    const file = Buffer.from(`date,amount,description,currency
      08-01-2024,100,payment,cad
      09-01-2024,200,purchase,usd
      `);
    const response = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file, "test-file.csv");

    expect(response.status).toBe(201);

    const file2 = Buffer.from(`date,amount,description,currency
      07-01-2024,100,paymeNt,cad
      08-01-2024,100,paymeNt,cad
      09-01-2024,200,puRchase,usd
      09-01-2024,200,puRchasE,usd
      `);

    let callCount = 0;
    jest
      .spyOn(FileCSVWriter.prototype, "writeRows")
      .mockImplementation(async (x) => {
        if (callCount == 0) {
          callCount++;
          return null;
        }
        return { type: "WriteError", message: "Error writing to CSV file" };
      });

    const response2 = await request(app)
      .post("/api/v1/transaction/upload")
      .attach("file", file2, "test-file.csv");

    expect(response2.status).toBe(500);
    expect(response2.body.message).toBe(
      "Server failed to generate an error file"
    );
  });
});