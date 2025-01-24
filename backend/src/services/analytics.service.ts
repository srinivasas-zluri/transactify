import { EntityManager } from "@mikro-orm/postgresql";
import { Transaction } from "~/models/transaction";

export class TransactionAnalyticsService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  // Main function to fetch analytics
  async getAnalytics(params: {
    start_date?: string;
    end_date?: string;
    group_by_currency?: boolean;
    granularity?: "day" | "month" | "year";
  }) {
    const {
      start_date,
      end_date,
      group_by_currency = false,
      granularity = "month",
    } = params;

    // Validate granularity
    if (!["day", "month", "year"].includes(granularity)) {
      throw new BadRequestError(
        'Invalid granularity. It should be "day", "month", or "year".'
      );
    }

    // Fetch the min and max dates from the database if not provided
    const minMaxDate = await this.em.execute(
      "SELECT MIN(t.transaction_date) AS min_date, MAX(t.transaction_date) AS max_date FROM transaction t"
    );
    const { min_date, max_date } = minMaxDate[0];

    const minDate: Date = new Date(min_date) || new Date();
    const maxDate: Date = new Date(max_date) || new Date();

    // Default start_date and end_date
    const startDate: Date = start_date ? new Date(start_date) : minDate;
    const endDate: Date = end_date ? new Date(end_date) : maxDate;

    const asPSQLDate = (date: Date) => date.toISOString().split("T")[0];

    // Ensure date range validity for 'day' granularity
    if (
      granularity === "day" &&
      Math.abs(endDate.getTime() - startDate.getTime()) >
        60 * 24 * 60 * 60 * 1000
    ) {
      throw new BadRequestError(
        'For "day" granularity, the date range cannot exceed 60 days.'
      );
    }

    console.log({ startDate, endDate });

    // SELECT
    //   DATE_TRUNC('month', t.transaction_date) AS month,
    //   SUM(t.amount) AS total_amount,
    //   SUM(t.inr_amount) AS total_inr_amount,
    //   NULL AS currency
    // FROM transaction t
    // WHERE t.transaction_date BETWEEN '2017-01-01' AND '2020-07-20'
    // GROUP BY DATE_TRUNC('month', t.transaction_date);

    const res = this.em.execute(`
        SELECT 
            DATE_TRUNC('${granularity}', t.transaction_date) AS month,
            SUM(t.amount) AS total_amount,
            SUM(t.inr_amount) AS total_inr_amount,
            ${group_by_currency ? "t.currency" : "NULL AS currency"}
        FROM transaction t
        WHERE t.transaction_date BETWEEN '${asPSQLDate(
          startDate
        )}' AND '${asPSQLDate(endDate)}'
        GROUP BY DATE_TRUNC('${granularity}', t.transaction_date) ${
      group_by_currency ? ", t.currency" : ""
    }`);

    // const res = this.em.execute(`
    //     SELECT
    //         DATE_TRUNC('${granularity}' t.transaction_date) AS month,
    //         SUM(t.amount) AS total_amount,
    //         SUM(t.inr_amount) AS total_inr_amount,
    //         ${group_by_currency ? "t.currency" : "NULL AS currency"}
    //     FROM transaction t
    //     WHERE t.transaction_date BETWEEN ${asPSQLDate(
    //       startDate
    //     )} AND ${asPSQLDate(endDate)}
    //     GROUP BY DATE_TRUNC('${granularity}', t.transaction_date), ${
    //   group_by_currency ? "t.currency" : "NULL"
    // }
    //     `);
    return res;
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
