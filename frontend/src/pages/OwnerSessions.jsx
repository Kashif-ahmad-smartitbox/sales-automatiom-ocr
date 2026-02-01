import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OwnerLayout from '../components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  ClockCounterClockwise,
  MagnifyingGlass,
  Funnel,
  Buildings,
  Clock,
  MapPin,
  User,
  Path,
  Target,
  Play,
  Stop
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerSessions = () => {
  const { getAuthHeader } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const orgsRes = await axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() });
      setOrganizations(orgsRes.data);
      
      // Fetch market sessions - need to add this endpoint
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Market Sessions">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-purple-500/20 text-white">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/20 max-h-64">
                <SelectItem value="all" className="text-white">All Companies</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id} className="text-white">
                    {org.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-slate-800/50 border-purple-500/20 text-white">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/20">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="active" className="text-white">Active</SelectItem>
                <SelectItem value="completed" className="text-white">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm whitespace-nowrap">
            {filteredSessions.length} sessions
          </Badge>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <ClockCounterClockwise className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No market sessions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        session.end_time 
                          ? 'bg-slate-600' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse'
                      }`}>
                        {session.end_time ? (
                          <Stop className="w-5 h-5 text-white" weight="fill" />
                        ) : (
                          <Play className="w-5 h-5 text-white" weight="fill" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{session.user_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Buildings className="w-3 h-3" />
                          {session.company_name}
                        </p>
                      </div>
                    </div>
                    <Badge className={session.end_time 
                      ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }>
                      {session.end_time ? 'Completed' : 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Duration
                        </p>
                        <p className="text-white font-mono">
                          {formatDuration(session.start_time, session.end_time)}
                        </p>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Path className="w-3 h-3" /> Distance
                        </p>
                        <p className="text-white font-mono">
                          {session.total_distance ? `${(session.total_distance / 1000).toFixed(1)} km` : '–'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Visits
                        </p>
                        <p className="text-emerald-400 font-bold">{session.visits_completed || 0}</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Lost Visits</p>
                        <p className="text-red-400 font-bold">{session.lost_visits || 0}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p className="flex items-center gap-1">
                        <Play className="w-3 h-3" /> 
                        Start: {new Date(session.start_time).toLocaleString()}
                      </p>
                      {session.end_time && (
                        <p className="flex items-center gap-1">
                          <Stop className="w-3 h-3" /> 
                          End: {new Date(session.end_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerSessions;
