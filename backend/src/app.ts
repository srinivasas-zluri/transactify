import express from "express";
import createTransactionRouter from "./routes/transaction.routes";
import { initORM } from "./db";
import { Options } from "@mikro-orm/postgresql";

const app = express();
app.use(express.json());

export async function startApp(dbConfig: Options) {
  const db = await initORM(dbConfig);
  const transactionRouter = createTransactionRouter(db);
  app.set("db", db);
  app.use("/api/v1/transaction", transactionRouter);
}

export default app;
