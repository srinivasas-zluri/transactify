import { useEffect, useState } from 'react';
import { TbTrashXFilled } from "react-icons/tb";
import { TbEdit } from "react-icons/tb";
import { ToastContainer } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaFileUpload } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';

import { useFileUpload } from './hooks/useFileUpload';
import { useTransactions } from './hooks/useTransaction';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// create an enum with the table state 
enum TableState {
  Loading,
  View,
  Edit,
  Error,
}

const App = () => {
  const { file, setFile, loading, progress, handleFileUpload } = useFileUpload();
  const [page, setPage] = useState<number>(0);
  const { transactions, handleDelete, prevNext, handleUpdate, fetchTransactions } = useTransactions();
  const { prevPage: prev, nextPage: next } = prevNext;
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
    // TODO: Change the loadign state later
    return (
      <div className="bg-gray-50 shadow-lg mx-auto p-8 rounded-lg max-w-7xl">
        <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>
        <div className="flex justify-center items-center">
          <div className="border-gray-900 border-b-2 rounded-full w-32 h-32 animate-spin"></div>
        </div>
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
        <TableHeader>
          <TableRow className='bg-gray-200 text-left'>
            <TableHead> Date </TableHead>
            <TableHead> Description </TableHead>
            <TableHead> Amount </TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {transactions.map((transaction) => (
            <TableRow>
              <TableCell className='px-4 py-2'> {transaction.transaction_date_string} </TableCell>
              <TableCell className='px-4 py-2'>
                <ExpandableDescription description={transaction.description} />
              </TableCell>
              <TableCell className='px-4 py-2'> {transaction.amount} </TableCell>
              <TableCell className='px-4 py-2'> {transaction.currency} </TableCell>
              <TableCell className='px-4 py-2'>
                <div className='flex h-full'>
                  <Button
                    onClick={() => handleUpdate(transaction.id, 100)}
                    className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-4 border-none h-full text-slate-300 hover:text-yellow-500"
                  >
                    <TbEdit className='scale-150' />
                  </Button>
                  <Button
                    onClick={() => handleDelete(transaction.id)}
                    className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-4 border-none rounded-lg text-slate-300 hover:text-red-500"
                  >
                    <TbTrashXFilled className='scale-150' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <Pagination className="mt-6">
        <PaginationContent>
          {(prev.page != null) && <PaginationPrevious onClick={() => setPage((prev) => prev - 1)} />}
          {(prev.page != null) && <PaginationItem onClick={() => setPage((prev) => prev - 1)}> <PaginationLink>{prev.page} </PaginationLink>  </PaginationItem>}
          <PaginationItem className='bg-gray-200 rounded-sm'> <PaginationLink>{page} </PaginationLink>  </PaginationItem>
          {(next.page != null) && <PaginationItem onClick={() => setPage((prev) => prev + 1)}> <PaginationLink> {next.page} </PaginationLink>  </PaginationItem>}
          {(next.page != null) && <PaginationNext onClick={() => setPage((prev) => prev + 1)} />}
        </PaginationContent>
      </Pagination>
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
        <Button onClick={toggle} variant="link" className="text-blue-500">
          {expanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
}

export default App;
