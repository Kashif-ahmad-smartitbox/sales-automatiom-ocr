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
  ArrowRight
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom marker icons
const createIcon = (color) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const activeIcon = createIcon('#10b981');
const idleIcon = createIcon('#f59e0b');
const offlineIcon = createIcon('#94a3b8');
const dealerIcon = createIcon('#2563eb');

const AdminDashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, execsRes, visitsRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/tracking/live`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/today`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setExecutives(execsRes.data);
      setTodayVisits(visitsRes.data);
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

  // Get map center from executives or default to India
  const mapCenter = executives.find(e => e.current_location)?.current_location 
    ? [executives.find(e => e.current_location).current_location.lat, executives.find(e => e.current_location).current_location.lng]
    : [19.076, 72.877]; // Mumbai default

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
          {/* Live Map */}
          <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm" data-testid="live-map-card">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500">
                    <MapPin size={14} className="text-white" weight="fill" />
                  </div>
                  Live Tracking
                </CardTitle>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Idle
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Offline
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="map-container h-[350px]">
                <MapContainer 
                  center={mapCenter} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {executives.filter(e => e.current_location).map((exec) => {
                    const status = getExecutiveStatus(exec);
                    const icon = status === 'active' ? activeIcon : status === 'idle' ? idleIcon : offlineIcon;
                    return (
                      <Marker 
                        key={exec.id} 
                        position={[exec.current_location.lat, exec.current_location.lng]}
                        icon={icon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{exec.name}</p>
                            <p className="text-slate-500">{exec.employee_code}</p>
                            <Badge className={`mt-1 ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'idle' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                              {status}
                            </Badge>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
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
