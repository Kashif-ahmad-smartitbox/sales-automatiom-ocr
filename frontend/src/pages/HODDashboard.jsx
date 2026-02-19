import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import HODLayout from '../components/layout/HODLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  ChartLineUp,
  Target,
  CurrencyDollar,
  ListBullets,
  Check,
  X as XIcon,
  Clock,
  Warning
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODDashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, execsRes, visitsRes, activityRes] = await Promise.all([
        axios.get(`${API}/hod/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/hod/tracking/live`, { headers: getAuthHeader() }),
        axios.get(`${API}/hod/visits/today`, { headers: getAuthHeader() }),
        axios.get(`${API}/hod/visits/history?limit=10`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setExecutives(execsRes.data);
      setTodayVisits(visitsRes.data);
      setActivityLog(activityRes.data);
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
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
      label: 'My Team', 
      value: stats?.total_executives || 0,
      subtext: `${stats?.active_executives || 0} active now`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      gradient: 'from-emerald-400 to-emerald-500'
    },
    { 
      icon: Target, 
      label: 'Visits Today', 
      value: stats?.visits_today || 0,
      subtext: `Target: ${stats?.target_visits || 0}`,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      gradient: 'from-primary-400 to-primary-500'
    },
    { 
      icon: ChartLineUp, 
      label: 'Completion Rate', 
      value: `${stats?.visit_completion_rate || 0}%`,
      subtext: 'of daily target',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      gradient: 'from-amber-400 to-amber-500'
    },
    { 
      icon: CurrencyDollar, 
      label: 'Orders Today', 
      value: `₹${(stats?.total_order_value || 0).toLocaleString()}`,
      subtext: 'total order value',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      gradient: 'from-purple-400 to-purple-500'
    },
  ];

  return (
    <HODLayout title="Dashboard">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            HOD Dashboard
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Monitor your team's field sales performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, idx) => (
            <Card key={idx} className={`border-0 shadow-md transition-all duration-300 hover:shadow-lg bg-gradient-to-br ${stat.gradient} text-white`}>
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
          <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500">
                    <ListBullets size={14} className="text-white" weight="fill" />
                  </div>
                  Team Activity
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
                        <Badge variant="outline" className={
                          activity.outcome === 'Order Booked' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]' :
                          activity.outcome === 'Follow-up Required' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[9px]' :
                          activity.outcome === 'Lost Visit' ? 'bg-red-50 text-red-700 border-red-200 text-[9px]' :
                          'bg-slate-50 text-slate-700 border-slate-200 text-[9px]'
                        }>
                          {activity.outcome || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                  <Users size={14} className="text-white" weight="fill" />
                </div>
                Team Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                {executives.map((exec) => {
                  const status = getExecutiveStatus(exec);
                  return (
                    <div key={exec.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}>
                        {exec.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{exec.name}</p>
                        <p className="text-[10px] text-gray-500">{exec.employee_code}</p>
                      </div>
                      <Badge className={
                        status === 'active' ? 'status-active text-[9px]' : 
                        status === 'idle' ? 'status-idle text-[9px]' : 
                        'status-offline text-[9px]'
                      }>
                        {status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HODLayout>
  );
};

export default HODDashboard;
