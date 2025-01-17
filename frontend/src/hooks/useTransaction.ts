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

  const handleUpdate = async (id: number, amount: number) => {
    try {
      await axios.put(routes.transactions.update({ id }), { amount });
      toast.success("Transaction updated!");
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id ? { ...transaction, amount } : transaction
        )
      );
    } catch (error) {
      toast.error("Failed to update transaction");
      console.error(error);
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
