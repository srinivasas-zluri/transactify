import { useEffect, useState } from 'react';
import { TbFileSpreadsheet, TbTrashXFilled } from "react-icons/tb";
import { TbCloudUpload } from "react-icons/tb";
import { TbEdit } from "react-icons/tb";
import { toast, ToastContainer } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';

import { useFileUpload } from './hooks/useFileUpload';
import { useTransactions } from './hooks/useTransaction';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

enum TableState {
  Loading,
  UploadingFile,
  View,
  Edit,
  Error,
}

const App = () => {
  const { progress, handleFileUpload } = useFileUpload();
  const [page, setPage] = useState<number>(9);
  const { transactions, handleDelete, prevNext, handleUpdate, fetchTransactions } = useTransactions();
  const { prevPage: prev, nextPage: next } = prevNext;
  const [pageState, setPageState] = useState<TableState>(TableState.Loading);



  useEffect(() => {
    // TODO: debouncing
    // TODO: don't disable the lint use `useCallback` to memoize the function
    const loadTransactions = async () => {
      setPageState(TableState.Loading);
      await fetchTransactions(page);  // Use the function directly
      setPageState(TableState.View);
    };

    loadTransactions();

    // calling the fetchTransactions above will trigger a re-render
    // and the useEffect will be called again, so the address of the function changes 
    // and the useEffect will be called again, and so on, causing an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (pageState === TableState.UploadingFile) {
    // return progress bar 
    return <Progress value={progress} className="w-[60%]" />
  }

  if (pageState === TableState.Loading) {
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
    <div className="mx-auto p-8 rounded-lg max-w-7xl">
      <ToastContainer />
      <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>
      <UploadFile onUpload={async (file: File) => {
        setPageState(TableState.UploadingFile);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await handleFileUpload(file);
        await fetchTransactions(page);
        setPageState(TableState.View);
      }} />

      {/* File Upload Section */}
      <div className="flex md:flex-row flex-col items-start md:items-center mb-6">
        {/* <input
          type="file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className="border-2 border-yellow-400/10 mb-2 md:mb-0 p-3 rounded-lg w-full md:w-80"
        /> */}

      </div>

      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="mb-4" />
      )}

      {/* Transaction Table */}
      <Table>
        <TableHeader className='top-0 z-10 sticky mt-4'>
          <TableRow className='bg-gray-200 hover:bg-gray-200 rounded-lg text-left'>
            <TableHead className='p-5'> Date </TableHead>
            <TableHead> Description </TableHead>
            <TableHead> Amount </TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
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
                    className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-3 border-none h-full text-slate-300 hover:text-yellow-500"
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
        </TableBody>
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

function UploadFile({ onUpload }: { onUpload: (file: File) => Promise<void> }) {

  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files ? e.target.files[0] : null;
    setFile(uploadedFile);
    console.log({ file, uploadedFile });
    if (uploadedFile == null || uploadedFile === undefined) {
      toast.error('No file selected');
      return;
    }

    try {
      await onUpload(uploadedFile);
      console.log("Got here")
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.error('File upload failed');
      setFile(null);
    }
  }

  return <div className='w-full'>
    <div className="mb-4">
      <div className="relative flex justify-center items-center w-ful">
        <label className="relative flex flex-col justify-center items-center border-2 border-slate-400 hover:border-gray-400 bg-slate-100/10 hover:bg-slate-100 border-dashed rounded-lg w-full max-w-2xl transition-all cursor-pointer">
          {
            (file == null) && <><TbCloudUpload className='p-5 text-slate-800 size-28' />
              <span className="mt-2 px-5 pb-2 text-slate-600">
                Click to upload a CSV file with transactions
              </span>
              <input
                type="file"
                accept='.csv'
                onChange={async (e) => { await handleUpload(e); }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </>
          }
          {(file != null) && <>
            <TbFileSpreadsheet className='p-5 text-slate-800 size-28' />
            <span className="mt-2 px-5 pb-2 text-slate-600">
              {file.name}
            </span>
          </>}

        </label>
      </div>
    </div>
  </div>
}

export default App;
