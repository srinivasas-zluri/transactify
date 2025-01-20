import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreateTransactionData, Transaction } from "@/models/transaction";
import { EditableTransactionRow } from "./EditableTransactionRow";
import { Button } from "../ui/button";
import { TbPlus } from "react-icons/tb";
import { ViewTransactionRow } from "./ViewTransactionRow";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "../ui/dialog";
import { PageState } from "@/hooks/useAppState";
import { AddTransactionDialog } from "../TransactionManagement/AddTransactionDialog";

interface TransactionTableProps {
    transactions: Transaction[];
    pageState: PageState;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
    editingTransaction: Transaction | null;
    onEditCancelClicked: () => void;
    onEditClicked: (transaction: Transaction) => void;
    onEditSaveClicked: (id: number) => void;
    onDeleteClicked: (id: number) => void;
    onCreateTransaction: (data: CreateTransactionData) => void;
}

export const TransactionTable = ({
    transactions,
    pageState,
    handleInputChange,
    editingTransaction,
    onEditCancelClicked,
    onEditClicked,
    onEditSaveClicked,
    onDeleteClicked,
    onCreateTransaction,
}: TransactionTableProps) => (
    <>
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
                <AddNewTransactionRow onCreateTransaction={onCreateTransaction} />
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
                    <AddNewTransactionRow onCreateTransaction={onCreateTransaction} />
                </TableFooter>
            )}
        </Table>
    </>
);

function AddNewTransactionRow({ onCreateTransaction }: { onCreateTransaction: (data: CreateTransactionData) => void }) {
    return <TableRow>
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
}