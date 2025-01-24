import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MdAnalytics } from "react-icons/md";
import { CreateTransactionData, Transaction } from "@/models/transaction";
import { Button } from "../ui/button";
import { TbPlus, TbTrashXFilled } from "react-icons/tb";
import { ViewTransactionRow } from "./ViewTransactionRow";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "../ui/dialog";
import { PageState } from "@/hooks/useAppState";
import { AddTransactionDialog } from "@/components/transactionManagement/AddTransactionDialog";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";


interface TransactionTableProps {
    transactions: Transaction[];
    pageState: PageState;
    onEditSaveClicked: (transaction: Transaction) => void;
    onDeleteClicked: (id: number) => void;
    onMultipleDeleteClicked: (ids: number[]) => void;
    onCreateTransaction: (data: CreateTransactionData) => void;
    goToDashboard: () => void;
    paginationComponent: JSX.Element;
}

export const TransactionTable = ({
    transactions,
    onEditSaveClicked,
    onDeleteClicked,
    paginationComponent,
    goToDashboard,
    onCreateTransaction,
    onMultipleDeleteClicked,
}: TransactionTableProps) => {

    const { selected, toggleCheckbox, toggleAllCheckbox } = useCheckboxes();


    return (
        <>
            <div className="flex flex-wrap justify-between items-center gap-4 p-4 w-full">
                <div className="flex flex-wrap gap-4">
                    <DeletePopupButton
                        disabled={selected.length === 0}
                        onClick={() => onMultipleDeleteClicked(selected)}
                    />
                    {/* got to analytics dashboard button */}
                    <Button onClick={goToDashboard} className="border-2 border-indigo-200 bg-transparent hover:bg-indigo-100 px-8 border-dashed text-indigo-300"><MdAnalytics className="scale-150" />Analytics</Button>
                </div>

                <div className="flex justify-end w-full sm:w-fit">
                    {paginationComponent}
                </div>
            </div>


            <Table>
                <TableHeader className="top-0 z-10 sticky mt-4 h-12">
                    <TableRow className="bg-gray-200 hover:bg-gray-200 rounded-lg text-left">
                        <TableHead className="p-4">
                            <Checkbox
                                checked={selected.length === transactions.length}
                                onCheckedChange={() => toggleAllCheckbox(transactions.map((t) => t.id))}
                            />
                        </TableHead>
                        <TableHead className="p-5"> Date </TableHead>
                        <TableHead> Description </TableHead>
                        <TableHead> Amount </TableHead>
                        <TableHead > Currency </TableHead>
                        <TableHead className="p-4 text-center"> Amount (INR) </TableHead>
                        <TableHead>Actions </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AddNewTransactionRow onCreateTransaction={onCreateTransaction} />
                    {transactions.map((transaction) =>
                    (
                        <ViewTransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            onEditSave={onEditSaveClicked}
                            onDelete={() => onDeleteClicked(transaction.id)}
                            onCheckboxChange={() => toggleCheckbox(transaction.id)}
                            selected={selected.includes(transaction.id)}
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
    )
};

function useCheckboxes() {
    const [selected, setSelected] = useState<number[]>([]);

    function toggleCheckbox(id: number) {
        if (selected.includes(id)) {
            setSelected(selected.filter((s) => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    }

    function toggleAllCheckbox(ids: number[]): void {
        if (selected.length === ids.length) {
            setSelected([]);
        } else {
            setSelected(ids);
        }
    }

    return { selected, toggleCheckbox, toggleAllCheckbox };
}

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

function DeletePopupButton({ disabled, onClick }: { disabled: boolean, onClick: () => void }) {
    return <Dialog>
        <DialogTrigger disabled={disabled}>
            <div className="relative w-full h-full">
                <Button
                    type="button"
                    variant="destructive"
                    className="border-2 disabled:bg-transparent border-red-500 border-dashed disabled:text-red-400 disabled:cursor-not-allowed"
                    disabled={disabled}
                >
                    <TbTrashXFilled className="text-red-900 scale-150" />
                    Delete selected
                </Button>
                {/* Cross overlay when disabled */}
                {(disabled) && (
                    <>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="top-0 left-0 absolute border-t border-red-400 border-dashed w-full h-0.5 transform origin-left translate-y-1/2 rotate-12"></div>
                            <div className="top-0 right-0 absolute border-t border-red-400 border-dashed w-full h-0.5 transform origin-right translate-y-1/2 -rotate-12"></div>
                        </div>
                    </>
                )}
            </div>

        </DialogTrigger>
        <DialogContent className="bg-background shadow-xl p-4 sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Delete selected transactions</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete the selected transactions?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    className="bg-red-500 text-white"
                    onClick={onClick}
                >
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}

// function AddTransactionButton({ onCreateTransaction }: { onCreateTransaction: (data: CreateTransactionData) => void }) {
//     return <Dialog>
//         <DialogTrigger className="">
//             <Button className="flex justify-center items-center border-4 border-slate-300 bg-background hover:bg-background shadow-none border-dotted w-full hover:text-black-300">
//                 <TbPlus className="text-slate-400 scale-150" />
//                 <p className="text-md text-secondary-foreground text-slate-400">
//                     Add a new transaction
//                 </p>
//             </Button>
//         </DialogTrigger>
//         <DialogContent className="bg-background shadow-xl">
//             <DialogHeader>
//                 <DialogTitle>Add a new transaction</DialogTitle>
//                 <DialogDescription>
//                     Enter the transaction you want to add
//                 </DialogDescription>
//             </DialogHeader>
//             <AddTransactionDialog onSubmit={onCreateTransaction} />
//         </DialogContent>
//     </Dialog>
// }