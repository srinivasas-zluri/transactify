import { ChangeEvent, useEffect, useState } from "react";
import { useFileUpload } from "./useFileUpload";
import { useTransactions } from "./useTransaction";
import { CreateTransactionData, Transaction } from "@/models/transaction";
import { Toast } from "@/models/toast";

export enum PageState {
  Loading,
  UploadingFile,
  View,
  Edit,
  Error,
}

export function useAppState({ toast }: { toast: Toast }) {
  const { progress, handleFileUpload } = useFileUpload();
  const [page, setPage] = useState<number>(1);
  const {
    transactions,
    addTransaction,
    handleDelete,
    prevNext,
    handleUpdate,
    fetchTransactions,
  } = useTransactions();
  const { prevPage: prev, nextPage: next } = prevNext;
  const [pageState, setPageState] = useState<PageState>(PageState.Loading);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  async function onCreateTransaction(data: CreateTransactionData) {
    setPageState(PageState.Loading);
    await addTransaction(data);
    await fetchTransactions(page);
    setPageState(PageState.View);
  }

  async function onDeleteClicked(id: number) {
    setPageState(PageState.Loading);
    await handleDelete(id);
    setPageState(PageState.View);
  }

  function onEditClicked(transaction: Transaction) {
    setPageState(PageState.Edit);
    setEditingTransaction({ ...transaction });
  }

  async function onEditSaveClicked(id: number) {
    if (editingTransaction == null) {
      toast.error("No transaction found");
      console.error(
        `This should not happen, please check the code, the received transaction is null for id: ${id}`
      );
      return;
    }

    await handleUpdate(editingTransaction);
    setEditingTransaction(null);
    setPageState(PageState.View);
  }

  async function onEditCancelClicked() {
    setEditingTransaction(null);
    setPageState(PageState.View);
  }

  async function uploadFileFn(file: File) {
    setPageState(PageState.UploadingFile);
    await handleFileUpload(file);
    await fetchTransactions(page);
    setPageState(PageState.View);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>, id: number) {
    const { name, value } = e.target;
    if (editingTransaction == null) {
      toast.error("No transaction found");
      console.error(
        `This should not happen, please check the code, the received transaction is null for id: ${id}`
      );
      return;
    }
    // @ts-expect-error - We know that the name is a key of Transaction
    setEditingTransaction((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    // TODO: debouncing
    // TODO: don't disable the lint use `useCallback` to memoize the function
    const loadTransactions = async () => {
      setPageState(PageState.Loading);
      await fetchTransactions(page);
      setPageState(PageState.View);
    };

    loadTransactions();

    // calling the fetchTransactions above will trigger a re-render
    // and the useEffect will be called again, so the address of the function changes
    // and the useEffect will be called again, and so on, causing an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return {
    page,
    setPage,
    transactions,
    progress,
    uploadFile: uploadFileFn,
    pageState,
    onCreateTransaction,
    onDeleteClicked,
    onEditClicked,
    onEditSaveClicked,
    onEditCancelClicked,
    editingTransaction,
    handleInputChange,
    prev,
    next,
  };
}
