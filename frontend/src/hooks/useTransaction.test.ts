import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { routes } from "@/const";
import { vi, describe, it, expect, Mock } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTransactions } from "./useTransaction";
import { CreateTransactionData, Transaction } from "@/models/transaction";

// Mock the axios instance
vi.mock("axios");
vi.mock("react-toastify");

const CreateTransactionDataFn = (idx: number): Transaction => {
  let randDesc: string;
  if (idx == 10) {
    randDesc = Math.random().toString(120);
  } else {
    randDesc = "";
  }
  return {
    id: idx,
    amount: 100,
    description: `Test Transaction ${idx}${randDesc}`,
    transaction_date_string: "2021-10-10",
    transaction_date: new Date("2021-10-10"),
    inr_amount: 100,
    currency: "INR",
    is_deleted: false,
  };
};

const createAxiosError = (status: number): AxiosError => {
  const err = new AxiosError("Error", "ERR_BAD_REQUEST", undefined, undefined, {
    status: status,
    data: {
      status,
    },
  } as AxiosResponse);

  err.status = status;
  return err;
};

describe("useTransactions", () => {
  const mockTransactions = Array.from({ length: 10 }, (_, i) =>
    CreateTransactionDataFn(i)
  );

  const mockTransaction = CreateTransactionDataFn(1);
  const updatedTransaction = { ...mockTransaction, description: "Updated" };

  const createMockTransaction: CreateTransactionData = {
    date: "2021-10-10",
    amount: 100,
    description: "Test Transaction",
    currency: "INR",
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch transactions and set state correctly", async () => {
    // Arrange
    (axios.get as Mock).mockResolvedValue({
      data: {
        transactions: mockTransactions,
        prevPage: { page: 1, limit: 10 },
        nextPage: { page: 3, limit: 10 },
      },
    });

    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.fetchTransactions(1);
    });

    // Assert
    expect(axios.get).toHaveBeenCalledWith(
      routes.transactions.fetch({ page: 1 })
    );
    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.prevNext).toEqual({
      prevPage: { page: 1, limit: 10 },
      nextPage: { page: 3, limit: 10 },
    });
  });

  it("should show error toast when fetchTransactions fails", async () => {
    // Arrange
    (axios.get as Mock).mockRejectedValue(new Error("Error"));

    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.fetchTransactions(1);
    });

    // Assert
    expect(axios.get).toHaveBeenCalledWith(
      routes.transactions.fetch({ page: 1 })
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to fetch transactions try refreshing the page"
    );
  });

  it("should handle addTransaction error and show error toast", async () => {
    const error = createAxiosError(500);
    (axios.post as Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.addTransaction(createMockTransaction);
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      routes.transactions.create,
      createMockTransaction
    );
    expect(toast.error).toHaveBeenCalledWith("Failed to create transaction");
  });

  it("should handle addTransaction error and show invalid data toast", async () => {
    const error = createAxiosError(400);
    (axios.post as Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.addTransaction(createMockTransaction);
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      routes.transactions.create,
      createMockTransaction
    );
    expect(toast.error).toHaveBeenCalledWith("Invalid data undefined");
  });

  it("should handle addTransaction error and show transaction already exists toast", async () => {
    const error = createAxiosError(409);
    (axios.post as Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.addTransaction(createMockTransaction);
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      routes.transactions.create,
      createMockTransaction
    );
    expect(toast.error).toHaveBeenCalledWith("Transaction already exists");
  });

  it("should handle addTransaction correctly and show success toast", async () => {
    // Arrange
    (axios.post as Mock).mockResolvedValue({ data: mockTransactions });

    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.addTransaction(createMockTransaction);
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      routes.transactions.create,
      createMockTransaction
    );
    expect(toast.success).toHaveBeenCalledWith("Transaction created!");
  });

  it("should handle addTransaction error and show error toast", async () => {
    // Arrange
    (axios.post as Mock).mockRejectedValue(new Error("Error"));

    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.addTransaction(createMockTransaction);
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      routes.transactions.create,
      createMockTransaction
    );
    expect(toast.error).toHaveBeenCalledWith("Failed to create transaction");
  });

  it("should handle delete transaction and update state correctly", async () => {
    // Arrange
    (axios.delete as Mock).mockResolvedValue({});
    const { result } = renderHook(() => useTransactions());

    // Act
    await act(async () => {
      await result.current.handleDelete([1]);
    });

    // Assert
    // expect(axios.delete).toHaveBeenCalledWith(routes.transactions.delete);
    expect(axios.delete).toHaveBeenCalledWith(routes.transactions.delete, {
      data: { ids: [1] },
    });
    expect(toast.success).toHaveBeenCalledWith("Transaction deleted!");
  });

  it("should handle delete transaction error and show error toast", async () => {
    // Arrange
    (axios.delete as Mock).mockRejectedValue(new Error("Error"));
    const { result } = renderHook(() => useTransactions());
    result.current.transactions = mockTransactions;

    // Act
    await act(async () => {
      await result.current.handleDelete([1]);
    });

    // Assert
    // expect(axios.delete).toHaveBeenCalledWith(routes.transactions.delete);
    expect(axios.delete).toHaveBeenCalledWith(routes.transactions.delete, {
      data: { ids: [1] },
    });
    expect(toast.error).toHaveBeenCalledWith("Failed to delete transaction");
  });

  it("should successfully update the transaction and show success toast", async () => {
    // Render the hook
    const { result } = await setupAndUpdateTransaction();

    // Mock the axios.put response to return the updated transaction
    (axios.put as Mock).mockResolvedValue({ data: updatedTransaction });

    // Act: Call handleUpdate with the updated transaction
    await act(async () => {
      await result.current.handleUpdate(updatedTransaction);
    });

    // Assert: Ensure axios.put is called with the correct arguments
    expect(axios.put).toHaveBeenCalledWith(
      routes.transactions.update({ id: updatedTransaction.id }),
      updatedTransaction
    );

    // Assert: Verify that the success toast is called
    expect(toast.success).toHaveBeenCalledWith("Transaction updated!");
  });

  it("should show error toast when transaction is not found", async () => {
    const { result } = await setupAndUpdateTransaction();
    (axios.put as Mock).mockRejectedValue(createAxiosError(404));

    // Act
    await act(async () => {
      await result.current.handleUpdate(updatedTransaction);
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith("Failed to update transaction");
  });

  it("should handle 409 error and show specific error toast", async () => {
    const { result } = await setupAndUpdateTransaction();
    (axios.put as Mock).mockRejectedValue(createAxiosError(409));

    // Act
    await act(async () => {
      await result.current.handleUpdate(updatedTransaction);
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "Transaction already exists with the same data"
    );
  });

  async function setupAndUpdateTransaction() {
    const { result } = renderHook(() => useTransactions());

    // Mock the axios.get response to fetch transactions
    (axios.get as Mock).mockResolvedValue({
      data: {
        transactions: mockTransactions,
        prevPage: { page: 1, limit: 10 },
        nextPage: { page: 3, limit: 10 },
      },
    });

    // Fetch transactions
    await act(async () => {
      await result.current.fetchTransactions(1);
    });

    return { result };
  }

  it("should handle update transaction error and show error toast", async () => {
    const { result } = await setupAndUpdateTransaction();
    (axios.put as Mock).mockRejectedValue(new Error("Error"));

    // Act
    await act(async () => {
      await result.current.handleUpdate(updatedTransaction);
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith("Failed to update transaction");
  });

  it("should throw an error if the transaction isn't found", async () => {
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await result.current.handleUpdate(updatedTransaction);
    });
    expect(toast.error).toHaveBeenCalledWith("Transaction not found");
  });
});
