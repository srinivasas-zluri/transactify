import { Transaction } from "@/models/transaction";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ExpandableDescription } from "../expandableDescription";
import { TbEdit, TbTrashXFilled } from "react-icons/tb";

export function ViewTransactionRow({
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
            <TableCell className="text-right px-4 py-2"> {transaction.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: "currency",
                currency: transaction.currency || "USD",
            })}
            </TableCell>
            <TableCell className="text-right px-4 py-2 w-full"> Rs.{transaction.inr_amount} </TableCell>
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