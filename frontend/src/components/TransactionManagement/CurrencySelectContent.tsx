import { SelectContent, SelectItem } from "@/components/ui/select";

export function SelectCurrencyContent() {
    return <SelectContent>
        <SelectItem value="USD" className="font-semibold text-gray-800">
            USD <span className="text-gray-600 italic">(US Dollars)</span>
        </SelectItem>
        <SelectItem value="INR" className="font-semibold text-gray-800">
            INR <span className="text-gray-600 italic">(Indian Rupee)</span>
        </SelectItem>
        <SelectItem value="CAD" className="font-semibold text-gray-800">
            CAD <span className="text-gray-600 italic">(Canadian Dollar)</span>
        </SelectItem>
        <SelectItem value="MYR" className="font-semibold text-gray-800">
            MYR <span className="text-gray-600 italic">(Malaysian Ringgit)</span>
        </SelectItem>

    </SelectContent>
}   