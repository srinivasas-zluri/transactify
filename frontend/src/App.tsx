import { ChangeEvent, useState } from "react";
import { TbCancel, TbCheck, TbPlus, TbTrashXFilled } from "react-icons/tb";
import { TbEdit } from "react-icons/tb";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreateTransactionData, Transaction } from "./models/transaction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { UploadFile } from "./components/uploadFile";
import { ExpandableDescription } from "./components/expandableDescription";
import { PageState, useAppState } from "./hooks/useAppState";
import { UploadingFile } from "./pages/uploadingFile";

const App = () => {
  return (
    <>
      <ToastContainer />
      <ApplicationPage />
    </>
  );
};

const ApplicationPage = () => {
  const {
    pageState,
    progress,
    transactions,
    handleInputChange,
    editingTransaction,
    setPage,
    page,
    prev,
    next,
    uploadFile,
    onCreateTransaction,
    onEditCancelClicked,
    onEditClicked,
    onEditSaveClicked,
    onDeleteClicked,
  } = useAppState({ toast });

  if (pageState === PageState.UploadingFile) {
    // return progress bar
    return <UploadingFile progress={progress} />
  }

  if (pageState === PageState.Loading) {
    // TODO: Change the loadign state later
    return (
      <div className="flex justify-center items-center p-4 min-h-screen">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-lg w-full sm:w-96 max-w-md">
          <div className="border-gray-900 mb-4 border-b-2 rounded-full w-32 h-32 animate-spin"></div>
          <div className="font-semibold text-gray-700 text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  const PaginationComponent = (
    <Pagination className="mt-6">
      <PaginationContent>
        {prev.page != null && (
          <PaginationPrevious onClick={() => setPage((prev) => prev - 1)} />
        )}
        {prev.page != null && (
          <PaginationItem onClick={() => setPage((prev) => prev - 1)}>
            {" "}
            <PaginationLink>{prev.page} </PaginationLink>{" "}
          </PaginationItem>
        )}
        <PaginationItem className="bg-gray-200 rounded-sm">
          {" "}
          <PaginationLink>{page} </PaginationLink>{" "}
        </PaginationItem>
        {next.page != null && (
          <PaginationItem onClick={() => setPage((prev) => prev + 1)}>
            {" "}
            <PaginationLink> {next.page} </PaginationLink>{" "}
          </PaginationItem>
        )}
        {next.page != null && (
          <PaginationNext onClick={() => setPage((prev) => prev + 1)} />
        )}
      </PaginationContent>
    </Pagination>
  );

  return (
    <div className="mx-auto p-8 rounded-lg max-w-7xl">
      <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">
        Transaction Management
      </h1>
      <UploadFile onUpload={uploadFile} toast={toast} />

      {/* Transaction Table */}
      {PaginationComponent}
      <span className="p-10" />
      <Table>
        <TableHeader className="top-0 z-10 sticky mt-4 h-12">
          <TableRow className="bg-gray-200 hover:bg-gray-200 rounded-lg text-left">
            <TableHead className="p-5"> Date </TableHead>
            <TableHead> Description </TableHead>
            <TableHead > Amount </TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="p-4 text-center"> Amount (INR) </TableHead>
            <TableHead>Actions </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              className="top-[3.6rem] z-10 sticky border-2 bg-background w-full h-12"
              colSpan={10}
            >
              <Dialog>
                <DialogTrigger className="w-full">
                  <Button className="flex justify-center items-center border-4 border-slate-300 bg-background hover:bg-background shadow-none border-dotted w-full h-full hover:text-black-300">
                    <TbPlus className="text-slate-400 scale-150" />
                    <p className="text-md text-secondary-foreground text-slate-400">
                      Add a new transaction
                    </p>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background shadow-xl p-4 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a new transaction</DialogTitle>
                    <DialogDescription>
                      Enter the transaction you want to add
                    </DialogDescription>
                  </DialogHeader>
                  <AddTransactionDialog onSubmit={onCreateTransaction} />
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
          {transactions.map((transaction) =>
            pageState === PageState.Edit &&
              transaction.id === editingTransaction?.id ? (
              <EditableTransactionRow
                key={transaction.id}
                transaction={editingTransaction}
                onInputChange={handleInputChange}
                onSave={onEditSaveClicked}
                onCancel={onEditCancelClicked}
              />
            ) : (
              <ViewTransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={() => onEditClicked(transaction)}
                onDelete={() => onDeleteClicked(transaction.id)}
              />
            )
          )}
        </TableBody>
        {transactions.length > 20 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={10}>
                <Button className="flex justify-center items-center border-4 border-slate-300 bg-transparent hover:bg-transparent shadow-none border-dotted w-full h-full hover:text-black-300">
                  <TbPlus className="text-slate-400 scale-150" />
                  <p className="text-md text-secondary-foreground text-slate-400">
                    Add a new transaction
                  </p>
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>

      {/* Pagination */}
      {PaginationComponent}
    </div>
  );
};

interface TransactionErrors {
  date?: string;
  description?: string;
  amount?: string;
  currency?: string;
}

function AddTransactionDialog({
  onSubmit,
}: {
  onSubmit: (data: CreateTransactionData) => void;
}) {
  const data: CreateTransactionData = {
    date: "",
    description: "",
    amount: 0,
    currency: "",
  };

  const [errors, setErrors] = useState<TransactionErrors>({});

  function submitDataFn(data: CreateTransactionData) {
    console.log({ data });
    const errors: { [key: string]: string } = {};
    if (!data.date.match(/\d{2}-\d{2}-\d{4}/)) {
      errors.date = "Invalid date format";
    }

    if (data.description.length > 254) {
      errors.description = "Description is too long";
    }

    if (data.description.length < 5) {
      errors.description = "Description is too short";
    }

    if (data.currency === "") {
      errors.currency = "Currency is required";
    }

    if (data.amount == 0) {
      errors.amount = "Amount is required, and can't be 0";
    }

    // check if there are errors
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    onSubmit(data);
  }

  return (
    <>
      <div className="gap-4 grid py-4">
        <div className="items-center gap-4 grid grid-cols-4">
          <label htmlFor="date" className="text-right">
            Date
          </label>
          <Input
            id="date"
            name="date"
            className="col-span-3"
            placeholder="dd-mm-yyyy"
            onChange={(e) => {
              data.date = e.target.value;
            }}
          />
          {errors.date && (
            <span className="col-span-4 col-start-2 text-red-500">
              {errors.date}
            </span>
          )}
        </div>
        <div className="items-center gap-4 grid grid-cols-4">
          <label htmlFor="description" className="text-right">
            Description
          </label>
          <Input
            id="description"
            name="description"
            className="col-span-3"
            placeholder="Add a description"
            onChange={(e) => {
              data.description = e.target.value;
            }}
          />
          {errors.description && (
            <span className="col-span-4 col-start-2 text-red-500">
              {errors.description}
            </span>
          )}
        </div>
        <div className="items-center gap-4 grid grid-cols-4">
          <label htmlFor="amount" className="text-right">
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            className="col-span-3"
            placeholder="300.00"
            onChange={(e) => {
              data.amount = parseFloat(e.target.value);
            }}
          />
          {errors.amount && (
            <span className="col-span-4 col-start-2 text-red-500">
              {errors.amount}
            </span>
          )}
        </div>
        <div className="items-center gap-4 grid grid-cols-4">
          <label htmlFor="currency" className="text-right">
            Currency
          </label>
          <Input
            id="currency"
            name="currency"
            className="col-span-3"
            placeholder="USD"
            onChange={(e) => {
              data.currency = e.target.value;
            }}
          />
          {errors.currency && (
            <span className="col-span-4 col-start-2 text-red-500">
              {errors.currency}
            </span>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button onClick={() => submitDataFn(data)}>Save changes</Button>
      </DialogFooter>
    </>
  );
}

function EditableTransactionRow({
  transaction,
  onInputChange,
  onSave,
  onCancel,
}: {
  transaction: Transaction;
  onInputChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
}) {
  return (
    <TableRow key={transaction.id}>
      <TableCell>
        <Input
          type="text"
          name="transaction_date_string"
          value={transaction?.transaction_date_string}
          className="block border-2 bg-transparent px-4 py-2 min-w-28"
          onChange={(e) => onInputChange(e, transaction.id)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          name="description"
          value={transaction?.description}
          className="bg-transparent px-4 py-2 min-w-32"
          onChange={(e) => onInputChange(e, transaction.id)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          name="amount"
          value={transaction?.amount}
          className="bg-transparent px-4 py-2 min-w-32"
          onChange={(e) => onInputChange(e, transaction.id)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          name="currency"
          value={transaction?.currency}
          className="bg-transparent px-4 py-2 min-w-32"
          onChange={(e) => onInputChange(e, transaction.id)}
        />
      </TableCell>
      <TableCell className="px-4 py-2"> {transaction.inr_amount} </TableCell>
      <TableCell>
        <div className="flex">
          <Button
            onClick={() => {
              onSave(transaction.id);
            }}
            className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-3 border-none h-full text-slate-300 hover:text-green-500"
          >
            <TbCheck className="scale-150" />
          </Button>
          <Button
            onClick={onCancel}
            className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-3 border-none h-full text-slate-300 hover:text-red-500"
          >
            {/* <TbTrashXFilled className='scale-150' /> */}
            <TbCancel className="scale-150" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ViewTransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow key={transaction.id} onDoubleClick={onEdit}>
      <TableCell className="px-4 py-2 min-w-28">
        {" "}
        {transaction.transaction_date_string}{" "}
      </TableCell>
      <TableCell className="px-4 py-2 w-full">
        <ExpandableDescription description={transaction.description} />
      </TableCell>
      <TableCell className="text-right px-4 py-2"> {transaction.amount} </TableCell>
      <TableCell className="px-4 py-2"> {transaction.currency} </TableCell>
      <TableCell className="px-4 py-2 w-full"> Rs.{transaction.inr_amount} </TableCell>
      <TableCell className="px-4 py-2">
        <div className="flex shrink">
          <Button
            onClick={onEdit}
            className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-3 border-none h-full text-slate-300 hover:text-yellow-500"
          >
            <TbEdit className="scale-150" />
          </Button>

          <Button
            onClick={onDelete}
            className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-4 border-none rounded-lg text-slate-300 hover:text-red-500"
          >
            <TbTrashXFilled className="scale-150" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// create a expandabledescription component
export default App;
