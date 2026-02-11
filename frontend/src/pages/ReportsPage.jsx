import { useState, useEffect, useCallback } from 'react';
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const ReportsPage = () => {
  const { getAuthHeader } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [executivePerformance, setExecutivePerformance] = useState([]);
  const [lostVisits, setLostVisits] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [marketSessions, setMarketSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Details Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionPotentials, setSessionPotentials] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchReportData = useCallback(async () => {
    try {
      const [dashRes, perfRes, lostRes, histRes, sessRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/executive-performance`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/lost-visits`, { headers: getAuthHeader() }),
        axios.get(`${API}/visits/history`, { headers: getAuthHeader() }),
        axios.get(`${API}/reports/market-sessions`, { headers: getAuthHeader() })
      ]);
      setDashboardStats(dashRes.data);
      setExecutivePerformance(perfRes.data);
      setLostVisits(lostRes.data);
      setVisitHistory(histRes.data);
      setMarketSessions(sessRes.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const viewSessionDetails = async (session) => {
      setSelectedSession(session);
      setIsDetailsOpen(true);
      setDetailsLoading(true);
      try {
          const res = await axios.get(`${API}/reports/market-sessions/${session.id}/potentials`, { headers: getAuthHeader() });
          setSessionPotentials(res.data);
      } catch (error) {
          console.error("Failed to fetch details", error);
          toast.error("Failed to load session details");
      } finally {
          setDetailsLoading(false);
      }
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const outcomeStats = {
    'Order Booked': visitHistory.filter(v => v.outcome === 'Order Booked').length,
    'Follow-up Required': visitHistory.filter(v => v.outcome === 'Follow-up Required').length,
    'No Meeting': visitHistory.filter(v => v.outcome === 'No Meeting').length,
    'Lost Visit': visitHistory.filter(v => v.outcome === 'Lost Visit').length
  };

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-4" data-testid="reports-page">
        {/* Page Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track performance and visit analytics</p>
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm whitespace-nowrap">Team</TabsTrigger>
            <TabsTrigger value="visits" className="text-xs sm:text-sm whitespace-nowrap">Visits</TabsTrigger>
            <TabsTrigger value="market_sessions" className="text-xs sm:text-sm whitespace-nowrap">Sessions</TabsTrigger>
            <TabsTrigger value="lost" className="text-xs sm:text-sm whitespace-nowrap">Lost</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Summary Stats - gradient cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">Total Visits</span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <Target className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono">{visitHistory.length}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">All time</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">Orders Booked</span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <TrendUp className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono">{outcomeStats['Order Booked']}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">{visitHistory.length > 0 ? Math.round(outcomeStats['Order Booked'] / visitHistory.length * 100) : 0}% conversion</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">Total Revenue</span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <CurrencyDollar className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono">₹{visitHistory.reduce((sum, v) => sum + (v.order_value || 0), 0).toLocaleString()}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">From orders</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/90">Lost Visits</span>
                    <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                      <Warning className="w-3.5 h-3.5" weight="fill" />
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono">{lostVisits.length}</div>
                  <p className="text-[10px] text-white/80 mt-0.5">Needs attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Outcome Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">Visit Outcomes Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(outcomeStats).map(([outcome, count]) => (
                    <div key={outcome} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-lg font-bold font-mono text-gray-800">{count}</p>
                      <p className="text-xs text-gray-500">{outcome}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="border-0 shadow-sm" data-testid="performance-table-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">Executive Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {executivePerformance.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">No performance data yet</p>
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
                                <p className="font-medium text-sm text-gray-800">{exec.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{exec.employee_code}</p>
                              </div>
                            </td>
                            <td className="font-mono text-xs">{exec.total_visits}</td>
                            <td className="font-mono text-xs">{exec.completed_visits}</td>
                            <td className="font-mono text-xs font-medium text-primary-600">₹{exec.total_orders.toLocaleString()}</td>
                            <td className="font-mono text-xs">{exec.avg_time_per_visit} min</td>
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
          <TabsContent value="visits" className="space-y-4">
            <Card className="border-0 shadow-sm" data-testid="visits-history-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {visitHistory.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">No visits recorded yet</p>
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
                            <td className="font-mono text-xs text-gray-600">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                            <td className="font-medium text-sm text-gray-800">{visit.dealer_name}</td>
                            <td className="font-mono text-xs text-gray-600">{new Date(visit.check_in_time).toLocaleTimeString()}</td>
                            <td className="font-mono text-xs text-gray-600">{visit.time_spent_minutes ? `${Math.round(visit.time_spent_minutes)} min` : '-'}</td>
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
              <CardContent>
                {lostVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <TrendUp className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500">Great! No lost visits recorded</p>
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
                            <td className="font-mono text-xs text-gray-600">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                            <td className="font-medium text-sm text-gray-800">{visit.dealer_name}</td>
                            <td className="text-xs text-gray-500">{visit.notes || 'No notes'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Market Sessions Tab */}
          <TabsContent value="market_sessions" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">Daily Market Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                  {dashboardStats && (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* We need to fetch sessions here or use dashboardStats if we added them there? 
                            Better to fetch them separately or in the main fetch. 
                            Let's assume we add `marketSessions` to the state. */}
                         {marketSessions.length === 0 ? (
                            <p className="text-center py-6 text-xs text-gray-500 col-span-3">No market sessions recorded</p>
                         ) : (
                            marketSessions.map(session => (
                              <Card key={session.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        session.end_time 
                                          ? 'bg-slate-100' 
                                          : 'bg-emerald-100 animate-pulse'
                                      }`}>
                                        {session.end_time ? (
                                          <div className="w-4 h-4 bg-slate-400 rounded-sm" /> 
                                        ) : (
                                          <div className="w-4 h-4 bg-emerald-500 rounded-full" /> 
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{session.user_name}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(session.start_time).toLocaleString()}</p>
                                      </div>
                                    </div>
                                    <Badge className={session.end_time ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}>
                                      {session.end_time ? 'Completed' : 'Active'}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-1.5">
                                       <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Shown</p>
                                        <p className="text-slate-700 font-bold">{session.potential_visits_count || 0}</p>
                                      </div>
                                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-emerald-600 mb-1 uppercase tracking-wider">Visited</p>
                                        <p className="text-emerald-700 font-bold">{session.visits_completed || 0}</p>
                                      </div>
                                      <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-red-600 mb-1 uppercase tracking-wider">Lost</p>
                                        <p className="text-red-700 font-bold">{session.calculated_lost_visits || 0}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-xs text-slate-400">
                                            {session.total_distance ? `${(session.total_distance / 1000).toFixed(1)} km` : '0 km'}
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-xs"
                                            onClick={() => viewSessionDetails(session)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                         )}
                      </div>
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
                <span>{selectedSession && new Date(selectedSession.start_time).toLocaleString()}</span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto overflow-x-auto pr-2 mt-4">
             {detailsLoading ? (
                 <div className="flex justify-center p-8"><div className="spinner" /></div>
             ) : sessionPotentials.length === 0 ? (
                 <div className="text-center p-8 text-slate-500">No details recorded for this session.</div>
             ) : (
                 <table className="w-full text-sm text-left min-w-[400px]">
                     <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0">
                         <tr>
                             <th className="px-2 sm:px-4 py-2">Place/Dealer</th>
                             <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">Address</th>
                             <th className="px-2 sm:px-4 py-2 text-right">Time Shown</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sessionPotentials.map((item) => (
                             <tr key={item.id} className="hover:bg-slate-50">
                                 <td className="px-2 sm:px-4 py-3 font-medium text-slate-700">
                                     <div className="flex items-center gap-2">
                                         <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                         <div>
                                           <span>{item.place_name}</span>
                                           <p className="text-[10px] text-slate-400 sm:hidden truncate max-w-[200px]">{item.address}</p>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-2 sm:px-4 py-3 text-slate-500 max-w-xs truncate hidden sm:table-cell" title={item.address}>
                                     {item.address}
                                 </td>
                                 <td className="px-2 sm:px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                                     {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
