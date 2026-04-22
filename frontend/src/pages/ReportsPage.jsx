import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ChartBar,
  Users,
  Target,
  TrendUp,
  TrendDown,
  Clock,
  CurrencyDollar,
  MapPin,
  Warning,
  Eye,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import OrderItemsView from "../components/OrderItemsView";
import { formatDateDDMmmYYYY, getTruncatedText } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const ROWS_PER_PAGE = 15;

const ReportsPage = () => {
  const { getAuthHeader } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [executivePerformance, setExecutivePerformance] = useState([]);
  const [lostVisits, setLostVisits] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [marketSessions, setMarketSessions] = useState([]);
  const [weeklySales, setWeeklySales] = useState({ daily: [], summary: {} });
  const [advancedOverview, setAdvancedOverview] = useState({
    summary: {},
    top_performers: [],
    territory_coverage: [],
    follow_up_pipeline: { counts: {}, items: [] },
    dealer_attention: [],
    outcome_trend: [],
  });
  const [loading, setLoading] = useState(true);

  // Pagination
  const [sessionsPage, setSessionsPage] = useState(1);
  const [visitsPage, setVisitsPage] = useState(1);
  const [lostPage, setLostPage] = useState(1);

  // Details Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionPotentials, setSessionPotentials] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMetricDetailsOpen, setIsMetricDetailsOpen] = useState(false);
  const [metricDetailsLoading, setMetricDetailsLoading] = useState(false);
  const [metricDetails, setMetricDetails] = useState({
    metric: "",
    title: "",
    rows: [],
  });

  const fetchReportData = useCallback(async () => {
    try {
      const [
        dashRes,
        perfRes,
        lostRes,
        histRes,
        sessRes,
        weeklyRes,
        advancedRes,
      ] =
        await Promise.all([
          axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
          axios.get(`${API}/reports/executive-performance`, {
            headers: getAuthHeader(),
          }),
          axios.get(`${API}/reports/lost-visits`, { headers: getAuthHeader() }),
          axios.get(`${API}/visits/history`, { headers: getAuthHeader() }),
          axios.get(`${API}/reports/market-sessions`, {
            headers: getAuthHeader(),
          }),
          axios.get(`${API}/reports/weekly-sales`, {
            headers: getAuthHeader(),
          }),
          axios.get(`${API}/reports/advanced-overview`, {
            headers: getAuthHeader(),
          }),
        ]);
      setDashboardStats(dashRes.data);
      setExecutivePerformance(perfRes.data);
      setLostVisits(lostRes.data);
      setVisitHistory(histRes.data);
      setMarketSessions(sessRes.data);
      setWeeklySales(weeklyRes.data);
      setAdvancedOverview(advancedRes.data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const viewSessionDetails = async (session) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await axios.get(
        `${API}/reports/market-sessions/${session.id}/potentials`,
        { headers: getAuthHeader() },
      );
      setSessionPotentials(res.data);
    } catch (error) {
      console.error("Failed to fetch details", error);
      toast.error("Failed to load session details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const metricColumnConfig = {
    total_visits: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "duration_minutes", label: "Duration" },
      { key: "order_value", label: "Order Value", align: "right" },
    ],
    orders_booked: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "order_value", label: "Order Value", align: "right" },
      { key: "duration_minutes", label: "Duration" },
    ],
    total_revenue: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "order_value", label: "Order Value", align: "right" },
      { key: "duration_minutes", label: "Duration" },
    ],
    lost_visits: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "duration_minutes", label: "Duration" },
      { key: "next_visit_date", label: "Next Visit" },
    ],
    conversion_rate: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "order_value", label: "Order Value", align: "right" },
      { key: "duration_minutes", label: "Duration" },
    ],
    avg_order_value: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "order_value", label: "Order Value", align: "right" },
      { key: "duration_minutes", label: "Duration" },
    ],
    avg_visit_time: [
      { key: "date", label: "Date" },
      { key: "executive_name", label: "Executive" },
      { key: "dealer_name", label: "Dealer" },
      { key: "outcome", label: "Outcome" },
      { key: "duration_minutes", label: "Duration" },
      { key: "order_value", label: "Order Value", align: "right" },
    ],
    overdue_follow_ups: [
      { key: "next_visit_date", label: "Next Visit" },
      { key: "dealer_name", label: "Dealer" },
      { key: "executive_name", label: "Executive" },
      { key: "territory_name", label: "Territory" },
      { key: "pending_days", label: "Pending Days", align: "center" },
      { key: "last_outcome", label: "Last Outcome" },
    ],
  };

  const openMetricDetails = async (metric) => {
    setIsMetricDetailsOpen(true);
    setMetricDetailsLoading(true);
    setMetricDetails({
      metric,
      title: "",
      rows: [],
    });

    try {
      const res = await axios.get(`${API}/reports/advanced-overview/details`, {
        headers: getAuthHeader(),
        params: { metric },
      });
      setMetricDetails(res.data);
    } catch (error) {
      console.error("Failed to load metric details", error);
      toast.error("Failed to load card details");
    } finally {
      setMetricDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const outcomeStats = {
    "Order Booked": visitHistory.filter((v) => v.outcome === "Order Booked")
      .length,
    "Follow-up Required": visitHistory.filter(
      (v) => v.outcome === "Follow-up Required",
    ).length,
    "No Meeting": visitHistory.filter((v) => v.outcome === "No Meeting").length,
    "Lost Visit": visitHistory.filter((v) => v.outcome === "Lost Visit").length,
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return "–";
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const paginate = (data, page) => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  };

  const formatCurrency = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;

  const formatMinutes = (value) => {
    if (!value) return "0 min";
    if (value < 60) return `${Math.round(value)} min`;
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    return `${hours}h ${minutes}m`;
  };

  const totalSessionsPages = Math.ceil(marketSessions.length / ROWS_PER_PAGE);
  const totalVisitsPages = Math.ceil(visitHistory.length / ROWS_PER_PAGE);
  const totalLostPages = Math.ceil(lostVisits.length / ROWS_PER_PAGE);
  const advancedSummary = advancedOverview.summary || {};
  const activeMetricColumns = metricColumnConfig[metricDetails.metric] || [];

  const formatMetricCell = (key, value) => {
    if (!value && value !== 0) return "—";
    if (key === "date" || key === "next_visit_date") {
      return formatDateDDMmmYYYY(value);
    }
    if (key === "order_value") {
      return formatCurrency(value);
    }
    if (key === "duration_minutes") {
      return formatMinutes(value);
    }
    if (key === "pending_days") {
      return `${value} days`;
    }
    return value;
  };

  const getMetricCellClassName = (column) => {
    if (column.align === "right") return "px-3 py-2 text-xs text-right";
    if (column.align === "center") return "px-3 py-2 text-xs text-center";
    return "px-3 py-2 text-xs";
  };

  const metricCardInteractiveClassName =
    "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300";

  const getMetricCardProps = (metric) => ({
    role: "button",
    tabIndex: 0,
    onClick: () => openMetricDetails(metric),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMetricDetails(metric);
      }
    },
  });

  if (loading) {
    return (
      <AdminLayout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className={`h-7 w-7 text-xs p-0 ${currentPage === pageNum ? "bg-primary-500 text-white" : ""}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-2" data-testid="reports-page">
        {/* Page Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track performance and visit analytics
          </p>
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Team
            </TabsTrigger>
            <TabsTrigger
              value="visits"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Visits
            </TabsTrigger>
            <TabsTrigger
              value="market_sessions"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="lost"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Lost
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Summary Stats - gradient cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card
                {...getMetricCardProps("total_visits")}
                className={`border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">
                      Total Visits
                    </span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <Target className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold">{visitHistory.length}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">All time</p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("orders_booked")}
                className={`border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">
                      Orders Booked
                    </span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <TrendUp className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {outcomeStats["Order Booked"]}
                  </div>
                  <p className="text-[10px] text-white/80 mt-0.5">
                    {visitHistory.length > 0
                      ? Math.round(
                          (outcomeStats["Order Booked"] / visitHistory.length) *
                            100,
                        )
                      : 0}
                    % conversion
                  </p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("total_revenue")}
                className={`border-0 bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">
                      Total Revenue
                    </span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <CurrencyDollar className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    ₹
                    {visitHistory
                      .reduce((sum, v) => sum + (v.order_value || 0), 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-[10px] text-white/80 mt-0.5">
                    From orders
                  </p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("lost_visits")}
                className={`border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">
                      Lost Visits
                    </span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <Warning className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold">{lostVisits.length}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">
                    Needs attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card
                {...getMetricCardProps("conversion_rate")}
                className={`border border-emerald-100 shadow-sm bg-emerald-50/70 ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-emerald-800">
                    Conversion Rate
                  </p>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    {advancedSummary.conversion_rate || 0}%
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    Orders from completed visits
                  </p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("avg_order_value")}
                className={`border border-blue-100 shadow-sm bg-blue-50/70 ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-blue-800">
                    Avg Order Value
                  </p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {formatCurrency(advancedSummary.avg_order_value)}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-1">
                    Per booked order
                  </p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("avg_visit_time")}
                className={`border border-amber-100 shadow-sm bg-amber-50/70 ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-amber-800">
                    Avg Visit Time
                  </p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {formatMinutes(advancedSummary.avg_visit_minutes)}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Based on completed visits
                  </p>
                </CardContent>
              </Card>

              <Card
                {...getMetricCardProps("overdue_follow_ups")}
                className={`border border-rose-100 shadow-sm bg-rose-50/70 ${metricCardInteractiveClassName}`}
              >
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-rose-800">
                    Overdue Follow-ups
                  </p>
                  <p className="text-lg font-bold text-rose-900 mt-1">
                    {advancedSummary.overdue_follow_ups || 0}
                  </p>
                  <p className="text-[10px] text-rose-700 mt-1">
                    Dealers needing action now
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1: 7-Day Trend + Outcome Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 7-Day Visit & Order Trend */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    7-Day Visit & Order Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklySales.daily.length === 0 ? (
                    <div className="flex items-center justify-center h-44 text-xs text-gray-400">
                      No trend data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart
                        data={weeklySales.daily}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                          formatter={(value, name) => [
                            value,
                            name === "visits" ? "Visits" : "Orders",
                          ]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                        />
                        <Bar
                          dataKey="visits"
                          name="Visits"
                          fill="#6366f1"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar
                          dataKey="orders"
                          name="Orders"
                          fill="#10b981"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Outcome Distribution Donut */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    Visit Outcome Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visitHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-44 text-xs text-gray-400">
                      No visit data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Order Booked",
                              value: outcomeStats["Order Booked"],
                            },
                            {
                              name: "Follow-up",
                              value: outcomeStats["Follow-up Required"],
                            },
                            {
                              name: "No Meeting",
                              value: outcomeStats["No Meeting"],
                            },
                            {
                              name: "Lost Visit",
                              value: outcomeStats["Lost Visit"],
                            },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#94a3b8" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    Territory Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {advancedOverview.territory_coverage?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={advancedOverview.territory_coverage}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                          horizontal={false}
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="territory_name"
                          width={110}
                          tick={{ fontSize: 10, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="visited_dealers"
                          name="Visited Dealers"
                          fill="#0f766e"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-44 text-xs text-gray-400">
                      No territory coverage data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    14-Day Revenue Momentum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {advancedOverview.outcome_trend?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={advancedOverview.outcome_trend}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-44 text-xs text-gray-400">
                      No revenue trend available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Executive Performance Chart */}
            {executivePerformance.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    Top Executives — Visits vs Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(
                      180,
                      Math.min(executivePerformance.length, 5) * 44,
                    )}
                  >
                    <BarChart
                      layout="vertical"
                      data={[...executivePerformance]
                        .sort((a, b) => b.total_visits - a.total_visits)
                        .slice(0, 5)
                        .map((e) => ({
                          name:
                            e.name.length > 12 ? e.name.split(" ")[0] : e.name,
                          "Total Visits": e.total_visits,
                          Completed: e.completed_visits,
                        }))}
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{
                          fontSize: 11,
                          fill: "#374151",
                          fontWeight: 500,
                        }}
                        width={72}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                      <Bar
                        dataKey="Total Visits"
                        fill="#6366f1"
                        radius={[0, 3, 3, 0]}
                        maxBarSize={16}
                      />
                      <Bar
                        dataKey="Completed"
                        fill="#10b981"
                        radius={[0, 3, 3, 0]}
                        maxBarSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    Top Performers Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {advancedOverview.top_performers?.length ? (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Executive</TableHead>
                            <TableHead className="text-center">Visits</TableHead>
                            <TableHead className="text-center">Conv.</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {advancedOverview.top_performers.map((exec) => (
                            <TableRow key={exec.executive_id}>
                              <TableCell className="py-2">
                                <div className="font-medium text-xs text-gray-900">
                                  {exec.executive_name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {exec.employee_code || "No code"}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                {exec.total_visits}
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                {exec.conversion_rate}%
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium">
                                {formatCurrency(exec.revenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-xs text-gray-400">
                      No performer data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-800">
                    Follow-up Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-rose-50 border border-rose-100 p-2 text-center">
                      <p className="text-[10px] text-rose-700">Overdue</p>
                      <p className="text-sm font-bold text-rose-900">
                        {advancedOverview.follow_up_pipeline?.counts?.overdue ||
                          0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
                      <p className="text-[10px] text-amber-700">Today</p>
                      <p className="text-sm font-bold text-amber-900">
                        {advancedOverview.follow_up_pipeline?.counts?.today || 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
                      <p className="text-[10px] text-emerald-700">Upcoming</p>
                      <p className="text-sm font-bold text-emerald-900">
                        {advancedOverview.follow_up_pipeline?.counts?.upcoming ||
                          0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(advancedOverview.follow_up_pipeline?.items || [])
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.visit_id}
                          className="rounded-lg border border-gray-100 p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-gray-900">
                                {item.dealer_name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {item.executive_name}
                              </p>
                            </div>
                            <Badge
                              className={`text-[10px] ${
                                item.bucket === "overdue"
                                  ? "bg-rose-100 text-rose-700"
                                  : item.bucket === "today"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.bucket}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Next visit:{" "}
                            {item.next_visit_date
                              ? formatDateDDMmmYYYY(item.next_visit_date)
                              : "-"}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Dealers Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {advancedOverview.dealer_attention?.length ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dealer</TableHead>
                          <TableHead>Territory</TableHead>
                          <TableHead className="text-center">Last Outcome</TableHead>
                          <TableHead className="text-center">Days Idle</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {advancedOverview.dealer_attention.map((dealer) => (
                          <TableRow key={dealer.dealer_id}>
                            <TableCell className="py-2">
                              <div className="font-medium text-xs text-gray-900">
                                {dealer.dealer_name}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {dealer.city || "No city"}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {dealer.territory_name}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {dealer.last_outcome || "-"}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {dealer.days_since_last_visit || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={`text-[10px] ${
                                  dealer.attention_status ===
                                  "Overdue Follow-up"
                                    ? "bg-rose-100 text-rose-700"
                                    : dealer.attention_status === "Cold Dealer"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {dealer.attention_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-xs text-gray-400">
                    No dealer risk data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card
              className="border-0 shadow-sm"
              data-testid="performance-table-card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Executive Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {executivePerformance.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">
                    No performance data yet
                  </p>
                ) : (
                  <div className="overflow-auto max-h-[30rem]">
                    <Table className="w-full text-left">
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-y border-gray-200">
                          <TableHead className="px-2 py-2 w-8 bg-gray-200">
                            #
                          </TableHead>
                          <TableHead className="px-3 py-2 bg-gray-200">
                            Executive Name
                          </TableHead>
                          <TableHead className="text-center px-3 py-2">
                            Total Visits
                          </TableHead>
                          <TableHead className="text-center px-3 py-2">
                            Completed
                          </TableHead>
                          <TableHead className="text-right px-3 py-2">
                            Orders Value
                          </TableHead>
                          <TableHead className="text-center px-3 py-2">
                            Avg Time/Visit
                          </TableHead>
                          <TableHead className="text-center px-3 py-2 border-r-0">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executivePerformance.map((exec, idx) => {
                          const execName = getTruncatedText(exec.name, 20);
                          const execCode = getTruncatedText(
                            exec.employee_code,
                            15,
                          );

                          return (
                            <TableRow
                              key={exec.id}
                              className="transition-colors"
                            >
                              <TableCell className="px-2 py-1 text-xs text-gray-900 w-8">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="px-3 py-1">
                                <div>
                                  <p
                                    className="text-xs text-gray-900"
                                    title={execName.full}
                                  >
                                    {execName.display}
                                  </p>
                                  <p
                                    className="text-[10px] text-gray-600"
                                    title={execCode.full}
                                  >
                                    {execCode.display}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-center border-r border-gray-200">
                                {exec.total_visits}
                              </TableCell>
                              <TableCell className="text-xs text-center text-gray-900 border-r border-gray-200">
                                {exec.completed_visits}
                              </TableCell>
                              <TableCell className="text-xs text-primary-700 text-right border-r border-gray-200">
                                ₹{exec.total_orders.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-center text-gray-900 border-r border-gray-200">
                                {exec.avg_time_per_visit} min
                              </TableCell>
                              <TableCell className="px-2 py-1 text-center border-r-0">
                                <span
                                  className={`text-xs ${
                                    exec.is_in_market
                                      ? "text-emerald-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {exec.is_in_market ? "In Field" : "Offline"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit Analysis Tab */}
          <TabsContent value="visits" className="space-y-4">
            <Card
              className="border-0 shadow-sm"
              data-testid="visits-history-card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {visitHistory.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">
                    No visits recorded yet
                  </p>
                ) : (
                  <>
                    <div className="overflow-auto max-h-[30rem]">
                      <Table className="w-full border-collapse text-left">
                        <TableHeader className="sticky top-0 z-10">
                          <TableRow className="border-y border-gray-200">
                            <TableHead className="px-2 py-2">#</TableHead>
                            <TableHead className="px-3 py-2">Date</TableHead>
                            <TableHead className="px-3 py-2">User</TableHead>
                            <TableHead className="px-3 py-2">Dealer</TableHead>
                            <TableHead className="px-3 py-2">Contact</TableHead>
                            <TableHead className="px-3 py-2">Phone</TableHead>
                            <TableHead className="px-3 py-2">
                              Check-in
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Duration
                            </TableHead>
                            <TableHead className="px-3 py-2">Outcome</TableHead>
                            <TableHead className="px-3 py-2 text-right">
                              Order Value
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center border-r-0">
                              Items
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginate(visitHistory, visitsPage).map(
                            (visit, idx) => {
                              const userName = getTruncatedText(
                                visit.user_name,
                                15,
                              );
                              const dealerName = getTruncatedText(
                                visit.dealer_name,
                                20,
                              );
                              const contactName = getTruncatedText(
                                visit.contact_name,
                                15,
                              );

                              return (
                                <TableRow
                                  key={visit.id}
                                  className="transition-colors"
                                >
                                  <TableCell className="px-2 py-1 text-xs text-gray-900 w-8">
                                    {(visitsPage - 1) * 15 + idx + 1}
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                    {formatDateDDMmmYYYY(visit.check_in_time)}
                                  </TableCell>
                                  <TableCell
                                    className="px-3 py-1 text-xs text-gray-900"
                                    title={userName.full}
                                  >
                                    {userName.display}
                                  </TableCell>
                                  <TableCell
                                    className="px-3 py-1 text-xs text-gray-900"
                                    title={dealerName.full}
                                  >
                                    {dealerName.display}
                                  </TableCell>
                                  <TableCell
                                    className="px-3 py-1 text-xs text-gray-800"
                                    title={contactName.full}
                                  >
                                    {contactName.display}
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                    {visit.contact_phone || "–"}
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                    {new Date(
                                      visit.check_in_time,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-gray-800 text-center">
                                    {visit.time_spent_minutes
                                      ? `${Math.round(visit.time_spent_minutes)}m`
                                      : "–"}
                                  </TableCell>
                                  <TableCell className="px-3 py-1">
                                    <span
                                      className={`text-xs ${
                                        visit.outcome === "Order Booked"
                                          ? "text-emerald-700"
                                          : visit.outcome ===
                                              "Follow-up Required"
                                            ? "text-amber-700"
                                            : visit.outcome === "Lost Visit"
                                              ? "text-red-700"
                                              : "text-gray-700"
                                      }`}
                                    >
                                      {visit.outcome || "In Progress"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-primary-700 text-right">
                                    {visit.order_value
                                      ? `₹${visit.order_value.toLocaleString()}`
                                      : "–"}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-center border-r-0">
                                    <OrderItemsView visit={visit} />
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={visitsPage}
                      totalPages={totalVisitsPages}
                      onPageChange={setVisitsPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lost Visits Tab */}
          <TabsContent value="lost" className="space-y-4">
            <Card className="border-0 shadow-sm" data-testid="lost-visits-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Warning className="text-red-500" weight="fill" size={16} />
                  Lost Visits Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {lostVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <TrendUp className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Great! No lost visits recorded
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto max-h-[30rem]">
                      <Table className="w-full border-collapse text-left">
                        <TableHeader className="sticky top-0 z-10">
                          <TableRow className="border-y border-gray-200">
                            <TableHead className="px-2 py-2">#</TableHead>
                            <TableHead className="px-2 py-2">Date</TableHead>
                            <TableHead className="px-2 py-2">Dealer</TableHead>
                            <TableHead className="px-2 py-2 border-r-0">
                              Notes
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginate(lostVisits, lostPage).map((visit, idx) => {
                            const dealerName = getTruncatedText(
                              visit.dealer_name,
                              20,
                            );
                            const notes = getTruncatedText(
                              visit.notes || "No notes",
                              30,
                            );

                            return (
                              <TableRow
                                key={visit.id}
                                className="transition-colors"
                              >
                                <TableCell className="px-2 py-1 text-xs text-gray-900 w-8">
                                  {(lostPage - 1) * 15 + idx + 1}
                                </TableCell>
                                <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                  {formatDateDDMmmYYYY(visit.check_in_time)}
                                </TableCell>
                                <TableCell
                                  className="px-3 py-1 text-xs text-gray-900"
                                  title={dealerName.full}
                                >
                                  {dealerName.display}
                                </TableCell>
                                <TableCell
                                  className="px-3 py-1 text-xs text-gray-600 border-r-0"
                                  title={notes.full}
                                >
                                  {notes.display}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={lostPage}
                      totalPages={totalLostPages}
                      onPageChange={setLostPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Market Sessions Tab */}
          <TabsContent value="market_sessions" className="space-y-4">
            <Card
              className="border-0 shadow-sm"
              data-testid="market-sessions-card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Daily Market Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {marketSessions.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">
                    No market sessions recorded
                  </p>
                ) : (
                  <>
                    <div className="overflow-auto max-h-[30rem]">
                      <Table className="w-full border-collapse text-left">
                        <TableHeader className="sticky top-0 z-10">
                          <TableRow className="border-y border-gray-200">
                            <TableHead className="px-2 py-2 w-8">#</TableHead>
                            <TableHead className="px-2 py-2">User</TableHead>
                            <TableHead className="px-2 py-2">Date</TableHead>
                            <TableHead className="px-2 py-2">Time</TableHead>
                            <TableHead className="px-2 py-2">Status</TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Duration
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Distance
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Shown
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Visited
                            </TableHead>
                            <TableHead className="px-2 py-2 text-center">
                              Lost
                            </TableHead>
                            <TableHead className="px-2 py-2 text-right border-r-0">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginate(marketSessions, sessionsPage).map(
                            (session, idx) => {
                              const userName = getTruncatedText(
                                session.user_name,
                                15,
                              );

                              return (
                                <TableRow
                                  key={session.id}
                                  className="transition-colors"
                                >
                                  <TableCell className="px-2 py-1 text-xs text-gray-900 w-8">
                                    {(sessionsPage - 1) * 15 + idx + 1}
                                  </TableCell>
                                  <TableCell
                                    className="px-3 py-1 text-xs text-gray-900"
                                    title={userName.full}
                                  >
                                    {userName.display}
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                    {formatDateDDMmmYYYY(session.start_time)}
                                  </TableCell>
                                  <TableCell className="px-3 py-1 text-xs text-gray-800 whitespace-nowrap">
                                    {new Date(
                                      session.start_time,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </TableCell>
                                  <TableCell className="px-3 py-1">
                                    <span
                                      className={`text-xs ${session.end_time ? "text-gray-500" : "text-emerald-700"}`}
                                    >
                                      {session.end_time ? "Done" : "Active"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-gray-800 text-center">
                                    {formatDuration(
                                      session.start_time,
                                      session.end_time,
                                    )}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-gray-800 text-center">
                                    {session.total_distance
                                      ? `${(session.total_distance / 1000).toFixed(1)} km`
                                      : "–"}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-gray-900 text-center">
                                    {session.potential_visits_count || 0}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-emerald-700 text-center">
                                    {session.visits_completed || 0}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-xs text-red-700 text-center">
                                    {session.calculated_lost_visits || 0}
                                  </TableCell>
                                  <TableCell className="px-2 py-1 text-right border-r-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                      onClick={() =>
                                        viewSessionDetails(session)
                                      }
                                    >
                                      <Eye className="w-3 h-3 mr-1" /> Details
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={sessionsPage}
                      totalPages={totalSessionsPages}
                      onPageChange={setSessionsPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
              <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap gap-2 sm:gap-4 mt-2">
                <span>{selectedSession?.user_name}</span>
                <span>•</span>
                <span>
                  {selectedSession &&
                    new Date(selectedSession.start_time).toLocaleString()}
                </span>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto max-h-[30rem] pr-2 mt-4">
              {detailsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="spinner" />
                </div>
              ) : sessionPotentials.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  No details recorded for this session.
                </div>
              ) : (
                <Table className="w-full text-left min-w-[400px]">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-y border-gray-200">
                      <TableHead className="px-2 sm:px-4 py-1 bg-gray-200">
                        Place/Dealer
                      </TableHead>
                      <TableHead className="px-2 sm:px-4 py-1 bg-gray-200">
                        Address
                      </TableHead>
                      <TableHead className="px-2 sm:px-4 py-1 text-center bg-gray-200">
                        Status
                      </TableHead>
                      <TableHead className="px-2 sm:px-4 py-1 text-right border-r-0 bg-gray-200">
                        Time Shown
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionPotentials.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`border-b border-gray-200 transition-colors ${item.is_visited ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-gray-50"}`}
                      >
                        <TableCell className="px-2 sm:px-4 py-1 text-xs text-gray-900 border-r border-gray-200 font-normal">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-4 h-4 flex-shrink-0 ${item.is_visited ? "text-emerald-700" : "text-gray-500"}`}
                            />
                            <div>
                              <span>{item.place_name}</span>
                              <p className="text-[10px] text-gray-500 sm:hidden truncate max-w-[200px]">
                                {item.address}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          className="px-2 sm:px-4 py-1 text-xs text-gray-700 max-w-xs truncate hidden sm:table-cell border-r border-gray-200 font-normal"
                          title={item.address}
                        >
                          {item.address}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-1 text-center border-r border-gray-200 font-normal">
                          {item.is_visited ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-normal">
                              Visited
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0 font-normal">
                              Shown
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-1 text-right text-xs text-gray-600 whitespace-nowrap border-r-0 font-normal">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isMetricDetailsOpen}
          onOpenChange={setIsMetricDetailsOpen}
        >
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{metricDetails.title || "Report Details"}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto max-h-[32rem] pr-1 mt-2">
              {metricDetailsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="spinner" />
                </div>
              ) : metricDetails.rows?.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  No details found for this card.
                </div>
              ) : (
                <Table className="w-full text-left min-w-[760px]">
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow className="border-y border-gray-200">
                      {activeMetricColumns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={`${getMetricCellClassName(column)} bg-gray-100 font-medium text-gray-700`}
                        >
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricDetails.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        {activeMetricColumns.map((column) => (
                          <TableCell
                            key={`${row.id}-${column.key}`}
                            className={`${getMetricCellClassName(column)} text-gray-800`}
                          >
                            {formatMetricCell(column.key, row[column.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
