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
      color: 'text-blue-600',
      bg: 'bg-blue-50'
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
      <div className="space-y-6" data-testid="admin-dashboard">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <Card key={idx} className="stats-card" data-testid={`stat-card-${idx}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold font-mono">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} weight="duotone" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Map */}
          <Card className="lg:col-span-2" data-testid="live-map-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Tracking</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Idle
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="map-container h-[400px]">
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
          <Card data-testid="team-status-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Field Team Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {executives.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No sales executives added yet</p>
                ) : (
                  executives.map((exec) => {
                    const status = getExecutiveStatus(exec);
                    return (
                      <div key={exec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                            {exec.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{exec.name}</p>
                            <p className="text-xs text-slate-500">{exec.employee_code}</p>
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
        <Card data-testid="today-visits-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today's Visits</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayVisits.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No visits recorded today</p>
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
                        <td className="font-medium">{visit.dealer_name}</td>
                        <td className="font-mono text-sm">{new Date(visit.check_in_time).toLocaleTimeString()}</td>
                        <td className="font-mono text-sm">{visit.check_out_time ? new Date(visit.check_out_time).toLocaleTimeString() : '-'}</td>
                        <td>{visit.time_spent_minutes ? `${Math.round(visit.time_spent_minutes)} min` : '-'}</td>
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
                        <td className="font-mono">{visit.order_value ? `₹${visit.order_value.toLocaleString()}` : '-'}</td>
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
