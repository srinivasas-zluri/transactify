import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { routes } from "@/const";

import { Transaction } from "@/models/transaction";

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

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(routes.transactions.delete({ id }));
      toast.success("Transaction deleted!");
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id)
      );
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error(error);
    }
  };

  const handleUpdate = async (transaction: Transaction) => {
    const id = transaction.id;
    const prevTransaction = transactions.find((t) => t.id === id);
    if (prevTransaction === undefined) {
      console.error(
        "Transaction not found this shouldn't happen check your code"
      );
      toast.error("Transaction not found");
      return;
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...transaction } : t))
    );
    console.log(transaction);
    try {
      await axios.put(routes.transactions.update({ id }), { ...transaction });
      toast.success("Transaction updated!");
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...transaction } : t))
      );
    } catch (error) {
      toast.error("Failed to update transaction");
      console.error(error);
      const index = transactions.findIndex((t) => t.id === id);
      setTransactions((prev) => {
        prev[index] = prevTransaction as Transaction;
        return [...prev];
      });
    }
  };

  return {
    transactions,
    fetchTransactions,
    prevNext,
    handleDelete,
    handleUpdate,
  };
};
