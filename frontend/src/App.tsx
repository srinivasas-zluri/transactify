import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table } from "@/components/ui/table";
import { Pagination, PaginationItem } from "@/components/ui/pagination";
import { FaEdit, FaTrashAlt, FaFileUpload, FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';

interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
}

const App = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedDescription, setExpandedDescription] = useState<number | null>(null);

  // Fetch Transactions with Pagination
  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/transactions?page=${page}`);
      setTransactions(response.data.transactions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    }
  };

  useEffect(() => {
    setTransactions([
      { id: 1, amount: 100, date: '2021-10-01', description: 'Payment for services. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) },
      { id: 2, amount: 200, date: '2021-10-02', description: 'Refund for purchase. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) },
      { id: 3, amount: 300, date: '2021-10-03', description: 'Invoice payment. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) },
      { id: 4, amount: 400, date: '2021-10-04', description: 'Subscription renewal. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) },
      { id: 5, amount: 500, date: '2021-10-05', description: 'Bonus payment. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) },
    ]);
  }, [page]);

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post('/api/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.lengthComputable || progressEvent.total === undefined) return;
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setProgress(progress);
        },
      });
      toast.success('File uploaded successfully!');
      setFile(null);
      fetchTransactions();
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      toast.success('Transaction deleted!');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await axios.put(`/api/transactions/${id}`, { amount: 100 });
      toast.success('Transaction updated!');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...';
    }
    return description;
  };

  const toggleDescription = (id: number) => {
    setExpandedDescription((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-gray-50 shadow-lg mx-auto p-8 rounded-lg max-w-7xl">
      <ToastContainer />
      <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>

      {/* File Upload Section */}
      <div className="flex md:flex-row flex-col items-start md:items-center mb-6">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className="border-2 border-yellow-400/10 mb-2 md:mb-0 p-3 rounded-lg w-full md:w-80"
        />
        <Button
          onClick={handleFileUpload}
          disabled={loading || !file}
          className="flex justify-center items-center space-x-2 border-2 border-green-400 bg-green-400/10 ml-0 md:ml-4 rounded-lg w-full md:w-auto text-green-800"
        >
          <FaFileUpload />
          <span>Upload File</span>
        </Button>
      </div>

      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="mb-4" />
      )}

      {/* Transaction Table */}
      <Table>
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Amount</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-2">{transaction.id}</td>
              <td className="px-4 py-2">{transaction.amount}</td>
              <td className="px-4 py-2">{transaction.date}</td>
              <td className="px-4 py-2">
                {expandedDescription === transaction.id
                  ? transaction.description
                  : truncateDescription(transaction.description)}
                <Button
                  onClick={() => toggleDescription(transaction.id)}
                  variant="link"
                  className="ml-2 p-0 text-blue-500"
                >
                  {expandedDescription === transaction.id ? <FaRegEyeSlash /> : <FaRegEye />}
                </Button>
              </td>
              <td className="flex space-x-3 px-4 py-2">
                <Button
                  onClick={() => handleUpdate(transaction.id)}
                  className="flex items-center border-2 border-yellow-400 bg-yellow-400/10 rounded-lg text-yellow-800"
                >
                  <FaEdit />
                </Button>
                <Button
                  onClick={() => handleDelete(transaction.id)}
                  className="flex items-center border-2 bg-red-400/10 border-red-400 rounded-lg text-red-800"
                >
                  <FaTrashAlt />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <Pagination className="mt-6">
        <PaginationItem>
          {/* Pagination controls can be added here */}
        </PaginationItem>
      </Pagination>
    </div>
  );
};

export default App;
