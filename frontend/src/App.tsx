import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table } from "@/components/ui/table";
import { FaEdit, FaTrashAlt, FaFileUpload } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';

import { useFileUpload } from './hooks/useFileUpload';
import { useTransactions } from './hooks/useTransaction';

// create an enum with the table state 
enum TableState {
  Loading,
  View,
  Edit,
  Delete,
  Error,
}

const App = () => {
  const { file, setFile, loading, progress, handleFileUpload } = useFileUpload();
  // const [page, setPage] = useState(1);
  const page = 1;
  const { transactions, handleDelete, handleUpdate, fetchTransactions } = useTransactions();
  const [tableState, setTableState] = useState<TableState>(TableState.Loading);



  useEffect(() => {
    // TODO: debouncing
    // TODO: don't disable the lint use `useCallback` to memoize the function
    const loadTransactions = async () => {
      setTableState(TableState.Loading);
      await fetchTransactions(page);  // Use the function directly
      setTableState(TableState.View);
    };

    loadTransactions();

    // calling the fetchTransactions above will trigger a re-render
    // and the useEffect will be called again, so the address of the function changes 
    // and the useEffect will be called again, and so on, causing an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (tableState === TableState.Loading) {
    return (
      <div className="bg-gray-50 shadow-lg mx-auto p-8 rounded-lg max-w-7xl">
        <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>
        <Progress value={100} className="mb-4" />
      </div>
    );
  }

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
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Amount</th>
            <th className="">Currency</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-100 border-blue-200">
              <td className="px-4 py-2">{transaction.transaction_date_string}</td>
              <td className="px-4 py-2">
                <ExpandableDescription description={transaction.description} />
              </td>
              <td className="px-4 py-2"> {transaction.amount} </td>
              <td className=""> {transaction.currency} </td>
              <td className="flex space-x-3 px-4 py-2">
                <Button
                  onClick={() => handleUpdate(transaction.id, 100)}
                  className="flex items-center border-2 border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/30 rounded-lg text-yellow-800"
                >
                  <FaEdit />
                </Button>
                <Button
                  onClick={() => handleDelete(transaction.id)}
                  className="flex items-center border-2 bg-red-400/10 hover:bg-red-400/30 border-red-400 rounded-lg text-red-800"
                >
                  <FaTrashAlt />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      {/* <Pagination className="mt-6">
        <PaginationItem onClick={prevPage} disabled={page === 1}>Previous</PaginationItem>
        <PaginationItem onClick={nextPage} disabled={page === totalPages}>Next</PaginationItem>
      </Pagination> */}
    </div>
  );
};

// create a expandabledescription component 
function ExpandableDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  const truncateDescription = (description: string, maxLength: number = 100) => {
    return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  };

  return (
    <div>
      {expanded ? description : truncateDescription(description)}
      {/* only show the button if the text is too large */}
      {description.length > 100 && (
        <Button onClick={toggle} variant="link">
          {expanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
}

export default App;
