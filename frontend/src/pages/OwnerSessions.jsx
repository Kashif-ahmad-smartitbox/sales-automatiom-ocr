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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  ClockCounterClockwise,
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
import { useSearch } from '../context/SearchContext';
import SearchBar from '../components/SearchBar';
import { Button } from '../components/ui/button';
import { formatDateDDMmmYYYY, getTruncatedText } from '../utils/tableHelpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROWS_PER_PAGE = 15;

const OwnerSessions = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Market Sessions</h1>
            <p className="text-xs text-gray-500 mt-0.5">Track field team market sessions</p>
          </div>
          <SearchBar placeholder="Search sessions..." />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
            <div className="flex-1">
              {searchTerm && (
                <p className="text-xs text-slate-500">
                  Showing results for: <span className="font-semibold text-slate-700">"{searchTerm}"</span>
                </p>
              )}
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
                <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm w-full max-h-[40rem]">
                  <Table className="table-auto border-collapse">
                    <TableHeader className="text-nowrap sticky top-0 text-xs z-10">
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center w-8">#</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium">User</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium">Company</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium">Date</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium">Time</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium">Status</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center">Duration</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center">Distance</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center">Shown</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center">Visited</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-center">Lost</TableHead>
                      <TableHead className="p-2 text-gray-700 dark:text-gray-300 font-medium text-right">Action</TableHead>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredSessions
                        .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                        .map((session, idx) => {
                          const userName = getTruncatedText(session.user_name, 15);
                          const companyName = getTruncatedText(session.company_name, 15);
                          const serialNumber = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                          return (
                          <TableRow key={session.id} className="group cursor-pointer transition-all text-xs text-gray-700 duration-200">
                          <TableCell className="px-2 py-1.5 text-center">
                            <span className="p-1 bg-gray-200 dark:bg-gray-700 font-medium rounded-full text-gray-600 dark:text-gray-300">{serialNumber}</span>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200" title={userName.full}>{userName.display}</TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-400" title={companyName.full}>{companyName.display}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDateDDMmmYYYY(session.start_time)}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(session.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</TableCell>
                          <TableCell className="px-2 py-1.5">
                            <Badge className={`text-[10px] px-1.5 py-0 ${session.end_time ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                              {session.end_time ? 'Done' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] text-gray-600 dark:text-gray-400 text-center">{formatDuration(session.start_time, session.end_time)}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] text-gray-600 dark:text-gray-400 text-center">{session.total_distance ? `${(session.total_distance / 1000).toFixed(1)} km` : '–'}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center">{session.potential_visits_count || 0}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] font-bold text-emerald-700 text-center">{session.visits_completed || 0}</TableCell>
                          <TableCell className="px-2 py-1.5 font-mono text-[11px] font-bold text-red-600 text-center">{session.calculated_lost_visits || 0}</TableCell>
                          <TableCell className="px-2 py-1.5 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                              onClick={() => viewSessionDetails(session)}
                            >
                              <Eye className="w-3 h-3 mr-1" /> Details
                            </Button>
                          </TableCell>
                        </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
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
                 <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                   <Table className="min-w-[400px]">
                     <TableHeader className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 text-nowrap sticky top-0 text-xs z-10 border-b border-primary-100 dark:border-gray-700">
                       <TableHead className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300 font-medium w-8">#</TableHead>
                       <TableHead className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Place/Dealer</TableHead>
                       <TableHead className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hidden sm:table-cell">Address</TableHead>
                       <TableHead className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300 font-medium text-center">Status</TableHead>
                       <TableHead className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300 font-medium text-right">Time Shown</TableHead>
                     </TableHeader>
                     <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {sessionPotentials.map((item, idx) => {
                       const placeName = getTruncatedText(item.place_name, 18);

                       return (
                         <TableRow key={item.id} className={`group transition-all duration-200 ${item.is_visited ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                         <TableCell className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 w-8">{idx + 1}</TableCell>
                         <TableCell className="px-2 sm:px-4 py-3 font-medium text-gray-700 dark:text-gray-200" title={placeName.full}>
                           <div className="flex items-center gap-2">
                             <Buildings className={`w-4 h-4 flex-shrink-0 ${item.is_visited ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`} />
                             <div>
                               <span>{placeName.display}</span>
                               <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:hidden truncate max-w-[200px]">{item.address}</p>
                             </div>
                           </div>
                         </TableCell>
                         <TableCell className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate hidden sm:table-cell" title={item.address}>
                             {item.address}
                         </TableCell>
                         <TableCell className="px-2 sm:px-4 py-3 text-center">
                             {item.is_visited ? (
                                 <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">Visited</Badge>
                             ) : (
                                 <Badge className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0">Shown</Badge>
                             )}
                         </TableCell>
                         <TableCell className="px-2 sm:px-4 py-3 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">
                             {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </TableCell>
                         </TableRow>
                       );
                     })}
                     </TableBody>
                   </Table>
                 </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSessions;
