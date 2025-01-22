import { vi, describe, it, expect } from "vitest";
import { useAppState, PageState } from "./useAppState";
import { useFileUpload } from "./useFileUpload";
import { useTransactions } from "./useTransaction";
import { Toast } from "@/models/toast";
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

// Mocked Toast object
const mockToast: Toast = {
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
};

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
useFileUpload.mockReturnValue({
  progress: 50,
  handleFileUpload: mockHandleFileUpload,
});

useTransactions.mockReturnValue({
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
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    expect(result.current.pageState).toBe(PageState.Loading);
    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it("should transition to View state after fetching transactions", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

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
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(async () => {
      await result.current.onCreateTransaction(createTransactionData);
    });

    expect(mockAddTransaction).toHaveBeenCalledWith(createTransactionData);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle transaction deletion", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(async () => {
      await result.current.onDeleteClicked(1);
    });

    expect(mockHandleDelete).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle transaction editing", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    act(() => {
      result.current.onEditClicked(mockTransactions[0]);
    });

    expect(result.current.pageState).toBe(PageState.Edit);
    expect(result.current.editingTransaction).toEqual(mockTransactions[0]);
  });

  it("should handle editing transaction and saving changes", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    act(() => {
      result.current.onEditClicked(mockTransactions[0]);
    });

    const editedTransaction = {
      ...mockTransactions[0],
      description: "Updated Transaction",
    };
    await act(async () => {
      result.current.handleInputChange(
        { target: { name: "description", value: "Updated Transaction" } },
        mockTransactions[0].id
      );
    });

    await act(async () => {
      await result.current.onEditSaveClicked(mockTransactions[0].id);
    });

    expect(mockHandleUpdate).toHaveBeenCalledWith(editedTransaction);
    expect(result.current.pageState).toBe(PageState.View);
    expect(result.current.editingTransaction).toBeNull();
  });

  it("should handle file upload", async () => {
    const file = new File(["file content"], "example.txt", {
      type: "text/plain",
    });
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(mockHandleFileUpload).toHaveBeenCalledWith(file);
    expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    expect(result.current.pageState).toBe(PageState.View);
  });

  it("should handle cancel editing", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(() => {
      result.current.onEditClicked(mockTransactions[0]);
    });

    await act(async () => {
      await result.current.onEditCancelClicked();
    });

    expect(result.current.pageState).toBe(PageState.View);
    expect(result.current.editingTransaction).toBeNull();
  });

  it("should call toast with error message if no transaction found", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(async () => {
      await result.current.onEditSaveClicked(1);
    });

    expect(mockToast.error).toHaveBeenCalledWith("No transaction found");
  });

  it("should call toast with error message if no transaction found in update", async () => {
    const { result } = renderHook(() => useAppState({ toast: mockToast }));

    await act(async () => {
      result.current.handleInputChange(
        { target: { name: "description", value: "Updated Transaction" } },
        1
      );
    });

    expect(mockToast.error).toHaveBeenCalledWith("No transaction found");
  });
});
