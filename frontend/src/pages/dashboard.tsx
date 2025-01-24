import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend  } from "chart.js";
import { Card, CardHeader, CardContent } from "@/components/ui/card";  // Assuming you're using ShadCN UI components
import { DatePickerWithRange, DateRange } from "@/components/ui/daterangepicker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { TbSettings } from "react-icons/tb";
import { toast } from "react-toastify";
import { TransactionManagementLoadingPage } from "@/components/TransactionManagement/LoadingPage";
import { ArrowLeftIcon } from "lucide-react";
import { routes } from "@/const";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface AnalyticsData {
    month: string;
    total_amount: string;
    total_inr_amount: string;
    currency: string | null;
}

type Granularity = 'day' | 'month' | 'year';

export const Dashboard = ({ back }: { back: () => void }) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [granularity, setGranularity] = useState<Granularity>('month');
    const [dateRange, setDateRange] = useState<DateRange>(undefined);
    const [groupByCurrency, ] = useState(false);

    async function updateAnalyticsData() {
        try {
            const response = await axios.get(routes.transactions.analytics, {
                params: {
                    start_date: dateRange?.from,
                    end_date: dateRange?.to,
                    granularity: granularity,
                    group_by_currency: groupByCurrency ? 'true' : 'false'
                }
            });
            console.log(response.data);
            response.data.sort((a: AnalyticsData, b: AnalyticsData) => new Date(a.month).getTime() - new Date(b.month).getTime());
            setAnalyticsData(response.data);
        } catch {
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        updateAnalyticsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDateRangeValid = () => {
        // const { from: startDate, to: endDate } = dateRange;
        const { from, to } = dateRange ?? {};
        const startDate = from ? from.toISOString().split('T')[0] : null;
        const endDate = to ? to.toISOString().split('T')[0] : null;
        if (granularity === 'day' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end.getMonth() - start.getMonth() > 2) {
                toast.error('Date range must be within 2 months for daily granularity');
                return false;
            }
        }
        return true;
    }

    const updateDaterange = (range: DateRange) => {
        const startDate = range?.from ? new Date(range.from).toUTCString() : null;
        const endDate = range?.to ? new Date(range.to).toUTCString() : null
        if (startDate && endDate && !isDateRangeValid()) return;
        setDateRange({ from: new Date(startDate ?? ""), to: endDate ? new Date(endDate ?? "") : undefined });
    };

    const processChartData = () => {
        if (!analyticsData) return null;

        const labels = analyticsData.map(item => item.month);
        if (granularity === 'month') {
            labels.forEach((label, index) => {
                const date = new Date(label);
                labels[index] = date.toLocaleString('default', { month: 'long' });
            });
        } else if (granularity === 'day') {
            labels.forEach((label, index) => {
                const date = new Date(label);
                labels[index] = date.toLocaleString('default', { month: 'short', day: 'numeric' });
            });
        } else if (granularity === 'year') {
            labels.forEach((label, index) => {
                const date = new Date(label);
                labels[index] = date.toLocaleString('default', { year: 'numeric' });
            });
        }

        const totalINRAmount = analyticsData.map(item => parseFloat(item.total_inr_amount));

        return {
            labels,
            datasets: [
                {
                    label: "INR Amount",
                    data: totalINRAmount,
                    borderColor: "rgba(153, 102, 255, 1)",
                    backgroundColor: "rgba(153, 102, 255, 0.2)",
                    fill: true,
                }
            ]
        };
    };

    if (loading) return <TransactionManagementLoadingPage />;

    if (!analyticsData) return <div>No data found</div>;

    const chartData = processChartData();

    return (
        <div className="space-y-8 p-8">
            <header className="mb-6">
                {/* back button */}
                <button onClick={back} className="flex items-center space-x-2 mb-6 text-gray-600 hover:text-gray-800">
                    <ArrowLeftIcon className="w-6 h-6" />
                    <span>Back</span>
                    <span className="text-sm">(Esc)</span>
                </button>
                <h1 className="font-semibold text-3xl text-gray-800">Transaction Analytics Dashboard</h1>
            </header>

            {/* Granularity & Group By Options */}
            <div>
                {/* show a settings icon and big text */}
                <div className="flex items-center mb-6">
                    <TbSettings className="mr-2 text-2xl" />
                    <h2 className="mb-2 font-semibold text-2xl text-gray-800">Settings </h2>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                    {/* <div className="flex items-center space-x-2">
                        <Checkbox checked={groupByCurrency} onCheckedChange={(e) => setGroupByCurrency(e == true)} />
                        <span>Group by Currency</span>
                    </div> */}
                    <DatePickerWithRange date={dateRange} setRange={updateDaterange} />
                    <div className="flex items-center space-x-2">
                        <Select onValueChange={(value) => setGranularity(value as Granularity)} >
                            <SelectTrigger className="w-48" >{granularity ?? "Granularity"}</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Day</SelectItem>
                                <SelectItem value="month">Month</SelectItem>
                                <SelectItem value="year">Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={updateAnalyticsData} className="bg-indigo-600 hover:bg-indigo-700 text-white">Apply</Button>
                    {/* clear button */}
                    <Button onClick={() => setDateRange(undefined)} className="">Clear</Button>

                </div>
            </div>

            {/* Stats Cards */}
            <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">Granularity</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-green-600 text-lg"> {granularity.toUpperCase()}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">Total INR Amount</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-blue-600 text-lg">{analyticsData.reduce((acc, cur) => acc + parseFloat(cur.total_inr_amount), 0).toFixed(2)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">Transaction Count</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg text-yellow-600">{analyticsData.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <div className="bg-white shadow-lg mt-6 p-6 rounded-lg">
                <h2 className="mb-4 font-semibold text-2xl text-gray-800">Transaction Trends</h2>
                <Line data={chartData!} />
            </div>
        </div>
    );
};

export default Dashboard;