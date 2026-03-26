import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Users,
  MapPin,
  CaretDown,
  CaretRight,
  CaretLeft,
  CaretDoubleDown,
  CaretDoubleUp,
  Funnel,
  CalendarBlank
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import DealerOrderItemsView from '../components/DealerOrderItemsView';
import { formatDateDDMmmYYYY, getTruncatedText } from '../utils/tableHelpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SESSIONS_INITIAL = 3;
const PAGE_SIZE = 15;

// Helper to get date in YYYY-MM-DD format
const getDateString = (date) => {
  return date.toISOString().split('T')[0];
};

// Get date 15 days ago
const getDefault15DaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 15);
  return getDateString(date);
};

const getTodayString = () => {
  return getDateString(new Date());
};

const UserVisitSummary = () => {
  const { getAuthHeader } = useAuth();
  const [summary, setSummary] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState({});
  const [selectedSession, setSelectedSession] = useState({});
  const [page, setPage] = useState({});
  
  // Date range filter - default to last 15 days
  const [fromDate, setFromDate] = useState(getDefault15DaysAgo());
  const [toDate, setToDate] = useState(getTodayString());
  const [showFilters, setShowFilters] = useState(false);

  const fetchSummary = useCallback(async (from, to) => {
    try {
      setLoading(true);
      const [summaryRes, territoriesRes] = await Promise.all([
        axios.get(`${API}/reports/user-visit-summary`, { 
          headers: getAuthHeader(),
          params: { from_date: from, to_date: to }
        }),
        axios.get(`${API}/territories`, { headers: getAuthHeader() })
      ]);
      setSummary(summaryRes.data);
      setTerritories(territoriesRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch visit summary');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    // Load initial data with default 15 days
    fetchSummary(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      setPage(prev => ({ ...prev, [userId]: 1 }));
      setSelectedSession(prev => ({ ...prev, [userId]: null }));
    }
  };

  const toggleShowAllSessions = (userId, e) => {
    e?.stopPropagation?.();
    setShowAllSessions(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const selectSession = (userId, sessionId, e) => {
    e?.stopPropagation?.();
    setSelectedSession(prev => ({ ...prev, [userId]: prev[userId] === sessionId ? null : sessionId }));
    setPage(prev => ({ ...prev, [userId]: 1 }));
  };

  const setUserPage = (userId, p) => {
    setPage(prev => ({ ...prev, [userId]: p }));
  };

  const getTerritoryName = (id) => {
    if (!id) return '–';
    const t = territories.find(t => t.id === id);
    if (t) return t.name;
    const tByName = territories.find(t => t.name?.toLowerCase() === id?.toLowerCase());
    return tByName?.name || (id.length < 30 && !id.includes('-') ? id : 'Unknown');
  };

  if (loading) {
    return (
      <AdminLayout title="User Visit Summary">
        <div className="flex justify-center py-20">
          <div className="spinner" />
        </div>
      </AdminLayout>
    );
  }

  const handleApplyFilter = () => {
    fetchSummary(fromDate, toDate);
  };

  return (
    <AdminLayout title="User Visit Summary">
      <div className="space-y-2" data-testid="user-visit-summary">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            User Visit Summary
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Dealers shown when market starts vs visited. Expand each user to see full dealer table (Dealer page layout).
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarBlank size={18} className="text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-800">Date Range Filter</h3>
                <Badge variant="outline" className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                  Last 15 days (default)
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-7 text-xs"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
                <CaretDown size={14} className={`ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">&nbsp;</Label>
                  <Button
                    onClick={handleApplyFilter}
                    className="w-full h-9 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:text-white rounded-xl"
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {summary.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No sales executives or visit data yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {summary.map((user) => (
              <Card key={user.user_id} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="py-2 px-3 cursor-pointer hover:bg-gray-50/50 transition-colors flex items-center justify-between"
                    onClick={() => toggleExpand(user.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {expandedUser === user.user_id ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                      </Button>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.user_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.user_name}</p>
                        <p className="text-[10px] text-gray-500">{user.employee_code || user.user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Dealers Shown</p>
                        <p className="text-sm font-bold text-primary-600">{user.total_dealers_shown ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Dealers Visited</p>
                        <p className="text-sm font-bold text-emerald-600">{user.total_dealers_visited ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Target</p>
                        <p className="text-sm font-bold text-gray-700">{user.target_visits || '–'}</p>
                      </div>
                    </div>
                  </div>

                  {expandedUser === user.user_id && (
                    <div className="border-t border-gray-100">
                      {false && user.market_sessions?.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-600 mb-2 flex items-center gap-2">
                            <Funnel size={12} /> Market Sessions (click to filter table)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(e) => selectSession(user.user_id, null, e)}
                              className={`text-xs rounded-lg px-3 py-2 border transition-colors ${
                                !selectedSession[user.user_id]
                                  ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              All
                            </button>
                            {(showAllSessions[user.user_id] ? user.market_sessions : user.market_sessions.slice(0, SESSIONS_INITIAL)).map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={(e) => selectSession(user.user_id, s.id, e)}
                                className={`text-xs rounded-lg px-3 py-2 border transition-colors text-left ${
                                  selectedSession[user.user_id] === s.id
                                    ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <span>
                                  {new Date(s.start_time).toLocaleDateString()} {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-gray-400 mx-2">•</span>
                                <span className="text-primary-600 font-medium">Shown: {s.dealers_shown}</span>
                                <span className="text-gray-400 mx-2">•</span>
                                <span className="text-emerald-600 font-medium">Visited: {s.dealers_visited}</span>
                              </button>
                            ))}
                            {user.market_sessions.length > SESSIONS_INITIAL && (
                              <button
                                type="button"
                                onClick={(e) => toggleShowAllSessions(user.user_id, e)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 px-2 py-2"
                              >
                                {showAllSessions[user.user_id] ? (
                                  <> <CaretDoubleUp size={12} /> Show less</>
                                ) : (
                                  <> <CaretDoubleDown size={12} /> Show all ({user.market_sessions.length})</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const sid = selectedSession[user.user_id];
                        const filteredDealers = !user.dealers?.length ? [] : sid
                          ? user.dealers.filter(d => (d.session_ids || []).includes(sid))
                          : user.dealers;
                        const currentPage = page[user.user_id] || 1;
                        const totalPages = Math.max(1, Math.ceil(filteredDealers.length / PAGE_SIZE));
                        const startIdx = (currentPage - 1) * PAGE_SIZE;
                        const paginatedDealers = filteredDealers.slice(startIdx, startIdx + PAGE_SIZE);

                        return (
                          <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm w-full max-h-[40rem]">
                            <Table className="table-auto border-collapse">
                              <TableHeader className="text-nowrap sticky top-0 text-xs z-10 bg-gray-200">
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200 text-center w-8">
                                  #
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Dealer
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Address
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Type
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Territory
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Contact
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Phone
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Found By
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Priority
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Status
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Last Visit
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Visited By
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Outcome
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold border-r border-gray-200">
                                  Next Visit
                                </TableHead>
                                <TableHead className="p-2 text-gray-500 font-semibold text-center">
                                  Items
                                </TableHead>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredDealers.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan="15" className="px-2 py-8 text-center text-[11px] text-gray-500">
                                      {sid ? 'No dealers in this session' : 'No dealers shown yet (start a market session to see dealers)'}
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  paginatedDealers.map((dealer, idx) => {
                                    const serialNumber = startIdx + idx + 1;
                                    const dealerName = getTruncatedText(dealer.name || dealer.dealer_name, 20);
                                    const contactPerson = getTruncatedText(dealer.contact_person, 15);
                                    const foundBy = getTruncatedText(dealer.found_by, 15);
                                    const visitedBy = getTruncatedText(dealer.last_visited_by, 15);
                                    
                                    return (
                                      <TableRow 
                                        key={dealer.id || dealer.place_id} 
                                        className="group cursor-pointer transition-all text-xs text-gray-700 duration-200"
                                      >
                                        <TableCell className="px-2 py-1.5 text-center">
                                          <span className="p-1 bg-gray-200 dark:bg-gray-700 font-medium rounded-full text-gray-600 dark:text-gray-300">
                                            {serialNumber}
                                          </span>
                                        </TableCell>
                                        <TableCell className="px-2 py-1.5">
                                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200" title={dealerName.full}>
                                            {dealerName.display}
                                          </p>
                                        </TableCell>
                                        <TableCell className="px-2 py-1.5">
                                          <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5 min-w-0 max-w-[220px]" title={dealer.address}>
                                            <MapPin size={12} className="flex-shrink-0 mt-0.5 text-gray-400" />
                                            <span className="truncate">{dealer.address || '–'}</span>
                                          </p>
                                        </TableCell>
                                        <TableCell className="px-2 py-1.5">
                                          <span className="text-[10px] px-1.5 py-0 text-gray-600 dark:text-gray-400">
                                            {dealer.dealer_type || '–'}
                                          </span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400">
                                          {getTerritoryName(dealer.territory_id)}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400" title={contactPerson.full}>
                                          <span>{contactPerson.display}</span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400 whitespace-nowrap">
                                          {dealer.phone || '–'}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400" title={foundBy.full}>
                                          <span>{foundBy.display}</span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2">
                                          <span className={`text-xs font-semibold ${
                                            dealer.priority_level === 1 ? 'text-red-600' :
                                            dealer.priority_level === 2 ? 'text-amber-600' : 'text-slate-500'
                                          }`}>
                                            {dealer.priority_level === 1 ? 'High' : dealer.priority_level === 2 ? 'Medium' : 'Low'}
                                          </span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2">
                                          <span className={`text-xs font-semibold ${dealer.is_visited ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {dealer.is_visited ? 'Visited' : 'Not Visited'}
                                          </span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400 whitespace-nowrap">
                                          {dealer.last_visit_date ? formatDateDDMmmYYYY(dealer.last_visit_date) : '–'}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400" title={visitedBy.full}>
                                          <span>{visitedBy.display}</span>
                                        </TableCell>
                                        <TableCell className="px-2 py-2">
                                          {dealer.last_outcome ? (
                                            <span className={`text-xs font-semibold ${
                                              dealer.last_outcome === 'Order Booked' ? 'text-emerald-600' :
                                              dealer.last_outcome === 'Follow-up Required' ? 'text-amber-600' :
                                              dealer.last_outcome === 'Lost Visit' ? 'text-red-600' :
                                              'text-slate-500'
                                            }`}>
                                              {dealer.last_outcome}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-gray-400">–</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-gray-700 dark:text-gray-400 whitespace-nowrap">
                                          {dealer.next_visit_date ? formatDateDDMmmYYYY(dealer.next_visit_date) : '–'}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-center">
                                          <DealerOrderItemsView dealer={dealer} />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                            {filteredDealers.length > PAGE_SIZE && (
                              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                                <span className="text-xs text-gray-600">
                                  Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredDealers.length)} of {filteredDealers.length}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={currentPage <= 1}
                                    onClick={() => setUserPage(user.user_id, currentPage - 1)}
                                  >
                                    <CaretLeft size={14} />
                                  </Button>
                                  <span className="text-xs font-medium px-2">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setUserPage(user.user_id, currentPage + 1)}
                                  >
                                    <CaretRight size={14} />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserVisitSummary;
