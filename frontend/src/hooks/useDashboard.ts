import { DateRange } from "@/components/ui/daterangepicker";
import { routes } from "@/const";
import { Toast } from "@/models/toast";
import axios from "axios";
import { useEffect, useState } from "react";

export interface AnalyticsData {
  month: string;
  total_amount: string;
  total_inr_amount: string;
  currency: string | null;
}

export type Granularity = "day" | "month" | "year";

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

export function useAnalyticsDashboard({ toast }: { toast: Toast }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [groupByCurrency] = useState(false);

  async function updateAnalyticsData() {
    try {
      const response = await axios.get(routes.transactions.analytics, {
        params: {
          start_date: dateRange?.from,
          end_date: dateRange?.to,
          granularity: granularity,
          group_by_currency: groupByCurrency ? "true" : "false",
        },
      });
      response.data.sort(
        (a: AnalyticsData, b: AnalyticsData) =>
          new Date(a.month).getTime() - new Date(b.month).getTime()
      );
      const tempAnalyticsData = response.data;
      setAnalyticsData(tempAnalyticsData);
      setChartData(processChartData(tempAnalyticsData));
    } catch {
      console.error("Failed to fetch analytics data");
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("calling from here");
    updateAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDateRangeValid = () => {
    // const { from: startDate, to: endDate } = dateRange;
    const { from, to } = dateRange ?? {};
    const startDate = from ? from.toISOString().split("T")[0] : null;
    const endDate = to ? to.toISOString().split("T")[0] : null;
    if (granularity === "day" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end.getMonth() - start.getMonth() > 2) {
        toast.error("Date range must be within 2 months for daily granularity");
        return false;
      }
    }
    return true;
  };

  const updateDaterange = (range: DateRange) => {
    const startDate = range?.from ? new Date(range.from).toUTCString() : null;
    const endDate = range?.to ? new Date(range.to).toUTCString() : null;
    if (startDate && endDate && !isDateRangeValid()) return;
    setDateRange({
      from: new Date(startDate ?? ""),
      to: endDate ? new Date(endDate ?? "") : undefined,
    });
  };

  const processChartData = (analyticsData: AnalyticsData[] | null) => {
    if (!analyticsData) return null;

    const labels = analyticsData.map((item) => item.month);
    if (granularity === "month") {
      labels.forEach((label, index) => {
        const date = new Date(label);
        labels[index] = date.toLocaleString("default", { month: "long" });
      });
    } else if (granularity === "day") {
      labels.forEach((label, index) => {
        const date = new Date(label);
        labels[index] = date.toLocaleString("default", {
          month: "short",
          day: "numeric",
        });
      });
    } else if (granularity === "year") {
      labels.forEach((label, index) => {
        const date = new Date(label);
        labels[index] = date.toLocaleString("default", { year: "numeric" });
      });
    }

    const totalINRAmount = analyticsData.map((item) =>
      parseFloat(item.total_inr_amount)
    );

    return {
      labels,
      datasets: [
        {
          label: "INR Amount",
          data: totalINRAmount,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          fill: true,
        },
      ],
    };
  };

  return {
    analyticsData,
    loading,
    granularity,
    dateRange,
    chartData,
    groupByCurrency,
    setGranularity,
    setDateRange,
    updateAnalyticsData,
    updateDaterange,
  };
}
