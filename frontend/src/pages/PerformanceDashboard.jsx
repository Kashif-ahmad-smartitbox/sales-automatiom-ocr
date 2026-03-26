import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Pencil,
  ArrowUp,
  ArrowDown,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProgressBar = ({ value, colorClass }) => (
  <div className="flex items-center gap-2">
    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${colorClass}`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-xs font-bold text-gray-700 w-10 text-right">{value}%</span>
  </div>
);

const PerformanceDashboard = () => {
  const { getAuthHeader, user } = useAuth();
  const [data, setData] = useState({ kpis: {}, table: [] });
  const [loading, setLoading] = useState(true);
  
  const [timePeriod, setTimePeriod] = useState("All Time");
  const [adminFilter, setAdminFilter] = useState("all");
  const [compareUsers, setCompareUsers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiDetailsData, setKpiDetailsData] = useState([]);
  const [kpiDetailsLoading, setKpiDetailsLoading] = useState(false);
  const [kpiPageInfo, setKpiPageInfo] = useState({ page: 1, totalPages: 1, totalItems: 0 });

  const handleKpiClick = async (type, title, targetPage = 1) => {
    setSelectedKpi({ type, title });
    setKpiDetailsLoading(true);

    try {
      let url = `${API}/reports/performance-details?time_period=${timePeriod}&kpi_type=${type}&page=${targetPage}&limit=15`;
      if (adminFilter !== "all" && user?.role === 'company_admin') {
        url += `&admin_id=${adminFilter}`;
      }
      const res = await axios.get(url, { headers: getAuthHeader() });
      setKpiDetailsData(res.data.data || []);
      setKpiPageInfo({
        page: res.data.currentPage || 1,
        totalPages: res.data.totalPages || 1,
        totalItems: res.data.totalItems || 0
      });
    } catch (e) {
      console.error(e);
      setKpiDetailsData([]);
    } finally {
      setKpiDetailsLoading(false);
    }
  };

  // Fetch HODs for admin filter if user is superadmin
  useEffect(() => {
    if (user?.role === 'company_admin') {
      const fetchAdmins = async () => {
        try {
          const res = await axios.get(`${API}/users?role=hod`, { headers: getAuthHeader() });
          setAdmins(res.data || []);
        } catch (error) {
          console.error("Failed to fetch admins:", error);
        }
      };
      fetchAdmins();
    }
  }, [user, getAuthHeader]);

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/reports/performance-dashboard?time_period=${timePeriod}`;
      if (adminFilter !== "all" && user?.role === 'company_admin') {
        url += `&admin_id=${adminFilter}`;
      }
      
      const res = await axios.get(url, { headers: getAuthHeader() });
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, timePeriod, adminFilter, user]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Handle local comparison filtering
  const tableData = compareUsers.length > 0 
    ? data.table.filter(t => compareUsers.includes(t.id))
    : data.table;

  return (
    <AdminLayout title="Performance Dashboard">
      <div className="space-y-2 pb-20 md:pb-6" data-testid="performance-dashboard">
        
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare and analyze user performance metrics
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Time Period</label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm focus:ring-orange-500 rounded-lg">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="All Time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user?.role === 'company_admin' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Filter by Admin</label>
                <Select value={adminFilter} onValueChange={setAdminFilter}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm focus:ring-orange-500 rounded-lg">
                    <SelectValue placeholder="All Admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    {admins.map(admin => (
                      <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Add User to Compare</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal bg-white border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-orange-500">
                    {compareUsers.length === 0 ? "All Users" : `${compareUsers.length} Users Selected`}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px] max-h-64 overflow-y-auto" align="end">
                  <DropdownMenuItem 
                    onClick={() => setCompareUsers([])}
                    className="cursor-pointer font-semibold text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                  >
                    Clear Selection (All Users)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {data.table.map(u => (
                    <DropdownMenuCheckboxItem
                      key={u.id}
                      checked={compareUsers.includes(u.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCompareUsers([...compareUsers, u.id]);
                        } else {
                          setCompareUsers(compareUsers.filter(id => id !== u.id));
                        }
                      }}
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      {u.user}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Top KPI Cards */}
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
             {[1,2,3,4,5,6].map(i => <div key={i} className="h-[110px] bg-gray-100 animate-pulse rounded-2xl"></div>)}
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1 */}
            <Card 
              className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('executives', 'Total Executives')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Total Executives
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <Users className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {data.kpis.total_users || 0}
                </div>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card 
              className="border-0 bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('target', 'Target Visits')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Target Visits
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <Target className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {data.kpis.total_target_visits || 0}
                </div>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card 
              className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('completed', 'Completed Visits')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Completed
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {data.kpis.total_completed_visits || 0}
                </div>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card 
              className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('missed', 'Missed Visits')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Missed Visits
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <AlertTriangle className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {data.kpis.total_missed_visits || 0}
                </div>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card 
              className="border-0 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('completion', 'Avg Completion Rate')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Avg Completion %
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {data.kpis.avg_completion_rate || 0}%
                </div>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card 
              className="border-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleKpiClick('revenue', 'Overall Revenue')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/90">
                    Overall Revenue
                  </span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold">
                  ₹{(data.kpis.overall_revenue || 0).toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Performance Table */}
        <Card className="border-0 shadow-sm" data-testid="performance-table-card">
          <CardHeader className="pb-3 border-b border-gray-100 mb-2">
            <CardTitle className="text-sm font-bold text-gray-800">
              Executive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pb-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-200">
                <tr className="border-y border-gray-200">
                  <th className="text-xs text-gray-500 font-semibold px-2 py-2 border-r border-gray-200 w-8 text-center">#</th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 border-r border-gray-200 flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors">Executive <ArrowUp size={12}/></th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 border-r border-gray-200 text-center">Target Visits</th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 border-r border-gray-200 text-center">Visit % Load</th>
                  <th className="text-xs text-emerald-600 font-semibold px-3 py-2 border-r border-gray-200 text-center">Completed</th>
                  <th className="text-xs text-amber-600 font-semibold px-3 py-2 border-r border-gray-200 text-center">Active</th>
                  <th className="text-xs text-red-600 font-semibold px-3 py-2 border-r border-gray-200 text-center">Missed</th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 border-r border-gray-200">Completion %</th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 border-r border-gray-200">Conversion %</th>
                  <th className="text-xs text-emerald-600 font-semibold px-3 py-2 border-r border-gray-200 text-right">Revenue</th>
                  <th className="text-xs text-gray-500 font-semibold px-3 py-2 text-right">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="py-10 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-gray-500">Loading metrics...</span>
                      </div>
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-10 text-center text-gray-500 font-medium">
                      No data available for the selected period
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 group">
                      <td className="px-2 py-2 border-r border-gray-100 text-[11px] font-medium text-gray-600 text-center">
                        {row.rank}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${
                            row.rank === 1 ? 'bg-amber-400' :
                            row.rank === 2 ? 'bg-gray-400' :
                            row.rank === 3 ? 'bg-orange-400' : 'bg-primary-500'
                          }`}>
                            {(row.user || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[12px] text-gray-900">{row.user}</p>
                            <div className="flex items-center mt-[1px]">
                              {row.rank <= 3 && (
                                <span className="text-[8px] font-bold px-1 py-[1px] rounded-sm bg-primary-50 text-primary-600 border border-primary-100 uppercase">
                                  Top Performer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-xs font-semibold text-center text-gray-700">
                        {row.target_visits}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-center">
                        <span className="text-[11px] font-semibold text-gray-600">{row.total_load_percentage}%</span>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-xs text-center text-emerald-600 font-bold">
                        {row.completed_visits}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-center">
                        {row.active_visits > 0 ? (
                          <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{row.active_visits}</span>
                        ) : (
                          <span className="text-gray-400 font-medium text-[11px]">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-center">
                        {row.missed_visits > 0 ? (
                          <span className="bg-red-50 text-red-600 border border-red-100 font-bold px-1.5 flex items-center justify-center gap-1 py-0.5 rounded text-[10px] w-max mx-auto">
                            {row.missed_visits}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium text-[11px]">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100">
                        <ProgressBar value={row.completion_rate} colorClass="bg-emerald-500" />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100">
                        <ProgressBar value={row.conversion_rate} colorClass="bg-cyan-500" />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right">
                        <span className="text-xs font-bold text-emerald-600">₹{row.total_revenue.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs font-medium text-gray-700">{row.distance_km} km</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedKpi} onOpenChange={(open) => !open && setSelectedKpi(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border border-gray-100/50 shadow-2xl rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              {selectedKpi?.title} Details
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
             {kpiDetailsLoading ? (
               <div className="flex justify-center flex-col items-center gap-4 py-20">
                 <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-sm font-semibold text-gray-500">Loading {selectedKpi?.title}...</p>
               </div>
             ) : kpiDetailsData.length === 0 ? (
               <div className="text-center py-16 text-gray-500 text-sm bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
                 <AlertTriangle size={32} weight="fill" className="text-gray-300" />
                 <span className="font-semibold text-gray-600">No data available for this filter</span>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                   <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                     <thead>
                       <tr className="bg-slate-100/80 border-b border-gray-200">
                          {Object.keys(kpiDetailsData[0]).map(key => (
                            <th key={key} className="py-3 px-4 font-bold text-xs text-slate-700 uppercase tracking-wider">{key}</th>
                          ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                          {kpiDetailsData.map((row, idx) => (
                             <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                                {Object.entries(row).map(([key, val], i) => (
                                   <td key={i} className="py-3 px-4 text-sm font-medium text-slate-700">
                                     {key === 'Date' && val ? new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 
                                      key === 'Revenue' && val ? `₹${val.toLocaleString('en-IN')}` :
                                      val}
                                   </td>
                                ))}
                             </tr>
                          ))}
                     </tbody>
                   </table>
                 </div>

                 {kpiPageInfo.totalPages > 1 && (
                   <div className="flex items-center justify-between px-2">
                      <span className="text-xs text-slate-500 font-semibold">
                        Showing page {kpiPageInfo.page} of {kpiPageInfo.totalPages} ({kpiPageInfo.totalItems} total)
                      </span>
                      <div className="flex gap-2">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={kpiPageInfo.page <= 1 || kpiDetailsLoading}
                            onClick={() => handleKpiClick(selectedKpi.type, selectedKpi.title, kpiPageInfo.page - 1)}
                            className="h-8 text-xs"
                         >Previous</Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={kpiPageInfo.page >= kpiPageInfo.totalPages || kpiDetailsLoading}
                            onClick={() => handleKpiClick(selectedKpi.type, selectedKpi.title, kpiPageInfo.page + 1)}
                            className="h-8 text-xs"
                         >Next</Button>
                      </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PerformanceDashboard;
