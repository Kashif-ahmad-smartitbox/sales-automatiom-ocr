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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Target,
  Funnel,
  Buildings,
  Clock,
  CurrencyDollar,
  User,
  Storefront,
  Check,
  X as XIcon,
  Warning
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import SearchBar from '../components/SearchBar';
import { formatDateDDMmmYYYY, getTruncatedText } from '../utils/tableHelpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerVisits = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [visits, setVisits] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
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
      case 'Order Booked': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Follow-up Required': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Lost Visit': return 'bg-red-100 text-red-700 border-red-200';
      case 'No Meeting': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-primary-100 text-primary-700 border-primary-200';
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="All Visits">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Visits">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Visit Reports</h1>
            <p className="text-xs text-gray-500 mt-0.5">Visit records across all organizations</p>
          </div>
          <SearchBar placeholder="Search visits..." />
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
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Outcomes</SelectItem>
                <SelectItem value="in_progress" className="text-slate-900 focus:bg-slate-50">In Progress</SelectItem>
                <SelectItem value="Order Booked" className="text-slate-900 focus:bg-slate-50">Order Booked</SelectItem>
                <SelectItem value="Follow-up Required" className="text-slate-900 focus:bg-slate-50">Follow-up Required</SelectItem>
                <SelectItem value="No Meeting" className="text-slate-900 focus:bg-slate-50">No Meeting</SelectItem>
                <SelectItem value="Lost Visit" className="text-slate-900 focus:bg-slate-50">Lost Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredVisits.length} visits
          </Badge>
        </div>

        {/* Visits Table */}
        {filteredVisits.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Target className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No visits found</p>
            </CardContent>
          </Card>
        ) : (
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto bg-white dark:bg-gray-900 shadow-sm w-full max-h-[30rem]">
              <Table className="w-full text-left">
                <TableHeader className="sticky top-0 z-10 bg-gray-200">
                  <TableRow className="border-y border-gray-300">
                    <TableHead className="px-2 py-2 w-8 text-center bg-gray-200">#</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Company</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">User</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Dealer</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Contact</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Phone</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Check-in</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Check-out</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Duration</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200">Outcome</TableHead>
                    <TableHead className="px-2 py-2 bg-gray-200 text-right border-r-0">Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredVisits.map((visit, idx) => {
                  const companyName = getTruncatedText(visit.company_name, 18);
                  const userName = getTruncatedText(visit.user_name, 15);
                  const dealerName = getTruncatedText(visit.dealer_name, 15);
                  const contactName = getTruncatedText(visit.contact_name || '–', 15);

                  return (
                    <TableRow 
                      key={visit.id} 
                      className="group cursor-pointer transition-all text-xs text-gray-700 duration-200"
                    >
                      <TableCell className="px-2 py-1 text-center border-r border-gray-100">
                        <span className="p-1 px-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-300">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1 border-r border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <Buildings className="w-3 h-3 text-purple-700" />
                          <span className="text-xs text-gray-900 dark:text-gray-200" title={companyName.full}>
                            {companyName.display}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1 border-r border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-400">
                          <User className="w-3 h-3 text-emerald-700" />
                          <span title={userName.full}>{userName.display}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1 border-r border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-400">
                          <Storefront className="w-3 h-3 text-primary-700" />
                          <span title={dealerName.full}>{dealerName.display}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-gray-800 dark:text-gray-400 border-r border-gray-100" title={contactName.full}>
                        {contactName.display}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-gray-800 dark:text-gray-400 whitespace-nowrap border-r border-gray-100">
                        {visit.contact_phone || '–'}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-gray-800 dark:text-gray-400 border-r border-gray-100">
                        {formatDateDDMmmYYYY(visit.check_in_time)}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-gray-800 dark:text-gray-400 border-r border-gray-100">
                        {visit.check_out_time ? formatDateDDMmmYYYY(visit.check_out_time) : '–'}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-gray-800 dark:text-gray-400 border-r border-gray-100">
                        {visit.time_spent_minutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-gray-500" />
                            {Math.round(visit.time_spent_minutes)} min
                          </span>
                        ) : '–'}
                      </TableCell>
                      <TableCell className="px-2 py-1 border-r border-gray-100">
                        <Badge variant="outline" className={`text-xs text-nowrap px-2 py-0 ${getOutcomeBadgeClass(visit.outcome)}`}>
                          {visit.outcome || 'In Progress'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-1 border-r-0">
                        {visit.order_value ? (
                          <span className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                            <CurrencyDollar className="w-2.5 h-2.5" />
                            ₹{visit.order_value.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">–</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerVisits;
