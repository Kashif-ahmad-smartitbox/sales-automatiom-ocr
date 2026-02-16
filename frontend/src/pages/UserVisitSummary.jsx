import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Users,
  MapPin,
  CaretDown,
  CaretRight,
  CaretLeft,
  CaretDoubleDown,
  CaretDoubleUp,
  Funnel
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import DealerOrderItemsView from '../components/DealerOrderItemsView';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SESSIONS_INITIAL = 3;
const PAGE_SIZE = 15;

const UserVisitSummary = () => {
  const { getAuthHeader } = useAuth();
  const [summary, setSummary] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState({});
  const [selectedSession, setSelectedSession] = useState({});
  const [page, setPage] = useState({});

  const fetchSummary = useCallback(async () => {
    try {
      const [summaryRes, territoriesRes] = await Promise.all([
        axios.get(`${API}/reports/user-visit-summary`, { headers: getAuthHeader() }),
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
    fetchSummary();
  }, [fetchSummary]);

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

  return (
    <AdminLayout title="User Visit Summary">
      <div className="space-y-4" data-testid="user-visit-summary">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            User Visit Summary
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Dealers shown when market starts vs visited. Expand each user to see full dealer table (Dealer page layout).
          </p>
        </div>

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
                    className="py-3 px-4 cursor-pointer hover:bg-gray-50/50 transition-colors flex items-center justify-between"
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
                        <p className="text-[10px] text-gray-500 font-mono">{user.employee_code || user.user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
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
                      {user.market_sessions?.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                                <span className="font-mono">
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
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Dealer</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Address</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Type</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Territory</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Contact</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Phone</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Found By</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Priority</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Status</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Last Visit</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Visited By</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Outcome</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2">Next Visit</th>
                                  <th className="text-[10px] text-gray-500 uppercase tracking-wider font-medium px-2 py-2 text-center">Items</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDealers.length === 0 ? (
                                  <tr>
                                    <td colSpan="14" className="px-4 py-8 text-center text-xs text-gray-500">
                                      {sid ? 'No dealers in this session' : 'No dealers shown yet (start a market session to see dealers)'}
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedDealers.map((dealer) => (
                                    <tr key={dealer.id || dealer.place_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                      <td className="px-2 py-1.5">
                                        <p className="text-xs font-medium text-gray-800">{dealer.name || dealer.dealer_name}</p>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <p className="text-[11px] text-gray-600 flex items-start gap-1.5 min-w-0 max-w-[220px]" title={dealer.address}>
                                          <MapPin size={12} className="flex-shrink-0 mt-0.5 text-gray-400" />
                                          <span className="truncate">{dealer.address || '–'}</span>
                                        </p>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{dealer.dealer_type || '–'}</Badge>
                                      </td>
                                      <td className="px-2 py-1.5 text-[11px] text-gray-600">{getTerritoryName(dealer.territory_id)}</td>
                                      <td className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[100px]">{dealer.contact_person || '–'}</td>
                                      <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">{dealer.phone || '–'}</td>
                                      <td className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[100px]">{dealer.found_by || '–'}</td>
                                      <td className="px-2 py-1.5">
                                        <Badge className={`text-[10px] px-1.5 py-0 ${
                                          dealer.priority_level === 1 ? 'priority-high' :
                                          dealer.priority_level === 2 ? 'priority-medium' : 'priority-low'
                                        }`}>
                                          {dealer.priority_level === 1 ? 'High' : dealer.priority_level === 2 ? 'Medium' : 'Low'}
                                        </Badge>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <Badge className={`text-[10px] px-1.5 py-0 ${dealer.is_visited ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {dealer.is_visited ? 'Visited' : 'Not Visited'}
                                        </Badge>
                                      </td>
                                      <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                        {dealer.last_visit_date ? new Date(dealer.last_visit_date).toLocaleDateString() : '–'}
                                      </td>
                                      <td className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {dealer.last_visited_by || '–'}
                                      </td>
                                      <td className="px-2 py-1.5">
                                        {dealer.last_outcome ? (
                                          <Badge className={`text-[10px] px-1.5 py-0 ${
                                            dealer.last_outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                                            dealer.last_outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                                            dealer.last_outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                          }`}>
                                            {dealer.last_outcome}
                                          </Badge>
                                        ) : (
                                          <span className="text-[11px] text-gray-400">–</span>
                                        )}
                                      </td>
                                      <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                        {dealer.next_visit_date ? new Date(dealer.next_visit_date).toLocaleDateString() : '–'}
                                      </td>
                                      <td className="px-2 py-1.5 text-center">
                                        <DealerOrderItemsView dealer={dealer} />
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
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
