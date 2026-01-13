import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ChartBar, 
  Users, 
  Target, 
  TrendUp,
  TrendDown,
  Clock,
  CurrencyDollar,
  MapPin,
  Warning
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReportsPage = () => {
  const { getAuthHeader } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [executivePerformance, setExecutivePerformance] = useState([]);
  const [lostVisits, setLostVisits] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [dashRes, perfRes, lostRes, histRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/executive-performance`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/lost-visits`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/history`, { headers: getAuthHeader() })
      ]);
      setDashboardStats(dashRes.data);
      setExecutivePerformance(perfRes.data);
      setLostVisits(lostRes.data);
      setVisitHistory(histRes.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const outcomeStats = {
    'Order Booked': visitHistory.filter(v => v.outcome === 'Order Booked').length,
    'Follow-up Required': visitHistory.filter(v => v.outcome === 'Follow-up Required').length,
    'No Meeting': visitHistory.filter(v => v.outcome === 'No Meeting').length,
    'Lost Visit': visitHistory.filter(v => v.outcome === 'Lost Visit').length
  };

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6" data-testid="reports-page">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Team Performance</TabsTrigger>
            <TabsTrigger value="visits">Visit Analysis</TabsTrigger>
            <TabsTrigger value="lost">Lost Visits</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="stats-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Visits</p>
                      <p className="text-2xl font-bold font-mono">{visitHistory.length}</p>
                      <p className="text-xs text-slate-400 mt-1">All time</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Target className="w-5 h-5 text-blue-600" weight="duotone" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Orders Booked</p>
                      <p className="text-2xl font-bold font-mono text-emerald-600">{outcomeStats['Order Booked']}</p>
                      <p className="text-xs text-slate-400 mt-1">{visitHistory.length > 0 ? Math.round(outcomeStats['Order Booked'] / visitHistory.length * 100) : 0}% conversion</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <TrendUp className="w-5 h-5 text-emerald-600" weight="duotone" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Revenue</p>
                      <p className="text-2xl font-bold font-mono">₹{visitHistory.reduce((sum, v) => sum + (v.order_value || 0), 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1">From orders</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50">
                      <CurrencyDollar className="w-5 h-5 text-purple-600" weight="duotone" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Lost Visits</p>
                      <p className="text-2xl font-bold font-mono text-red-600">{lostVisits.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Needs attention</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50">
                      <Warning className="w-5 h-5 text-red-600" weight="duotone" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Outcome Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Outcomes Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(outcomeStats).map(([outcome, count]) => (
                    <div key={outcome} className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold font-mono">{count}</p>
                      <p className="text-sm text-slate-500">{outcome}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card data-testid="performance-table-card">
              <CardHeader>
                <CardTitle className="text-lg">Executive Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {executivePerformance.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No performance data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Executive</th>
                          <th>Total Visits</th>
                          <th>Completed</th>
                          <th>Orders Value</th>
                          <th>Avg Time/Visit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executivePerformance.map((exec) => (
                          <tr key={exec.id}>
                            <td>
                              <div>
                                <p className="font-medium">{exec.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{exec.employee_code}</p>
                              </div>
                            </td>
                            <td className="font-mono">{exec.total_visits}</td>
                            <td className="font-mono">{exec.completed_visits}</td>
                            <td className="font-mono">₹{exec.total_orders.toLocaleString()}</td>
                            <td className="font-mono">{exec.avg_time_per_visit} min</td>
                            <td>
                              <Badge className={exec.is_in_market ? 'status-active' : 'status-offline'}>
                                {exec.is_in_market ? 'In Field' : 'Offline'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit Analysis Tab */}
          <TabsContent value="visits" className="space-y-6">
            <Card data-testid="visits-history-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {visitHistory.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No visits recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Dealer</th>
                          <th>Check-in</th>
                          <th>Duration</th>
                          <th>Outcome</th>
                          <th>Order Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitHistory.slice(0, 50).map((visit) => (
                          <tr key={visit.id}>
                            <td className="font-mono text-sm">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                            <td className="font-medium">{visit.dealer_name}</td>
                            <td className="font-mono text-sm">{new Date(visit.check_in_time).toLocaleTimeString()}</td>
                            <td className="font-mono">{visit.time_spent_minutes ? `${Math.round(visit.time_spent_minutes)} min` : '-'}</td>
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
          </TabsContent>

          {/* Lost Visits Tab */}
          <TabsContent value="lost" className="space-y-6">
            <Card data-testid="lost-visits-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Warning className="text-red-500" weight="fill" />
                  Lost Visits Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lostVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <TrendUp className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-500">Great! No lost visits recorded</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Dealer</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lostVisits.map((visit) => (
                          <tr key={visit.id}>
                            <td className="font-mono text-sm">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                            <td className="font-medium">{visit.dealer_name}</td>
                            <td className="text-slate-500">{visit.notes || 'No notes'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
