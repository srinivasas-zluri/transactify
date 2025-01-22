import { useEffect, useState } from "react";
import { useFileUpload } from "./useFileUpload";
import { useTransactions } from "./useTransaction";
import { CreateTransactionData, Transaction } from "@/models/transaction";

export enum PageState {
  Loading,
  UploadingFile,
  View,
  Error,
}

export function useAppState() {
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

  async function onCreateTransaction(data: CreateTransactionData) {
    setPageState(PageState.Loading);
    await addTransaction(data);
    await fetchTransactions(page);
    setPageState(PageState.View);
  }

  async function onDeleteClicked(id: number) {
    setPageState(PageState.Loading);
    await handleDelete([id]);
    setPageState(PageState.View);
  }

  async function onEditSaveClicked(transaction: Transaction) {
    await handleUpdate(transaction);
    setPageState(PageState.View);
  }

  async function uploadFileFn(file: File) {
    setPageState(PageState.UploadingFile);
    await handleFileUpload(file);
    await fetchTransactions(page);
    setPageState(PageState.View);
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
    onEditSaveClicked,
    prev,
    next,
  };
}
