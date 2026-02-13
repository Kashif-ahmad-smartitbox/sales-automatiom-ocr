import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Storefront, 
  MapPin, 
  ChartLineUp,
  Target,
  Clock,
  CurrencyDollar,
  ArrowRight,
  ListBullets,
  Check,
  X as XIcon,
  Warning
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, execsRes, visitsRes, activityRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/tracking/live`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/today`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/history?limit=10`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setExecutives(execsRes.data);
      setTodayVisits(visitsRes.data);
      setActivityLog(activityRes.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const getExecutiveStatus = (exec) => {
    if (exec.is_in_market) return 'active';
    if (exec.last_location_update) {
      const lastUpdate = new Date(exec.last_location_update);
      const now = new Date();
      const diffMinutes = (now - lastUpdate) / (1000 * 60);
      if (diffMinutes < 30) return 'idle';
    }
    return 'offline';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'Order Booked': return <Check className="w-4 h-4 text-emerald-600" weight="bold" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Lost Visit': return <XIcon className="w-4 h-4 text-red-600" weight="bold" />;
      case 'No Meeting': return <Warning className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-primary-600" />;
    }
  };

  const statCards = [
    { 
      icon: Users, 
      label: 'Active Field Reps', 
      value: stats?.active_executives || 0,
      subtext: `of ${stats?.total_executives || 0} total`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { 
      icon: Target, 
      label: 'Visits Today', 
      value: stats?.visits_today || 0,
      subtext: `Target: ${stats?.target_visits || 0}`,
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    { 
      icon: ChartLineUp, 
      label: 'Completion Rate', 
      value: `${stats?.visit_completion_rate || 0}%`,
      subtext: 'of daily target',
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    { 
      icon: CurrencyDollar, 
      label: 'Orders Today', 
      value: `₹${(stats?.total_order_value || 0).toLocaleString()}`,
      subtext: 'total order value',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
  ];


  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-4" data-testid="admin-dashboard">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Real-time field sales tracking and analytics</p>
        </div>

        {/* Stats Grid - Smart CA gradient cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, idx) => (
            <Card key={idx} className={`border-0 shadow-md transition-all duration-300 hover:shadow-lg ${
              idx === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600' :
              idx === 1 ? 'bg-gradient-to-br from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600' :
              idx === 2 ? 'bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600' :
              'bg-gradient-to-br from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600'
            } text-white`} data-testid={`stat-card-${idx}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/90">{stat.label}</span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <stat.icon className="w-3.5 h-3.5" weight="duotone" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono">{stat.value}</div>
                <p className="text-[10px] text-white/80 mt-0.5">{stat.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Activity Log */}
          <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm" data-testid="activity-log-card">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500">
                    <ListBullets size={14} className="text-white" weight="fill" />
                  </div>
                  Activity Log
                </CardTitle>
                <span className="text-[10px] text-gray-500">Recent 10 activities</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {activityLog.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No recent activities</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                      <div className="mt-0.5">
                        {getOutcomeIcon(activity.outcome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-xs text-gray-800 truncate">{activity.dealer_name || 'Unknown Dealer'}</p>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatTimeAgo(activity.check_in_time)}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 mb-1">
                          <span className="font-medium">{activity.user_name || 'Unknown'}</span>
                          {activity.check_in_time && (
                            <span className="text-gray-500 ml-2">
                              • {new Date(activity.check_in_time).toLocaleString()}
                            </span>
                          )}
                        </p>
                        {activity.outcome && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${
                            activity.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                            activity.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                            activity.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.outcome}
                          </Badge>
                        )}
                        {activity.order_value && (
                          <p className="text-[10px] font-medium text-primary-600 mt-1">
                            Order: ₹{activity.order_value.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Team Status */}
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm" data-testid="team-status-card">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                  <Users size={14} className="text-white" weight="fill" />
                </div>
                Field Team
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2 max-h-[350px] overflow-auto custom-scrollbar">
                {executives.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No sales executives added yet</p>
                ) : (
                  executives.map((exec) => {
                    const status = getExecutiveStatus(exec);
                    return (
                      <div key={exec.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                            {exec.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-xs text-gray-800">{exec.name}</p>
                            <p className="text-[10px] text-gray-500">{exec.employee_code}</p>
                          </div>
                        </div>
                        <Badge className={`${status === 'active' ? 'status-active' : status === 'idle' ? 'status-idle' : 'status-offline'}`}>
                          {status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Visits */}
        <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm" data-testid="today-visits-card">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500">
                  <Target size={14} className="text-white" weight="fill" />
                </div>
                Today's Visits
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 h-auto py-1 px-2">
                View All <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayVisits.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No visits recorded today</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dealer</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayVisits.slice(0, 10).map((visit) => (
                      <tr key={visit.id}>
                        <td className="font-medium text-sm text-gray-800">{visit.dealer_name}</td>
                        <td className="font-mono text-xs text-gray-600">{new Date(visit.check_in_time).toLocaleTimeString()}</td>
                        <td className="font-mono text-xs text-gray-600">{visit.check_out_time ? new Date(visit.check_out_time).toLocaleTimeString() : '-'}</td>
                        <td className="text-xs text-gray-600">{visit.time_spent_minutes ? `${Math.round(visit.time_spent_minutes)} min` : '-'}</td>
                        <td>
                          <Badge className={
                            visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                            visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                            visit.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {visit.outcome || 'In Progress'}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs font-medium text-primary-600">{visit.order_value ? `₹${visit.order_value.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
