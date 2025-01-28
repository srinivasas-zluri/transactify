import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Assuming you're using ShadCN UI components
import {
    DatePickerWithRange,
    DateRange,
} from "@/components/ui/daterangepicker";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { TbSettings } from "react-icons/tb";
import { TransactionManagementLoadingPage } from "@/components/TransactionManagement/LoadingPage";
import { ArrowLeftIcon } from "lucide-react";
import {
    AnalyticsData,
    Granularity,
    useAnalyticsDashboard,
} from "@/hooks/useDashboard";
import { toast } from "react-toastify";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const Dashboard = ({ back }: { back: () => void }) => {
    const {
        analyticsData,
        loading,
        granularity,
        dateRange,
        chartData,
        setGranularity,
        setDateRange,
        updateAnalyticsData,
        updateDaterange,
    } = useAnalyticsDashboard({ toast });

    if (loading) return <TransactionManagementLoadingPage />;

    return (
        <div className="space-y-8 p-8">
            {/* Header of the whole page */}
            <header className="mb-6">
                {/* back button */}
                <button
                    onClick={back}
                    className="flex items-center space-x-2 mb-6 text-gray-600 hover:text-gray-800"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                    <span>Back</span>
                    <span className="text-sm">(Esc)</span>
                </button>
                <h1 className="font-semibold text-3xl text-gray-800">
                    Transaction Analytics Dashboard
                </h1>
            </header>

            {/* show the data if analytics is present */}
            {analyticsData != null && chartData != null ? (
                <>
                    <DashBoardSettings
                        dateRange={dateRange}
                        setGranularity={setGranularity}
                        granularity={granularity}
                        setDateRange={setDateRange}
                        updateAnalyticsData={updateAnalyticsData}
                        updateDaterange={updateDaterange}
                    />
                    <ChartDashboardQuickInsights
                        analyticsData={analyticsData}
                        granularity={granularity}
                    />

                    <div className="bg-white shadow-lg mt-6 p-6 rounded-lg">
                        <h2 className="mb-4 font-semibold text-2xl text-gray-800">
                            Transaction Trends
                        </h2>
                        <Line data={chartData} />
                    </div>
                </>
            ) : (
                <div className="flex justify-center items-center h-96">
                    <h2 className="text-2xl text-gray-500">No data to display</h2>
                </div>
            )}
        </div>
    );
};

interface DashBoardSettingsProps {
    dateRange: DateRange;
    setGranularity: (value: Granularity) => void;
    granularity: Granularity;
    updateDaterange: (range: DateRange) => void;
    setDateRange: (range: DateRange) => void;
    updateAnalyticsData: () => void;
}

function DashBoardSettings({
    dateRange,
    setGranularity,
    granularity,
    setDateRange,
    updateAnalyticsData,
    updateDaterange,
}: DashBoardSettingsProps) {
    return (
        <div>
            <div className="flex items-center mb-6">
                <TbSettings className="mr-2 text-2xl" />
                <h2 className="font-semibold text-2xl text-gray-800">Settings </h2>
            </div>
            <div className="flex flex-wrap gap-4 mb-6">
                {/* <div className="flex items-center space-x-2">
                        <Checkbox checked={groupByCurrency} onCheckedChange={(e) => setGroupByCurrency(e == true)} />
                        <span>Group by Currency</span>
                    </div> */}
                <DatePickerWithRange date={dateRange} setRange={updateDaterange} />
                <div className="flex items-center space-x-2">
                    <Select
                        onValueChange={(value) => setGranularity(value as Granularity)}
                    >
                        <SelectTrigger className="w-48">
                            {granularity ?? "Granularity"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Day</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={updateAnalyticsData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Apply
                </Button>
                {/* clear button */}
                <Button onClick={() => setDateRange(undefined)} className="">
                    Clear
                </Button>
            </div>
        </div>
    );
}

interface ChartDashboardViewProps {
    analyticsData: AnalyticsData[];
    granularity: Granularity;
}

function ChartDashboardQuickInsights({
    analyticsData,
    granularity,
}: ChartDashboardViewProps) {
    return (
        <>
            <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">Granularity</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-green-600 text-lg">
                            {" "}
                            {granularity.toUpperCase()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">
                            Total INR Amount
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-blue-600 text-lg">
                            {analyticsData
                                .reduce((acc, cur) => acc + parseFloat(cur.total_inr_amount), 0)
                                .toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <h2 className="font-semibold text-gray-800 text-xl">
                            Grouped Transactions
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg text-yellow-600">
                            {analyticsData.length}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default Dashboard;
