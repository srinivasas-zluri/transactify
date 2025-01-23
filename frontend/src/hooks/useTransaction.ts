import { useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { routes } from "@/const";

import { CreateTransactionData, Transaction } from "@/models/transaction";

interface PageProps {
  page: number | null;
  limit: number;
}

interface PrevNextProps {
  prevPage: PageProps;
  nextPage: PageProps;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevNext, setPrevNext] = useState<PrevNextProps>({
    prevPage: { page: null, limit: 0 },
    nextPage: { page: null, limit: 0 },
  });

  const fetchTransactions = async (page: number) => {
    try {
      const response = await axios.get(routes.transactions.fetch({ page }));
      setTransactions(response.data.transactions);
      const { prevPage, nextPage } = response.data;
      setPrevNext({ prevPage, nextPage });
    } catch (error) {
      toast.error("Failed to fetch transactions try refreshing the page");
      console.error(error);
    }
  };

  const addTransaction = async (transaction: CreateTransactionData) => {
    try {
      const response = await axios.post(
        routes.transactions.create,
        transaction
      );
      setTransactions((prev) => [...prev, response.data]);
      toast.success("Transaction created!");
    } catch (error) {
      // check for axios error and 400, 409
      if (!(error instanceof AxiosError)) {
        toast.error("Failed to create transaction");
        console.error(error);
        return;
      }
      const { status, response } = error;
      if (status === 400) {
        toast.error("Invalid data "+ response?.data?.message);
      } else if (status === 409) {
        toast.error("Transaction already exists");
      } else {
        toast.error("Failed to create transaction");
        console.error(error);
      }
    }
  };

  const handleDelete = async (ids: number[]) => {
    try {
      await axios.delete(routes.transactions.delete, { data: { ids } });
      toast.success("Transaction deleted!");
      setTransactions((prev) =>
        prev.filter((transaction) => !ids.includes(transaction.id))
      );
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error(error);
    }
  };

  const handleUpdate = async (transaction: Transaction) => {
    const id = transaction.id;
    const prevTransaction = transactions.find((t) => t.id === id);
    console.log({ id, prevTransaction, transaction });
    if (prevTransaction === undefined) {
      console.error(
        "Transaction not found this shouldn't happen check your code"
      );
      toast.error("Transaction not found");
      return;
    }

    try {
      await axios.put(routes.transactions.update({ id }), { ...transaction });
      toast.success("Transaction updated!");
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...transaction } : t))
      );
    } catch (error) {
      const index = transactions.findIndex((t) => t.id === id);
      setTransactions((prev) => {
        prev[index] = prevTransaction as Transaction;
        return [...prev];
      });
      if (!(error instanceof AxiosError)) {
        toast.error("Failed to update transaction");
        console.error(error);
        return;
      }

      const { status } = error;
      if (status === 409) {
        toast.error("Transaction already exists with the same data");
      } else {
        toast.error("Failed to update transaction");
        console.error(error);
      }
    }
  };

  return {
    transactions,
    fetchTransactions,
    addTransaction,
    prevNext,
    handleDelete,
    handleUpdate,
  };
};
