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

    // get paginated transactions
    it("should return paginated transactions", async () => {
        // write 100 transactions to the DB
        let filestr = `date,amount,description,currency`;
        for (let i = 0; i < 15; i++) {
            filestr += `\n08-01-2025,100,payment${i},cad`;
        }
        const file = Buffer.from(filestr);
        const response = await request(app)
            .post("/api/v1/transaction/upload")
            .attach("file", file, "test-file.csv");

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("message");

        // get the transactions
        const getResponse = await request(app).get(
            "/api/v1/transaction?page=1&limit=10"
        );
        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toHaveProperty("transactions");
        expect(getResponse.body.transactions.length).toBe(10);
        expect(getResponse.body).toHaveProperty("nextPage", {
            page: 2,
            limit: 10,
        });
        expect(getResponse.body).toHaveProperty("prevPage", {
            page: null,
            limit: 10,
        });

        // get the next page
        const nextPageResponse = await request(app).get(
            "/api/v1/transaction?page=2&limit=10"
        );
        expect(nextPageResponse.status).toBe(200);
        expect(nextPageResponse.body).toHaveProperty("transactions");
        expect(nextPageResponse.body.transactions.length).toBe(5);
        expect(nextPageResponse.body).toHaveProperty("nextPage", {
            page: null,
            limit: 10,
        });
        expect(nextPageResponse.body).toHaveProperty("prevPage", {
            page: 1,
            limit: 10,
        });

        // get the last page
        const lastPageResponse = await request(app).get(
            "/api/v1/transaction?page=3&limit=10"
        );
        expect(lastPageResponse.status).toBe(200);
        expect(lastPageResponse.body).toHaveProperty("transactions");
        expect(lastPageResponse.body.transactions.length).toBe(0);
    });

    it("Invalid Page number", async () => {
        const response = await request(app).get(
            "/api/v1/transaction?page=0&limit=10"
        );
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "Invalid page or limit");

        const response2 = await request(app).get(
            "/api/v1/transaction?page=1&limit=10000000"
        );
        expect(response2.status).toBe(400);
        expect(response2.body).toHaveProperty("message", "Page or limit too high");

        const response3 = await request(app).get(
            "/api/v1/transaction?page=0&limit=0"
        );
        expect(response3.status).toBe(400);
        expect(response3.body).toHaveProperty("message", "Invalid page or limit");

        const response4 = await request(app).get(
            "/api/v1/transaction?page=something&limit=-1"
        );
        expect(response4.status).toBe(400);
    });

    it("should return 500 if there is an error", async () => {
        // mock the getTransactions method to throw an error
        jest
            .spyOn(TransactionService.prototype, "getTransactions")
            .mockImplementation(() => {
                throw new Error("Error");
            });
        const response = await request(app).get(
            "/api/v1/transaction?page=1&limit=10"
        );
        expect(response.status).toBe(500);
    });
});