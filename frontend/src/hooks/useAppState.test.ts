import { vi, describe, it, expect, Mock } from "vitest";
import { useAppState, PageState } from "./useAppState";
import { useFileUpload } from "./useFileUpload";
import { useTransactions } from "./useTransaction";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { CreateTransactionData, Transaction } from "@/models/transaction";

// Mocking the dependencies
vi.mock("./useFileUpload", () => ({
  useFileUpload: vi.fn(),
}));

vi.mock("./useTransaction", () => ({
  useTransactions: vi.fn(),
}));

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

const mockTransactions = new Array(10)
  .fill(0)
  .map((_, idx) => CreateTransactionDataFn(idx));

const mockFetchTransactions = vi.fn();
const mockAddTransaction = vi.fn();
const mockHandleDelete = vi.fn();
const mockHandleUpdate = vi.fn();
const mockHandleFileUpload = vi.fn();

// Mock hook implementations
(useFileUpload as Mock).mockReturnValue({
  progress: 50,
  handleFileUpload: mockHandleFileUpload,
});

(useTransactions as Mock).mockReturnValue({
  transactions: mockTransactions,
  addTransaction: mockAddTransaction,
  handleDelete: mockHandleDelete,
  handleUpdate: mockHandleUpdate,
  fetchTransactions: mockFetchTransactions,
  prevNext: {
    prevPage: vi.fn(),
    nextPage: vi.fn(),
  },
});

describe("useAppState Hook", () => {
  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.pageState).toBe(PageState.Loading);
    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it("should transition to View state after fetching transactions", async () => {
    const { result } = renderHook(() => useAppState());

    // Simulate loading transactions (useEffect)
    await act(async () => {
      await mockFetchTransactions(1);
    });

    expect(result.current.pageState).toBe(PageState.View);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
  });

  it("should handle transaction creation", async () => {
    const createTransactionData: CreateTransactionData = {
      date: "2021-10-10",
      description: "New Transaction",
      currency: "INR",
      amount: 300,
    };
    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await result.current.onCreateTransaction(createTransactionData);
    });

    expect(mockAddTransaction).toHaveBeenCalledWith(createTransactionData);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle transaction deletion", async () => {
    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await result.current.onDeleteClicked(1);
    });

    expect(mockHandleDelete).toHaveBeenCalledWith([1]);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle file upload", async () => {
    const file = new File(["file content"], "example.txt", {
      type: "text/plain",
    });
    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(mockHandleFileUpload).toHaveBeenCalledWith(file);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should call handle multiple delete", async () => { 
    const { result } = renderHook(() => useAppState());
    const ids = [1, 2, 3];

    await act(async () => {
      await result.current.onMultipleDeleteClicked(ids);
    });

    expect(mockHandleDelete).toHaveBeenCalledWith(ids);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle transaction update", async () => {
    const transaction: Transaction = CreateTransactionDataFn(1);
    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await result.current.onEditSaveClicked(transaction);
    });

    expect(mockHandleUpdate).toHaveBeenCalledWith(transaction);
    expect(result.current.pageState).toBe(PageState.View);
  });
});
