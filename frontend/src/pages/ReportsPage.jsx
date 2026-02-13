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
  Warning,
  Eye
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const ROWS_PER_PAGE = 15;

const ReportsPage = () => {
  const { getAuthHeader } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [executivePerformance, setExecutivePerformance] = useState([]);
  const [lostVisits, setLostVisits] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [marketSessions, setMarketSessions] = useState([]);
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

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '–';
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

  const totalSessionsPages = Math.ceil(marketSessions.length / ROWS_PER_PAGE);
  const totalVisitsPages = Math.ceil(visitHistory.length / ROWS_PER_PAGE);
  const totalLostPages = Math.ceil(lostVisits.length / ROWS_PER_PAGE);

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
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                className={`h-7 w-7 text-xs p-0 ${currentPage === pageNum ? 'bg-primary-500 text-white' : ''}`}
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
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Date</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">User</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Dealer</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Contact</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Phone</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Check-in</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Duration</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Outcome</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-right">Order Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(visitHistory, visitsPage).map((visit) => (
                            <tr key={visit.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-700 truncate max-w-[100px]">{visit.user_name || '–'}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-gray-800 truncate max-w-[140px]">{visit.dealer_name}</td>
                              <td className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[100px]">{visit.contact_name || '–'}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{visit.contact_phone || '–'}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{new Date(visit.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 text-center">{visit.time_spent_minutes ? `${Math.round(visit.time_spent_minutes)}m` : '–'}</td>
                              <td className="px-2 py-1.5">
                                <Badge className={`text-[10px] px-1.5 py-0 ${
                                  visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                                  visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                                  visit.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {visit.outcome || 'In Progress'}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 font-mono text-[11px] font-medium text-primary-600 text-right">{visit.order_value ? `₹${visit.order_value.toLocaleString()}` : '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls currentPage={visitsPage} totalPages={totalVisitsPages} onPageChange={setVisitsPage} />
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
              <CardContent>
                {lostVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <TrendUp className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-500">Great! No lost visits recorded</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Date</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Dealer</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(lostVisits, lostPage).map((visit) => (
                            <tr key={visit.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{new Date(visit.check_in_time).toLocaleDateString()}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-gray-800">{visit.dealer_name}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-500 truncate max-w-[250px]">{visit.notes || 'No notes'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls currentPage={lostPage} totalPages={totalLostPages} onPageChange={setLostPage} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Market Sessions Tab */}
          <TabsContent value="market_sessions" className="space-y-4">
            <Card className="border-0 shadow-sm" data-testid="market-sessions-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-gray-800">Daily Market Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {marketSessions.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-500">No market sessions recorded</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">User</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Date</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Time</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Status</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Duration</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Distance</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Shown</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Visited</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Lost</th>
                            <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(marketSessions, sessionsPage).map((session) => (
                            <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-2 py-1.5 text-xs font-medium text-gray-800 truncate max-w-[120px]">{session.user_name}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{new Date(session.start_time).toLocaleDateString()}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{new Date(session.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                              <td className="px-2 py-1.5">
                                <Badge className={`text-[10px] px-1.5 py-0 ${session.end_time ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {session.end_time ? 'Done' : 'Active'}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 text-center">{formatDuration(session.start_time, session.end_time)}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 text-center">{session.total_distance ? `${(session.total_distance / 1000).toFixed(1)} km` : '–'}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] font-bold text-slate-700 text-center">{session.potential_visits_count || 0}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] font-bold text-emerald-700 text-center">{session.visits_completed || 0}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px] font-bold text-red-600 text-center">{session.calculated_lost_visits || 0}</td>
                              <td className="px-2 py-1.5 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                  onClick={() => viewSessionDetails(session)}
                                >
                                  <Eye className="w-3 h-3 mr-1" /> Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls currentPage={sessionsPage} totalPages={totalSessionsPages} onPageChange={setSessionsPage} />
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
                             <th className="px-2 sm:px-4 py-2 text-center">Status</th>
                             <th className="px-2 sm:px-4 py-2 text-right">Time Shown</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sessionPotentials.map((item) => (
                             <tr key={item.id} className={item.is_visited ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50'}>
                                 <td className="px-2 sm:px-4 py-3 font-medium text-slate-700">
                                     <div className="flex items-center gap-2">
                                         <MapPin className={`w-4 h-4 flex-shrink-0 ${item.is_visited ? 'text-emerald-500' : 'text-slate-400'}`} />
                                         <div>
                                           <span>{item.place_name}</span>
                                           <p className="text-[10px] text-slate-400 sm:hidden truncate max-w-[200px]">{item.address}</p>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-2 sm:px-4 py-3 text-slate-500 max-w-xs truncate hidden sm:table-cell" title={item.address}>
                                     {item.address}
                                 </td>
                                 <td className="px-2 sm:px-4 py-3 text-center">
                                     {item.is_visited ? (
                                         <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">Visited</Badge>
                                     ) : (
                                         <Badge className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0">Shown</Badge>
                                     )}
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
