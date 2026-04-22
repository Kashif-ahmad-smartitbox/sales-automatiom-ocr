import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  CalendarBlank,
  ChartBar,
  Trophy,
  TrendDown,
  X,
  Funnel,
  Lightning,
  UsersThree,
  WarningCircle,
  TrendUp,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODReports = () => {
  const { getAuthHeader } = useAuth();
  const [hodData, setHodData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [underperformers, setUnderperformers] = useState([]);
  const [advancedSummary, setAdvancedSummary] = useState({
    summary: {},
    leaderboard: [],
    attention_required: [],
    hod_metrics: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedHOD, setSelectedHOD] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [teamLeadsLoading, setTeamLeadsLoading] = useState(false);
  const [teamLeadsData, setTeamLeadsData] = useState({
    summary: {},
    leads: [],
  });
  const [metricDetailsOpen, setMetricDetailsOpen] = useState(false);
  const [metricDetailsLoading, setMetricDetailsLoading] = useState(false);
  const [metricDetails, setMetricDetails] = useState({
    metric: '',
    title: '',
    rows: [],
  });
  const [modalFilters, setModalFilters] = useState({
    executive_id: '',
    status: '',
  });

  const fetchHODDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-dashboard`, {
        headers: getAuthHeader(),
        params: dateRange,
      });
      setHodData(response.data);
    } catch (error) {
      console.error('Failed to fetch HOD dashboard:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchTopPerformers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-top-performers`, {
        headers: getAuthHeader(),
        params: { ...dateRange, limit: 5 },
      });
      setTopPerformers(response.data);
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchUnderperformers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-underperformers`, {
        headers: getAuthHeader(),
        params: { ...dateRange, limit: 5 },
      });
      setUnderperformers(response.data);
    } catch (error) {
      console.error('Failed to fetch underperformers:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchAdvancedSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-advanced-summary`, {
        headers: getAuthHeader(),
        params: dateRange,
      });
      setAdvancedSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch HOD advanced summary:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchTeamDetails = useCallback(async (hodId) => {
    try {
      const response = await axios.get(`${API}/reports/hod-team-details/${hodId}`, {
        headers: getAuthHeader(),
        params: { ...dateRange, ...modalFilters },
      });
      setTeamDetails(response.data.team_details || []);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    }
  }, [getAuthHeader, dateRange, modalFilters]);

  const fetchExecutiveLeads = useCallback(async (hodId, executiveId) => {
    setTeamLeadsLoading(true);
    try {
      const response = await axios.get(
        `${API}/reports/hod-team-leads/${hodId}/${executiveId}`,
        {
          headers: getAuthHeader(),
          params: dateRange,
        },
      );
      setTeamLeadsData(response.data);
    } catch (error) {
      console.error('Failed to fetch executive leads:', error);
      setTeamLeadsData({ summary: {}, leads: [] });
    } finally {
      setTeamLeadsLoading(false);
    }
  }, [getAuthHeader, dateRange]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHODDashboard(),
        fetchTopPerformers(),
        fetchUnderperformers(),
        fetchAdvancedSummary(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchHODDashboard, fetchTopPerformers, fetchUnderperformers, fetchAdvancedSummary]);

  useEffect(() => {
    if (selectedHOD) {
      fetchTeamDetails(selectedHOD.id);
    }
  }, [selectedHOD, modalFilters, fetchTeamDetails]);

  const handleTeamSizeClick = (hod) => {
    setSelectedHOD(hod);
    setShowTeamModal(true);
    setModalFilters({ executive_id: '', status: '' });
  };

  const handleExecutiveLeadsClick = async (member) => {
    if (!selectedHOD) return;
    setSelectedExecutive(member);
    setShowLeadsModal(true);
    await fetchExecutiveLeads(selectedHOD.id, member.executive_id);
  };

  const advancedMap = (advancedSummary.hod_metrics || []).reduce((acc, item) => {
    acc[item.hod_id] = item;
    return acc;
  }, {});

  const metricColumns = {
    total_hods: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'team_size', label: 'Team', align: 'center' },
      { key: 'active_executives', label: 'Active', align: 'center' },
      { key: 'total_visits', label: 'Visits', align: 'center' },
      { key: 'conversion_rate', label: 'Conversion', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
    total_team_size: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'team_size', label: 'Team Size', align: 'center' },
      { key: 'active_executives', label: 'Active', align: 'center' },
      { key: 'inactive_executives', label: 'Inactive', align: 'center' },
      { key: 'total_visits', label: 'Visits', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
    active_executives: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'active_executives', label: 'Active', align: 'center' },
      { key: 'inactive_executives', label: 'Inactive', align: 'center' },
      { key: 'team_size', label: 'Team Size', align: 'center' },
      { key: 'conversion_rate', label: 'Conversion', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
    total_visits: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'total_visits', label: 'Visits', align: 'center' },
      { key: 'completed_visits', label: 'Completed', align: 'center' },
      { key: 'orders_count', label: 'Orders', align: 'center' },
      { key: 'conversion_rate', label: 'Conversion', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
    total_order_value: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
      { key: 'orders_count', label: 'Orders', align: 'center' },
      { key: 'total_visits', label: 'Visits', align: 'center' },
      { key: 'conversion_rate', label: 'Conversion', align: 'center' },
      { key: 'unique_dealers', label: 'Dealers', align: 'center' },
    ],
    avg_conversion_rate: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'conversion_rate', label: 'Conversion', align: 'center' },
      { key: 'completed_visits', label: 'Completed', align: 'center' },
      { key: 'orders_count', label: 'Orders', align: 'center' },
      { key: 'total_visits', label: 'Visits', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
    overdue_follow_ups: [
      { key: 'hod_name', label: 'HOD' },
      { key: 'overdue_follow_ups', label: 'Overdue', align: 'center' },
      { key: 'follow_up_due', label: 'Due', align: 'center' },
      { key: 'lost_visits', label: 'Lost Visits', align: 'center' },
      { key: 'inactive_executives', label: 'Inactive', align: 'center' },
      { key: 'order_value', label: 'Order Value', align: 'right' },
    ],
  };

  const openMetricDetails = async (metric) => {
    setMetricDetailsOpen(true);
    setMetricDetailsLoading(true);
    setMetricDetails({ metric, title: '', rows: [] });

    try {
      const response = await axios.get(`${API}/reports/hod-advanced-summary/details`, {
        headers: getAuthHeader(),
        params: { metric, ...dateRange },
      });
      setMetricDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch HOD metric details:', error);
    } finally {
      setMetricDetailsLoading(false);
    }
  };

  const formatCurrency = (value) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMetricCell = (key, value) => {
    if (!value && value !== 0) return '—';
    if (key === 'order_value') return formatCurrency(value);
    if (
      key === 'conversion_rate'
    ) return `${value}%`;
    return value;
  };

  const getCellClassName = (align) => {
    if (align === 'right') return 'px-3 py-2 text-xs text-right';
    if (align === 'center') return 'px-3 py-2 text-xs text-center';
    return 'px-3 py-2 text-xs';
  };

  const interactiveCardClassName =
    'cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300';

  const getMetricCardProps = (metric) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => openMetricDetails(metric),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMetricDetails(metric);
      }
    },
  });

  const summary = advancedSummary.summary || {};
  const hodMetrics = advancedSummary.hod_metrics || [];
  const leaderboard = advancedSummary.leaderboard || [];
  const attentionRequired = advancedSummary.attention_required || [];
  const bestHOD = leaderboard[0] || null;
  const riskHOD = attentionRequired[0] || null;
  const teamActivation = summary.total_team_size
    ? Math.round(((summary.active_executives || 0) / summary.total_team_size) * 100)
    : 0;
  const activeMetricColumns = metricColumns[metricDetails.metric] || [];

  if (loading) {
    return (
      <AdminLayout title="HOD Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="HOD Reports">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              HOD Performance Report
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track HOD and team performance metrics
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <CalendarBlank size={16} className="text-gray-500" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <Card
            {...getMetricCardProps('total_hods')}
            className={`border border-orange-100 shadow-sm bg-orange-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-orange-800">HODs</p>
              <p className="text-lg font-bold text-orange-900 mt-1">
                {summary.total_hods || 0}
              </p>
              <p className="text-[10px] text-orange-700 mt-1">Tracked in range</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('total_team_size')}
            className={`border border-sky-100 shadow-sm bg-sky-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-sky-800">Team Size</p>
              <p className="text-lg font-bold text-sky-900 mt-1">
                {summary.total_team_size || 0}
              </p>
              <p className="text-[10px] text-sky-700 mt-1">Executives under HODs</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('active_executives')}
            className={`border border-indigo-100 shadow-sm bg-indigo-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-indigo-800">Active Execs</p>
              <p className="text-lg font-bold text-indigo-900 mt-1">
                {summary.active_executives || 0}
              </p>
              <p className="text-[10px] text-indigo-700 mt-1">{teamActivation}% team activation</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('total_visits')}
            className={`border border-violet-100 shadow-sm bg-violet-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-violet-800">Total Visits</p>
              <p className="text-lg font-bold text-violet-900 mt-1">
                {summary.total_visits || 0}
              </p>
              <p className="text-[10px] text-violet-700 mt-1">{summary.total_orders || 0} orders from teams</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('total_order_value')}
            className={`border border-emerald-100 shadow-sm bg-emerald-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-emerald-800">Order Value</p>
              <p className="text-lg font-bold text-emerald-900 mt-1">
                {formatCurrency(summary.total_order_value)}
              </p>
              <p className="text-[10px] text-emerald-700 mt-1">Combined team output</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('avg_conversion_rate')}
            className={`border border-blue-100 shadow-sm bg-blue-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-blue-800">Avg Conversion</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {summary.avg_conversion_rate || 0}%
              </p>
              <p className="text-[10px] text-blue-700 mt-1">Across all HOD teams</p>
            </CardContent>
          </Card>

          <Card
            {...getMetricCardProps('overdue_follow_ups')}
            className={`border border-rose-100 shadow-sm bg-rose-50/70 ${interactiveCardClassName}`}
          >
            <CardContent className="p-3">
              <p className="text-[11px] font-medium text-rose-800">Overdue Follow-ups</p>
              <p className="text-lg font-bold text-rose-900 mt-1">
                {summary.overdue_follow_ups || 0}
              </p>
              <p className="text-[10px] text-rose-700 mt-1">Needs admin attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={18} weight="fill" className="text-amber-300" />
                <p className="text-xs uppercase tracking-wide text-white/70">Best Performing HOD</p>
              </div>
              <p className="text-lg font-bold">{bestHOD?.hod_name || 'No data'}</p>
              <p className="text-xs text-white/75 mt-1">
                {bestHOD
                  ? `${bestHOD.total_visits} visits, ${bestHOD.conversion_rate}% conversion, ${formatCurrency(bestHOD.order_value)}`
                  : 'No leaderboard data in this range'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <WarningCircle size={18} weight="fill" className="text-rose-600" />
                <p className="text-xs uppercase tracking-wide text-amber-900/80">Highest Risk HOD</p>
              </div>
              <p className="text-lg font-bold text-amber-950">{riskHOD?.hod_name || 'No active risk'}</p>
              <p className="text-xs text-amber-900/70 mt-1">
                {riskHOD
                  ? `${riskHOD.overdue_follow_ups} overdue, ${riskHOD.inactive_executives} inactive execs, ${riskHOD.lost_visits} lost visits`
                  : 'No urgent issues for selected dates'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightning size={18} weight="fill" className="text-emerald-700" />
                <p className="text-xs uppercase tracking-wide text-emerald-900/80">Team Health Snapshot</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-emerald-800">Active</p>
                  <p className="text-base font-bold text-emerald-950">{summary.active_executives || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800">Orders</p>
                  <p className="text-base font-bold text-emerald-950">{summary.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800">Activation</p>
                  <p className="text-base font-bold text-emerald-950">{teamActivation}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800">Tracked HODs</p>
                  <p className="text-base font-bold text-emerald-950">{summary.total_hods || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">HOD Overview</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Compare HOD team strength, activity, conversion, follow-up load, and revenue in one table.
                </p>
              </div>
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                <p className="text-[10px] text-orange-700">Quick read</p>
                <p className="text-xs font-semibold text-orange-900">
                  Click any top summary card or team size badge to drill into details
                </p>
              </div>
            </div>
            <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm w-full max-h-[30rem]">
              <Table className="table-auto border-collapse">
                <TableHeader className="text-nowrap sticky top-0 z-10 bg-gray-200">
                  <TableRow className="border-y border-gray-200">
                    <TableHead className="px-2 py-2 text-left bg-gray-200">HOD Name</TableHead>
                    <TableHead className="px-2 py-2 text-center bg-gray-200">Team Size</TableHead>
                    <TableHead className="px-2 py-2 text-center bg-gray-200">Active</TableHead>
                    <TableHead className="px-2 py-2 text-center bg-gray-200">Total Visit</TableHead>
                    <TableHead className="px-2 py-2 text-center bg-gray-200">Conversion</TableHead>
                    <TableHead className="px-2 py-2 text-center bg-gray-200">Follow-ups</TableHead>
                    <TableHead className="px-2 py-2 text-right bg-gray-200 border-r-0">Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {hodData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-6 text-gray-500 text-[11px]">
                        No data available for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    hodData.map((hod) => {
                      const metrics = advancedMap[hod.id] || {};
                      return (
                        <TableRow key={hod.id} className="transition-all text-xs text-gray-800 duration-200">
                          <TableCell className="py-1 px-2 text-gray-900 border-r border-gray-100 font-normal">
                            <div>{hod.name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {metrics.unique_dealers || 0} dealers
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r border-gray-100 font-normal">
                            <button
                              onClick={() => handleTeamSizeClick(hod)}
                              className="inline-flex items-center justify-center w-7 h-7 bg-orange-100 text-orange-600 font-bold rounded-lg hover:bg-orange-200 transition-colors cursor-pointer text-[11px]"
                            >
                              {hod.team_size}
                            </button>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r border-gray-100 font-normal">
                            {metrics.active_executives || 0}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r border-gray-100 font-normal">
                            {hod.total_visits}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r border-gray-100 font-normal">
                            {metrics.conversion_rate || 0}%
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r border-gray-100 font-normal">
                            <span className={(metrics.overdue_follow_ups || 0) > 0 ? 'text-rose-600' : 'text-gray-800'}>
                              {metrics.follow_up_due || 0}
                            </span>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-right border-r-0 font-normal">
                            {formatCurrency(hod.order_value)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">
              <strong>Note:</strong> Click on Team Size to view detailed team data with filters
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <ChartBar size={20} className="text-slate-700" weight="fill" />
                <h2 className="text-sm font-bold text-slate-900">HOD Leaderboard</h2>
              </div>

              <div className="space-y-2">
                {leaderboard.map((hod, index) => (
                  <div key={hod.hod_id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        #{index + 1} {hod.hod_name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {hod.total_visits} visits • {hod.conversion_rate}% conversion
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        {formatCurrency(hod.order_value)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {hod.active_executives}/{hod.team_size} active
                      </p>
                    </div>
                  </div>
                ))}
                {!leaderboard.length && (
                  <p className="text-xs text-gray-500 text-center py-6">
                    No leaderboard data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendDown size={20} className="text-rose-600" weight="fill" />
                <h2 className="text-sm font-bold text-rose-900">Attention Required</h2>
              </div>

              <div className="space-y-2">
                {attentionRequired.map((hod) => (
                  <div key={hod.hod_id} className="rounded-lg border border-rose-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-gray-900">{hod.hod_name}</p>
                      <span className="text-[10px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        {hod.overdue_follow_ups} overdue
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {hod.inactive_executives} inactive execs • {hod.lost_visits} lost visits • {hod.follow_up_due} follow-ups due
                    </p>
                  </div>
                ))}
                {!attentionRequired.length && (
                  <p className="text-xs text-gray-500 text-center py-6">
                    No urgent HOD issues in this range
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={20} className="text-green-600" weight="fill" />
                <h2 className="text-sm font-bold text-green-900">Top Performers</h2>
              </div>

              <div className="overflow-auto rounded-lg border border-green-200 bg-white shadow-sm w-full max-h-[30rem]">
                <Table className="table-auto border-collapse">
                  <TableHeader className="text-nowrap sticky top-0 bg-gray-200">
                    <TableRow className="border-y border-gray-200">
                      <TableHead className="px-2 py-2 text-left bg-gray-200">HOD Name</TableHead>
                      <TableHead className="px-2 py-2 text-left bg-gray-200">Executive</TableHead>
                      <TableHead className="px-2 py-2 text-center bg-gray-200">Visit</TableHead>
                      <TableHead className="px-2 py-2 text-right bg-gray-200">Order Value</TableHead>
                      <TableHead className="px-2 py-2 text-center bg-gray-200 border-r-0">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-green-100">
                    {topPerformers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="5" className="text-center py-4 text-gray-600 text-[11px]">
                          No performer data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      topPerformers.map((performer, index) => (
                        <TableRow key={`${performer.executive_id}-${index}`} className="transition-all text-xs duration-200">
                          <TableCell className="py-1 px-2 text-gray-900 border-r border-gray-100 font-normal">{performer.hod_name}</TableCell>
                          <TableCell className="py-1 px-2 text-gray-900 border-r border-gray-100 font-normal">{performer.executive_name}</TableCell>
                          <TableCell className="py-1 px-2 text-center text-gray-800 border-r border-gray-100 font-normal">{performer.visits}</TableCell>
                          <TableCell className="py-1 px-2 text-right text-gray-900 border-r border-gray-100 font-normal">
                            {formatCurrency(performer.order_value)}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r-0 font-normal">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                    ? 'bg-gray-300 text-gray-800'
                                    : index === 2
                                      ? 'bg-orange-300 text-orange-900'
                                      : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {performer.position_label}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendDown size={20} className="text-amber-600" weight="fill" />
                <h2 className="text-sm font-bold text-amber-900">Top Underperformers</h2>
              </div>

              <div className="overflow-auto bg-white shadow-sm w-full max-h-[30rem] rounded-lg border border-amber-200">
                <Table className="table-auto border-separate border-spacing-0">
                  <TableHeader className="text-nowrap sticky top-0 z-10">
                    <TableRow className="border-y border-gray-200">
                      <TableHead className="p-1 text-gray-700 text-xs bg-gray-200">HOD Name</TableHead>
                      <TableHead className="p-1 text-gray-700 text-xs bg-gray-200">Executive</TableHead>
                      <TableHead className="p-1 text-gray-700 text-xs text-center bg-gray-200">Visit</TableHead>
                      <TableHead className="p-1 text-gray-700 text-xs text-right bg-gray-200">Order Value</TableHead>
                      <TableHead className="p-1 text-gray-700 text-xs text-center bg-gray-200 border-r-0">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-amber-100">
                    {underperformers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="5" className="text-center py-4 text-gray-600 text-[11px]">
                          No underperformer data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      underperformers.map((performer, index) => (
                        <TableRow key={`${performer.executive_id}-${index}`} className="transition-all text-xs duration-200">
                          <TableCell className="py-1 px-2 text-gray-900 border-r border-gray-100 font-normal">{performer.hod_name}</TableCell>
                          <TableCell className="py-1 px-2 text-gray-900 border-r border-gray-100 font-normal">{performer.executive_name}</TableCell>
                          <TableCell className="py-1 px-2 text-center text-gray-800 border-r border-gray-100 font-normal">{performer.visits}</TableCell>
                          <TableCell className="py-1 px-2 text-right text-gray-900 border-r border-gray-100 font-normal">
                            {formatCurrency(performer.order_value)}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center border-r-0 font-normal">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-amber-200 text-amber-900">
                              {performer.type}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {showTeamModal && selectedHOD && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedHOD.name}&apos;s Team Details</h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Team Size: {selectedHOD.team_size} | Total Visits: {selectedHOD.total_visits}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Funnel size={14} className="text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Filters:</span>
                  </div>

                  <select
                    value={modalFilters.status}
                    onChange={(e) => setModalFilters({ ...modalFilters, status: e.target.value })}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm w-full max-h-[40rem]">
                  <Table className="table-auto border-collapse">
                    <TableHeader className="text-nowrap sticky top-0 text-xs z-10">
                      <TableHead className="p-2 text-gray-700 font-medium">Executive Name</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium">Employee Code</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-center">Total Visits</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-center">Completed</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-center">Pending</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-right">Order Value</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-center">Leads</TableHead>
                      <TableHead className="p-2 text-gray-700 font-medium text-center">Status</TableHead>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100">
                      {teamDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan="8" className="text-center py-6 text-gray-500 text-xs">
                            No team data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamDetails.map((member) => (
                          <TableRow key={member.executive_id} className="transition-all text-xs duration-200">
                            <TableCell className="py-2 px-3 text-xs font-medium text-gray-900">{member.executive_name}</TableCell>
                            <TableCell className="py-2 px-3 text-xs text-gray-700">{member.employee_code}</TableCell>
                            <TableCell className="py-2 px-3 text-center text-xs font-mono text-gray-700">{member.total_visits}</TableCell>
                            <TableCell className="py-2 px-3 text-center text-xs font-mono text-green-600">{member.completed_visits}</TableCell>
                            <TableCell className="py-2 px-3 text-center text-xs font-mono text-orange-600">{member.pending_visits}</TableCell>
                            <TableCell className="py-2 px-3 text-right text-xs font-mono text-gray-900">
                              {formatCurrency(member.order_value)}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleExecutiveLeadsClick(member)}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-200"
                              >
                                View Leads
                              </button>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                                  member.is_in_market
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {member.is_in_market ? 'In Market' : 'Offline'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Dialog open={showLeadsModal} onOpenChange={setShowLeadsModal}>
          <DialogContent className="max-w-6xl max-h-[88vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {selectedExecutive?.executive_name || 'Executive'} Leads
              </DialogTitle>
              <div className="text-xs text-slate-500 mt-1">
                {selectedHOD?.name || 'HOD Team'} lead details for the selected date range
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              <Card className="border border-blue-100 bg-blue-50/70 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-blue-800">Total Leads</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {teamLeadsData.summary?.total_leads || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-100 bg-emerald-50/70 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-emerald-800">Found</p>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    {teamLeadsData.summary?.found_leads || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-violet-100 bg-violet-50/70 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-violet-800">Assigned</p>
                  <p className="text-lg font-bold text-violet-900 mt-1">
                    {teamLeadsData.summary?.assigned_leads || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-amber-100 bg-amber-50/70 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-amber-800">Open</p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {teamLeadsData.summary?.open_leads || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 overflow-auto max-h-[34rem] pr-1 mt-3">
              {teamLeadsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
              ) : !teamLeadsData.leads?.length ? (
                <div className="text-center p-8 text-slate-500">
                  No leads found for this executive in the selected range.
                </div>
              ) : (
                <Table className="w-full text-left min-w-[900px]">
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow className="border-y border-gray-200">
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Lead Name</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Address</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-center text-gray-700">Type</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-center text-gray-700">Status</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Found By</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Assigned To</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Created</TableHead>
                      <TableHead className="px-3 py-2 bg-gray-100 text-gray-700">Assigned At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeadsData.leads.map((lead) => (
                      <TableRow key={lead.place_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="px-3 py-2 text-xs text-gray-900">{lead.place_name}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-700 max-w-sm truncate" title={lead.address}>
                          {lead.address || '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs text-center">
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {lead.lead_type}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs text-center">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                            lead.status === 'Assigned'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {lead.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-700">{lead.found_by_name || '—'}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-700">{lead.assigned_to_name || '—'}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{formatDateTime(lead.created_at)}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{formatDateTime(lead.assigned_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={metricDetailsOpen} onOpenChange={setMetricDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{metricDetails.title || 'HOD Report Details'}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto max-h-[34rem] pr-1 mt-2">
              {metricDetailsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
              ) : !metricDetails.rows?.length ? (
                <div className="text-center p-8 text-slate-500">
                  No details found for this metric.
                </div>
              ) : (
                <Table className="w-full text-left min-w-[760px]">
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow className="border-y border-gray-200">
                      {activeMetricColumns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={`${getCellClassName(column.align)} bg-gray-100 text-gray-700`}
                        >
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricDetails.rows.map((row) => (
                      <TableRow key={row.hod_id} className="border-b border-gray-100 hover:bg-gray-50">
                        {activeMetricColumns.map((column) => (
                          <TableCell
                            key={`${row.hod_id}-${column.key}`}
                            className={`${getCellClassName(column.align)} text-gray-800`}
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

export default HODReports;
