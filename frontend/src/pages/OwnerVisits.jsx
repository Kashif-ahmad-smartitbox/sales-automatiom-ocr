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
  Target,
  MagnifyingGlass,
  Funnel,
  Buildings,
  Clock,
  CurrencyDollar,
  MapPin,
  User,
  Storefront,
  Check,
  X as XIcon,
  Warning
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerVisits = () => {
  const { getAuthHeader } = useAuth();
  const [visits, setVisits] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [orgsRes, activityRes] = await Promise.all([
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/activity?limit=200`, { headers: getAuthHeader() })
      ]);
      setOrganizations(orgsRes.data);
      setVisits(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || visit.company_id === companyFilter;
    const matchesOutcome = outcomeFilter === 'all' || 
      (outcomeFilter === 'in_progress' && !visit.outcome) ||
      visit.outcome === outcomeFilter;
    return matchesSearch && matchesCompany && matchesOutcome;
  });

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'Order Booked': return <Check className="w-4 h-4" weight="bold" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4" />;
      case 'Lost Visit': return <XIcon className="w-4 h-4" weight="bold" />;
      case 'No Meeting': return <Warning className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getOutcomeBadgeClass = (outcome) => {
    switch (outcome) {
      case 'Order Booked': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Follow-up Required': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Lost Visit': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'No Meeting': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="All Visits">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Visits">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search visits..."
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
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-purple-500/20 text-white">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/20">
                <SelectItem value="all" className="text-white">All Outcomes</SelectItem>
                <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                <SelectItem value="Order Booked" className="text-white">Order Booked</SelectItem>
                <SelectItem value="Follow-up Required" className="text-white">Follow-up Required</SelectItem>
                <SelectItem value="No Meeting" className="text-white">No Meeting</SelectItem>
                <SelectItem value="Lost Visit" className="text-white">Lost Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-sm whitespace-nowrap">
            {filteredVisits.length} visits
          </Badge>
        </div>

        {/* Visits Table */}
        {filteredVisits.length === 0 ? (
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No visits found</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left border-b border-purple-500/20 bg-slate-800/50">
                      <th className="p-4 font-medium">Company</th>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Dealer</th>
                      <th className="p-4 font-medium">Check-in</th>
                      <th className="p-4 font-medium">Check-out</th>
                      <th className="p-4 font-medium">Duration</th>
                      <th className="p-4 font-medium">Outcome</th>
                      <th className="p-4 font-medium">Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {filteredVisits.map((visit) => (
                      <tr key={visit.id} className="text-slate-300 hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Buildings className="w-4 h-4 text-purple-400" />
                            <span className="font-medium text-white truncate max-w-[150px]">{visit.company_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-400" />
                            <span className="truncate max-w-[120px]">{visit.user_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Storefront className="w-4 h-4 text-blue-400" />
                            <span className="truncate max-w-[120px]">{visit.dealer_name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {new Date(visit.check_in_time).toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : '–'}
                        </td>
                        <td className="p-4">
                          {visit.time_spent_minutes ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {Math.round(visit.time_spent_minutes)} min
                            </span>
                          ) : '–'}
                        </td>
                        <td className="p-4">
                          <Badge className={getOutcomeBadgeClass(visit.outcome)}>
                            {getOutcomeIcon(visit.outcome)}
                            <span className="ml-1">{visit.outcome || 'In Progress'}</span>
                          </Badge>
                        </td>
                        <td className="p-4">
                          {visit.order_value ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-mono">
                              <CurrencyDollar className="w-3 h-3" />
                              ₹{visit.order_value.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-500">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerVisits;
