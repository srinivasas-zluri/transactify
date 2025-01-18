export interface Transaction {
  id: number;
  transaction_date: Date;
  transaction_date_string: string;
  amount: number;
  description: string;
  currency: string;
  is_deleted: false;
}

export interface CreateTransactionData {
  date: string;
  description: string;
  amount: number;
  currency: string;
}
