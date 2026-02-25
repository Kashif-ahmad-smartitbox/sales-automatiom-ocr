import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  Users, 
  CalendarCheck,
  Target,
  Receipt,
  ListBullets,
  Check,
  X as XIcon,
  Clock,
  Warning,
  MapPin,
  CurrencyInr,
  ArrowRight,
  Plus,
  ChartBar,
  Eye,
  ChartPieSlice
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Outcome Color Map
const getOutcomeStyle = (outcome) => {
  switch (outcome) {
    case 'Order Booked':
    case 'Order Received':
      return { bg: 'bg-emerald-500', text: 'text-white', label: 'Order Booked' };
    case 'Follow-up Required':
      return { bg: 'bg-amber-400', text: 'text-white', label: 'Follow-up' };
    case 'Lost Visit':
      return { bg: 'bg-red-400', text: 'text-white', label: 'Last Visit' };
    case 'No Meeting':
      return { bg: 'bg-orange-400', text: 'text-white', label: 'No Meeting' };
    case 'Visited':
      return { bg: 'bg-blue-400', text: 'text-white', label: 'Visited' };
    default:
      return { bg: 'bg-gray-200', text: 'text-gray-700', label: outcome || 'Planned' };
  }
};

const getOutcomeIcon = (outcome) => {
  switch (outcome) {
    case 'Order Booked':
    case 'Order Received':
      return <Check className="w-4 h-4 text-emerald-600" weight="bold" />;
    case 'Follow-up Required':
      return <Clock className="w-4 h-4 text-amber-500" weight="bold" />;
    case 'Lost Visit':
      return <XIcon className="w-4 h-4 text-red-500" weight="bold" />;
    default:
      return <Warning className="w-4 h-4 text-orange-500" weight="bold" />;
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
};

const AdminDashboard = () => {
  const { getAuthHeader, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [dealerVisitsData, setDealerVisitsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, fieldTeamRes, activityRes, dealerVisitsRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/field-team`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/history?limit=10`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/dealer-visits?limit=20`, { headers: getAuthHeader() }),
      ]);
      setStats(statsRes.data);
      setExecutives(fieldTeamRes.data);
      setActivityLog(activityRes.data.slice(0, 10));
      setDealerVisitsData(dealerVisitsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Status is now pre-computed by backend (/reports/field-team)
  const getExecutiveStatus = (exec) => exec.status || 'Offline';

  // Use backend-computed summary stats
  // Today's stats for top cards
  const todaySummary = dealerVisitsData?.summary || {};
  const todayVisitsCount   = todaySummary.today_visits   || 0;
  const todayActiveVisits  = todaySummary.active_visits  || 0;
  
  // All-time stats for Progress and Performance sections
  const allTimeSummary = dealerVisitsData?.all_time_summary || {};
  const totalVisitsCount   = allTimeSummary.total_visits   || 0;
  const totalRevenue       = allTimeSummary.total_revenue   || 0;
  const totalDistanceKm    = allTimeSummary.total_distance_km || 0;
  const activeVisitsCount  = allTimeSummary.active_visits  || 0;
  const completedVisitsCount = allTimeSummary.completed_visits || 0;
  const missedVisitsCount  = allTimeSummary.missed_visits   || 0;

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-4 pb-20 md:pb-4" data-testid="admin-dashboard">
        {/* Header */}
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Real-time field sales tracking and analytics</p>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {/* Active Field Reps */}
          <div className="rounded-2xl p-3 md:p-5 text-white flex flex-col justify-between min-h-[110px] md:min-h-[130px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] md:text-sm font-semibold opacity-90 leading-tight">Active Field Reps</p>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                <Users size={14} weight="bold" className="md:hidden" />
                <Users size={18} weight="bold" className="hidden md:block" />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black leading-none">{stats?.active_executives || 0}
                <span className="text-base md:text-xl font-semibold opacity-80"> /{stats?.total_executives || 0}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 md:mt-2 text-[10px] md:text-sm opacity-80">
                <Users size={11} weight="bold" />
                <span>active reps</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10"></div>
          </div>

          {/* Visits Today */}
          <div className="rounded-2xl p-3 md:p-5 text-white flex flex-col justify-between min-h-[110px] md:min-h-[130px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] md:text-sm font-semibold opacity-90 leading-tight">Visits Today</p>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                <Clock size={14} weight="bold" className="md:hidden" />
                <Clock size={18} weight="bold" className="hidden md:block" />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black leading-none">{stats?.visits_today || 0}
                <span className="text-base md:text-xl font-semibold opacity-80"> /{stats?.target_visits || 0}</span>
              </div>
              <div className="flex items-center justify-between mt-1 md:mt-2">
                <div className="flex items-center gap-1 text-[10px] md:text-sm opacity-80">
                  <Check size={11} weight="bold" />
                  <span>Target</span>
                </div>
                <span className="text-[10px] md:text-sm font-bold bg-white/20 rounded-full px-1.5 md:px-2 py-0.5">
                  {stats?.visit_completion_rate || 0}%
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10"></div>
          </div>

          {/* Completion Rate */}
          <div className="rounded-2xl p-3 md:p-5 text-white flex flex-col justify-between min-h-[110px] md:min-h-[130px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] md:text-sm font-semibold opacity-90 leading-tight">Completion Rate</p>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                <ChartBar size={14} weight="bold" className="md:hidden" />
                <ChartBar size={18} weight="bold" className="hidden md:block" />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black leading-none">{stats?.visit_completion_rate || 0}%</div>
              <div className="text-[10px] md:text-sm opacity-80 mt-1 md:mt-2">of daily target</div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10"></div>
          </div>

          {/* Orders Today */}
          <div className="rounded-2xl p-3 md:p-5 text-white flex flex-col justify-between min-h-[110px] md:min-h-[130px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] md:text-sm font-semibold opacity-90 leading-tight">Orders Today</p>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                <CurrencyInr size={14} weight="bold" className="md:hidden" />
                <CurrencyInr size={18} weight="bold" className="hidden md:block" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-3xl font-black leading-none">
                ₹{(stats?.total_order_value || 0).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between mt-1 md:mt-2">
                <span className="text-[10px] md:text-sm opacity-80">{stats?.orders_today || 0} Orders</span>
                <span className="text-[10px] md:text-sm font-bold bg-white/20 rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">
                  {stats?.orders_today || 0}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10"></div>
          </div>
        </div>

        {/* ─── MIDDLE ROW: All-Time Progress | Field Team | Dealer Visits ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* Activity Log (commented out for now) */}
          {/*
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" data-testid="activity-log-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ListBullets size={16} className="text-orange-500" weight="bold" />
                </div>
                <span className="font-bold text-gray-900 text-sm">Activity Log</span>
              </div>
              <span className="text-xs text-gray-400">Recent {activityLog.length} activities</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {activityLog.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No recent activities</p>
              ) : (
                activityLog.map((activity) => {
                  const outcomeStyle = getOutcomeStyle(activity.outcome);
                  return (
                    <div key={activity.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {getOutcomeIcon(activity.outcome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-xs text-gray-900 truncate">{activity.dealer_name || 'Unknown Dealer'}</p>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatTimeAgo(activity.check_in_time)}</span>
                          </div>
                          {activity.outcome && (
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${outcomeStyle.bg} ${outcomeStyle.text}`}>
                              {outcomeStyle.label}
                            </span>
                          )}
                          {activity.order_value > 0 && (
                            <div className="text-xs font-bold text-emerald-600 mt-1">
                              ₹{activity.order_value.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          */}

          {/* All-Time Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" data-testid="all-time-progress-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ChartPieSlice size={16} className="text-orange-500" weight="bold" />
                </div>
                <span className="font-bold text-gray-900 text-sm">All-Time Progress</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="text-xl font-black text-gray-900">{totalVisitsCount}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Total Visits</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="text-xl font-black text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Total Revenue</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="text-xl font-black text-gray-900">{activeVisitsCount}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Active Visits</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="text-xl font-black text-blue-600">{totalDistanceKm} km</div>
                  <div className="text-xs text-gray-400 mt-0.5">Distance Covered</div>
                </div>
              </div>
            </div>
          </div>

          {/* Field Team */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" data-testid="team-status-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users size={16} className="text-orange-500" weight="bold" />
                </div>
                <span className="font-bold text-gray-900 text-sm">Field Team</span>
              </div>
            </div>
            
            {/* Executives List */}
            <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto">
              {executives.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No field executives found</p>
              ) : (
                executives.map((exec) => {
                  const status = getExecutiveStatus(exec);
                  const initials = exec.name?.charAt(0)?.toUpperCase() || '?';
                  const avatarColor = status === 'Active' ? 'bg-emerald-500' : status === 'Idle' ? 'bg-amber-400' : 'bg-gray-400';
                  const badgeCls = status === 'Active' ? 'bg-emerald-100 text-emerald-700' : status === 'Idle' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';
                  return (
                    <div key={exec.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-gray-900">{exec.name}</p>
                            <p className="text-xs text-gray-400">{exec.employee_code}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>{status}</span>
                      </div>
                      {/* Per-rep stats row */}
                      <div className="flex items-center gap-3 mt-2 ml-12">
                        <div className="flex items-center gap-1">
                          <CalendarCheck size={11} className="text-orange-400" weight="bold" />
                          <span className="text-xs text-gray-600 font-medium">{exec.today_visits || 0} visits</span>
                        </div>
                        {exec.today_revenue > 0 && (
                          <div className="flex items-center gap-1">
                            <CurrencyInr size={11} className="text-emerald-500" weight="bold" />
                            <span className="text-xs text-emerald-600 font-bold">₹{exec.today_revenue.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {exec.active_visits > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">{exec.active_visits} active</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>


            {/* Progress Section (moved to All-Time Progress card) */}
          </div>

          {/* Dealer Visits */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-sm">Dealer Visits</span>
              {/* <button className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <Plus size={12} weight="bold" />
                Add Visit
              </button> */}
            </div>
            
            {/* Column Headers */}
            <div className="grid grid-cols-4 gap-1 px-4 py-2 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-400">Dealer</span>
              <span className="text-xs font-semibold text-gray-400">Territory</span>
              <span className="text-xs font-semibold text-gray-400">Status</span>
              <span className="text-xs font-semibold text-gray-400">Rep</span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {!dealerVisitsData?.visits || dealerVisitsData.visits.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No dealer visits found</p>
              ) : (
                dealerVisitsData.visits.slice(0, 8).map((visit) => {
                  const outcomeStyle = getOutcomeStyle(visit.outcome);
                  const repInitials = (visit.rep_name || 'U').charAt(0).toUpperCase();
                  return (
                    <div key={visit.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-4 gap-1 items-center">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 truncate">{visit.dealer_name}</p>
                          {visit.territory && visit.territory !== 'N/A' && (
                            <p className="text-xs text-gray-400 truncate">{visit.territory}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate">{visit.territory || 'N/A'}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full text-center truncate ${outcomeStyle.bg} ${outcomeStyle.text}`}>
                          {outcomeStyle.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {repInitials}
                          </div>
                          <span className="text-xs text-gray-600 truncate">{visit.rep_name}</span>
                        </div>
                      </div>
                      {visit.duration_formatted && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock size={10} className="text-amber-500" weight="bold" />
                          <span className="text-xs text-amber-600 font-medium">{visit.duration_formatted}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ─── PERFORMANCE STATS ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <ChartBar size={18} className="text-emerald-600" weight="bold" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Performance Stats</p>
                  <p className="text-xs text-gray-400">All-Time Field Performance Overview</p>
                </div>
              </div>
              
              {/* Summary Pills */}
              <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
                <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                    <Check size={10} className="text-white" weight="bold" />
                  </div>
                  <span className="text-xs font-bold text-orange-700">{totalVisitsCount}</span>
                  <span className="text-xs text-gray-500">Total Visits</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-3 py-1.5">
                  <CurrencyInr size={14} className="text-emerald-600" weight="bold" />
                  <span className="text-xs font-bold text-emerald-700">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-500">Total Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1.5">
                  <MapPin size={14} className="text-blue-600" weight="bold" />
                  <span className="text-xs font-bold text-blue-700">{totalDistanceKm} km</span>
                  <span className="text-xs text-gray-500">Total Distance</span>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 rounded-full px-3 py-1.5">
                  <Users size={14} className="text-green-600" weight="bold" />
                  <span className="text-xs font-bold text-green-700">{activeVisitsCount}</span>
                  <span className="text-xs text-gray-500">Active Now</span>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-50 rounded-full px-3 py-1.5">
                  <Check size={14} className="text-teal-600" weight="bold" />
                  <span className="text-xs font-bold text-teal-700">{completedVisitsCount}</span>
                  <span className="text-xs text-gray-500">Completed</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 rounded-full px-3 py-1.5">
                  <XIcon size={14} className="text-red-500" weight="bold" />
                  <span className="text-xs font-bold text-red-600">{missedVisitsCount}</span>
                  <span className="text-xs text-gray-500">Missed</span>
                </div>
                <button className="flex items-center gap-1.5 bg-gray-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-gray-800 transition-colors">
                  View All <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-0">
            {(!dealerVisitsData?.visits || dealerVisitsData.visits.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-10">No visit data available</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Next Visit</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Dealer</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Territory</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Distance</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Duration</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Rep</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerVisitsData.visits.slice(0, 10).map((visit, idx) => {
                    const outcomeStyle = getOutcomeStyle(visit.outcome);
                    return (
                      <tr key={visit.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-600">
                            {visit.next_visit_date ? formatDate(visit.next_visit_date) : formatDate(visit.check_in_time)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-900 max-w-[130px] truncate">{visit.dealer_name}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-gray-600">{visit.territory || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${outcomeStyle.bg} ${outcomeStyle.text}`}>
                            {visit.check_out_time ? outcomeStyle.label : 'In Progress'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{visit.distance_km ? `${visit.distance_km} km` : '-'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{visit.duration_formatted || '-'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(visit.rep_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-700">{visit.rep_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {visit.order_value > 0 && (
                              <span className="text-xs font-bold text-emerald-600">₹{visit.order_value.toLocaleString('en-IN')}</span>
                            )}
                            {!visit.check_out_time && (
                              <span className="text-xs text-gray-400">Active</span>
                            )}
                            {visit.check_out_time && !visit.order_value && (
                              <span className="text-xs text-gray-400">{outcomeStyle.label}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
