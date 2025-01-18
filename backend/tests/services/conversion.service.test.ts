import { convertCurrency } from "~/services/conversion.service";

describe("check if conversion is working", () => {
    it("should convert 1 USD", () => {
        const res = convertCurrency({
            from: "usd",
            amount: 1,
            year: "2021",
            month: "01",
            day: "01"
        })
        expect(res).toBeCloseTo(72.63);
     });
})