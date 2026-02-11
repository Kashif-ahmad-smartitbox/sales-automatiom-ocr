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

const OwnerSessions = () => {
  const { getAuthHeader } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
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

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <ClockCounterClockwise className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No market sessions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSessions.map((session) => (
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
                          <Stop className="w-4 h-4 text-slate-600" weight="fill" />
                        ) : (
                          <Play className="w-4 h-4 text-emerald-600" weight="fill" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{session.user_name}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Buildings className="w-2.5 h-2.5" />
                          {session.company_name}
                        </p>
                      </div>
                    </div>
                    <Badge className={session.end_time 
                      ? 'bg-slate-100 text-slate-600 border-slate-200' 
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }>
                      {session.end_time ? 'Completed' : 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Duration
                        </p>
                        <p className="text-sm text-gray-800 font-mono font-medium">
                          {formatDuration(session.start_time, session.end_time)}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">
                          <Path className="w-2.5 h-2.5" /> Distance
                        </p>
                        <p className="text-sm text-gray-800 font-mono font-medium">
                          {session.total_distance ? `${(session.total_distance / 1000).toFixed(1)} km` : '–'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
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

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-[10px] text-gray-500 space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 text-gray-400" /> 
                            {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          {session.end_time && (
                            <p className="flex items-center gap-1">
                              <Stop className="w-2.5 h-2.5 text-gray-400" /> 
                              {new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs gap-1"
                            onClick={() => viewSessionDetails(session)}
                        >
                            <Eye className="w-3 h-3" /> Details
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                             <th className="px-2 sm:px-4 py-2 text-right">Time Shown</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sessionPotentials.map((item) => (
                             <tr key={item.id} className="hover:bg-slate-50">
                                 <td className="px-2 sm:px-4 py-3 font-medium text-slate-700">
                                     <div className="flex items-center gap-2">
                                         <Buildings className="w-4 h-4 text-slate-400 flex-shrink-0" />
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
    </OwnerLayout>
  );
};

export default OwnerSessions;
