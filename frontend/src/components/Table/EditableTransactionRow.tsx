import { Transaction } from "@/models/transaction";
import { ChangeEvent } from "react";
import { TableCell, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { TbCancel, TbCheck } from "react-icons/tb";

export function EditableTransactionRow({
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