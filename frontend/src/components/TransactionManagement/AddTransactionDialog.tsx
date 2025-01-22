import { CreateTransactionData } from "@/models/transaction";
import { useState } from "react";
import { DialogFooter } from "../ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTransaction } from "../validators/validateTransaction";


interface TransactionErrors {
    date?: string;
    description?: string;
    amount?: string;
    currency?: string;
}

export function AddTransactionDialog({
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
        const errors = validateTransaction(data);
        if (errors) {
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