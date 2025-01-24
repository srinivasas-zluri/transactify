import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { upload } from "~/middlewares/fileUpload.middleware";
import { TransactionService } from "~/services/transaction.service";
import { DBServices } from "~/db";

export default function createTransactionRouter(db: DBServices) {
  const transactionRouter = Router();
  const transactionController = new TransactionController(
    new TransactionService(db)
  );

  // use of `.bind()` to ensure that the `this` context in the controller methods
  // read this article for more information: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
  transactionRouter.post(
    "/upload",
    upload.single("file"),
    transactionController.createTransactions.bind(transactionController)
  );
  transactionRouter.get(
    "/",
    transactionController.getTransactions.bind(transactionController)
  );
  transactionRouter.post(
    "/",
    upload.single("file"),
    transactionController.createTransaction.bind(transactionController)
  );
  transactionRouter.get(
    "/analytics",
    transactionController.getAnalytics.bind(transactionController)
  );
  transactionRouter.get(
    "/:id",
    transactionController.getTransactionById.bind(transactionController)
  );
  transactionRouter.put(
    "/:id",
    upload.single("file"),
    transactionController.updateTransaction.bind(transactionController)
  );
  transactionRouter.delete(
    "/",
    upload.single("file"),
    transactionController.deleteTransactions.bind(transactionController)
  );

  return transactionRouter;
}
