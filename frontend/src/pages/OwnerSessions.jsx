import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OwnerLayout from '../components/layout/OwnerLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  ClockCounterClockwise,
  MagnifyingGlass,
  Funnel,
  Buildings,
  Clock,
  Path,
  Target,
  Play,
  Stop,
  Eye,
  XCircle,
  CheckCircle
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROWS_PER_PAGE = 15;

const OwnerSessions = () => {
  const { getAuthHeader } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Details Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionPotentials, setSessionPotentials] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const viewSessionDetails = async (session) => {
      setSelectedSession(session);
      setIsDetailsOpen(true);
      setDetailsLoading(true);
      try {
          const res = await axios.get(`${API}/owner/market-sessions/${session.id}/potentials`, { headers: getAuthHeader() });
          setSessionPotentials(res.data);
      } catch (error) {
          console.error("Failed to fetch details", error);
      } finally {
          setDetailsLoading(false);
      }
  };

  const fetchData = useCallback(async () => {
    try {
      const orgsRes = await axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() });
      setOrganizations(orgsRes.data);
      
      const sessionsRes = await axios.get(`${API}/owner/market-sessions`, { headers: getAuthHeader() });
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || session.company_id === companyFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !session.end_time) ||
      (statusFilter === 'completed' && session.end_time);
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '–';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <OwnerLayout title="Market Sessions">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Market Sessions">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Market Sessions</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track field team market sessions</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary-500"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 max-h-64">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Companies</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id} className="text-slate-900 focus:bg-slate-50">
                    {org.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Status</SelectItem>
                <SelectItem value="active" className="text-slate-900 focus:bg-slate-50">Active</SelectItem>
                <SelectItem value="completed" className="text-slate-900 focus:bg-slate-50">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredSessions.length} sessions
          </Badge>
        </div>

        {/* Sessions Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center">
                <ClockCounterClockwise className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No market sessions found</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">User</th>
                        <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Company</th>
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
                      {filteredSessions
                        .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                        .map((session) => (
                        <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-2 py-1.5 text-xs font-medium text-gray-800 truncate max-w-[120px]">{session.user_name}</td>
                          <td className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[120px]">{session.company_name}</td>
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
                {/* Pagination */}
                {Math.ceil(filteredSessions.length / ROWS_PER_PAGE) > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                    <p className="text-[10px] text-gray-500">
                      Page {currentPage} of {Math.ceil(filteredSessions.length / ROWS_PER_PAGE)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Prev
                      </Button>
                      {Array.from({ length: Math.min(Math.ceil(filteredSessions.length / ROWS_PER_PAGE), 5) }, (_, i) => {
                        const totalPages = Math.ceil(filteredSessions.length / ROWS_PER_PAGE);
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
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        disabled={currentPage === Math.ceil(filteredSessions.length / ROWS_PER_PAGE)}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap gap-2 sm:gap-4 mt-2">
                <span>{selectedSession?.user_name}</span>
                <span>•</span>
                <span>{selectedSession && new Date(selectedSession.start_time).toLocaleDateString()}</span>
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
                                         <Buildings className={`w-4 h-4 flex-shrink-0 ${item.is_visited ? 'text-emerald-500' : 'text-slate-400'}`} />
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
    </OwnerLayout>
  );
};

export default OwnerSessions;
