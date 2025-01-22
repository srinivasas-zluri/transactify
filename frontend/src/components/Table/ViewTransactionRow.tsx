import { Transaction } from "@/models/transaction";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ExpandableDescription } from "../expandableDescription";
import { TbEdit, TbTrashXFilled } from "react-icons/tb";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { SubmitHandler, useForm } from 'react-hook-form'
import { Input } from "@/components/ui/input";
import { validateTransaction } from "../validators/validateTransaction";
import { DialogClose, DialogTitle } from "@radix-ui/react-dialog";

export function ViewTransactionRow({
    transaction,
    onEditSave,
    onDelete,
}: {
    transaction: Transaction;
    onEditSave: (transaction: Transaction) => void;
    onDelete: () => void;
}) {
    return (
        <TableRow key={transaction.id}>
            {/* add a checkbox */}
            <TableCell className="px-4 py-2">
                <input type="checkbox" onChange={() => { }} />
            </TableCell>
            <TableCell className="px-4 py-2 min-w-28">
                {" "}
                {transaction.transaction_date_string}{" "}
            </TableCell>
            <TableCell className="px-4 py-2 w-full">
                <ExpandableDescription description={transaction.description} />
            </TableCell>
            <TableCell className="text-right px-4 py-2"> {transaction.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: "currency",
                currency: transaction.currency || "USD",
            })}
            </TableCell>
            <TableCell className="px-4 py-2"> {transaction.currency} </TableCell>
            <TableCell className="text-right px-4 py-2 w-full"> Rs.{transaction.inr_amount} </TableCell>
            <TableCell className="px-4 py-2">
                <div className="flex shrink">
                    <Dialog>

                        <DialogTrigger className="w-full">
                            <div
                                className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-3 border-none h-full text-slate-300 hover:text-yellow-500"
                            >
                                <TbEdit className="scale-150" />
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle> <p className="mb-4 text-2xl"> Edit Transaction </p> </DialogTitle>
                            <EditTransactionDialog transaction={transaction} onEditSave={onEditSave} />
                        </DialogContent>
                    </Dialog>

                    <DeleteButtonWithPopupDialog onDelete={onDelete} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function DeleteButtonWithPopupDialog({ onDelete }: { onDelete: () => void }) {
    return (
        <Dialog>
            <DialogTrigger>
                <Button className="flex items-center border-2 bg-transparent hover:bg-transparent shadow-none px-4 py-4 border-none rounded-lg text-slate-300 hover:text-red-500">
                    <TbTrashXFilled className="scale-150" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Are you sure you want to delete this transaction?</DialogTitle>
                <DialogFooter className="gap-4 mt-4">
                    <Button type="button" variant="secondary" onClick={onDelete}>Yes</Button>
                    <DialogClose>
                        <Button type="button" variant="default">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface EditTransactionDialogProps {
    transaction: Transaction;
    onEditSave: (transaction: Transaction) => void;
}

const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({ transaction, onEditSave }) => {
    const { register, handleSubmit, formState: { errors }, setError } = useForm<Transaction>({
        defaultValues: transaction,
    });

    const onSubmit: SubmitHandler<Transaction> = (data) => {
        const transformData = { ...data, date: data.transaction_date_string };
        console.log({ transformData })
        const errors = validateTransaction(transformData);
        console.error({ errors })
        if (errors !== null) {
            Object.entries(errors).forEach(([key, value]) => {
                setError(key as keyof Transaction, { type: 'manual', message: value });
            });
            return;
        }
        onEditSave(data);
    };

    return (
        <form className="" onSubmit={handleSubmit(onSubmit)}>
            <div className="items-center gap-x-4 gap-y-2 grid grid-cols-4 p-2">
                <label htmlFor="date" className="text-right">
                    Date
                </label>
                <Input
                    id="date"
                    type="text"
                    placeholder="dd-mm-yyyy"
                    {...register('transaction_date_string', { required: 'Date is required' })}
                    className="col-span-3"
                />
                {errors.transaction_date_string && (
                    <span className="col-span-4 col-start-2 text-red-500">
                        {errors.transaction_date_string.message}
                    </span>
                )}
            </div>

            <div className="items-center gap-x-4 gap-y-2 grid grid-cols-4 p-2">
                <label htmlFor="description" className="text-right">
                    Description
                </label>
                <Input
                    id="description"
                    type="text"
                    {...register('description', { required: 'Description is required' })}
                    className="col-span-3"
                />
                {errors.description && (
                    <span className="col-span-4 col-start-2 text-red-500">
                        {errors.description.message}
                    </span>
                )}
            </div>


            <div className="items-center gap-x-4 gap-y-2 grid grid-cols-4 p-2">
                <label htmlFor="amount" className="text-right">
                    Amount
                </label>
                <Input
                    id="amount"
                    type="number"
                    {...register('amount', { required: 'Amount is required' })}
                    className="col-span-3"
                />
                {errors.amount && (
                    <span className="col-span-4 col-start-2 text-red-500">
                        {errors.amount.message}
                    </span>
                )}
            </div>

            <div className="items-center gap-x-4 gap-y-2 grid grid-cols-4 p-2">
                <label htmlFor="currency" className="text-right">
                    Currency
                </label>
                <Input
                    id="currency"
                    type="text"
                    {...register('currency', { required: 'Currency is required' })}
                    className="col-span-3"
                />
                {errors.currency && (
                    <span className="col-span-4 col-start-2 p-0 text-red-500">
                        {errors.currency.message}
                    </span>
                )}
            </div>

            <DialogFooter>
                <DialogClose>
                    <Button type="button" variant="default" className="mt-4">
                        Save
                    </Button>
                </DialogClose>
            </DialogFooter>

        </form>
    );

};