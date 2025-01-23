import { TransactionController } from "~/controllers/transaction.controller";
import {
  TransactionParseError,
  TransactionService,
} from "~/services/transaction.service";
import { Request, Response } from "express";
import { DBServices } from "~/db"; // Import DBServices for mocking

import { convertCurrency } from "~/services/conversion.service";
import { CSVParseError } from "~/internal/csv/types";

// Mock the necessary dependencies
jest.mock("~/internal/csv/writer");
jest.mock("~/services/transaction.service");
jest.mock("~/models/transaction");
jest.mock("~/db"); // Mock DBServices

jest.mock("~/services/conversion.service", () => ({
  convertCurrency: jest.fn(),
}));

describe("TransactionController", () => {
  let transactionController: TransactionController;
  let transactionService: TransactionService;
  let dbServices: jest.Mocked<DBServices>; // Mocked DBServices
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Mock DBServices
    dbServices = {
      em: {
        fork: jest.fn().mockReturnValue({
          persistAndFlush: jest.fn(),
          find: jest.fn(),
          count: jest.fn(),
          findOne: jest.fn(),
        }),
      },
    } as unknown as jest.Mocked<DBServices>;

    // Now pass the mocked dbServices to the TransactionService constructor
    transactionService = new TransactionService(dbServices);
    transactionController = new TransactionController(transactionService);

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendFile: jest.fn().mockReturnThis(),
    };
  });

  // 400 on get with no page and limit
  it("should return 400 when no page and limit are provided", async () => {
    req.query = {};

    await transactionController.getTransactions(
      req as Request,
      res as Response
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid page or limit",
    });
  });

  it("should return 400 when invalid transaction data is provided", async () => {
    req.body = {
      date: "01-01-2025",
      amount: "100",
      description: "Test",
      currency: "USD",
    };

    (convertCurrency as jest.Mock).mockReturnValueOnce({
      amount: 0,
      err: "Conversion error",
    });

    await transactionController.createTransaction(
      req as Request,
      res as Response
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Conversion error",
    });
  });

  it("should return 400 for TransactionParseError", async () => {
    // Setup the mock to throw TransactionParseError
    const error = new TransactionParseError({
      message: "Invalid transaction",
      type: "InvalidLine",
    } as CSVParseError);
    transactionService.prepareUpdateTransaction = jest
      .fn()
      .mockRejectedValue(error);

    req = {
      params: { id: "1" },
      body: {}, // Invalid body that causes the error
    };

    await transactionController.updateTransaction(
      req as Request,
      res as Response
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: error.message });
  });

  it("should return 500 for unexpected errors", async () => {
    // Setup the mock to throw a generic error
    const error = new Error("Unexpected error");
    transactionService.prepareUpdateTransaction = jest
      .fn()
      .mockRejectedValue(error);

    req = {
      params: { id: "1" },
      body: {
        /* valid transaction data */
      },
    };

    await transactionController.updateTransaction(
      req as Request,
      res as Response
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to update transaction",
    });
  });
});
