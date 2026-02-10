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
  Pulse,
  MagnifyingGlass,
  Funnel,
  Buildings,
  Clock,
  Check,
  X as XIcon,
  Warning,
  ArrowsClockwise,
  CurrencyDollar
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerActivity = () => {
  const { getAuthHeader } = useAuth();
  const [activity, setActivity] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [orgsRes, activityRes] = await Promise.all([
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/activity?limit=100`, { headers: getAuthHeader() })
      ]);
      setOrganizations(orgsRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredActivity = activity.filter(item => {
    const matchesSearch = 
      item.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || item.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'Order Booked': return <Check className="w-4 h-4 text-emerald-600" weight="bold" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Lost Visit': return <XIcon className="w-4 h-4 text-red-600" weight="bold" />;
      case 'No Meeting': return <Warning className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-primary-600" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <OwnerLayout title="Activity Log">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Activity Log">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Activity Log</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time visit activity across all organizations</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search activity..."
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
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <ArrowsClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredActivity.length} activities
          </Badge>
        </div>

        {/* Activity Timeline */}
        {filteredActivity.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Pulse className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No activity found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
            
            <div className="space-y-4">
              {filteredActivity.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pl-4">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 border-white ${
                    item.outcome === 'Order Booked' ? 'bg-emerald-100' :
                    item.outcome === 'Follow-up Required' ? 'bg-amber-100' :
                    item.outcome === 'Lost Visit' ? 'bg-red-100' :
                    item.outcome === 'No Meeting' ? 'bg-orange-100' :
                    'bg-primary-100'
                  }`}>
                    {getOutcomeIcon(item.outcome)}
                  </div>
                  
                  <Card className="flex-1 ml-8 border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5 text-sm">
                            <span className="text-gray-800 font-medium">{item.user_name}</span>
                            <span className="text-gray-400">visited</span>
                            <span className="text-primary-600 font-medium">{item.dealer_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <Buildings className="w-2.5 h-2.5" />
                            <span>{item.company_name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            item.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            item.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            item.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700 border-red-200' :
                            item.outcome === 'No Meeting' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-primary-100 text-primary-700 border-primary-200'
                          }>
                            {item.outcome || 'In Progress'}
                          </Badge>
                          <p className="text-[10px] text-gray-500 mt-0.5">{formatTimeAgo(item.check_in_time)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono text-[10px]">
                            {new Date(item.check_in_time).toLocaleTimeString()}
                            {item.check_out_time && ` – ${new Date(item.check_out_time).toLocaleTimeString()}`}
                          </span>
                        </div>
                        {item.time_spent_minutes && (
                          <div className="text-gray-500 text-[10px]">
                            Duration: {Math.round(item.time_spent_minutes)} min
                          </div>
                        )}
                        {item.order_value && (
                          <div className="flex items-center gap-1 text-primary-600 font-mono text-xs font-medium">
                            <CurrencyDollar className="w-3 h-3" />
                            ₹{item.order_value.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="mt-2 text-[10px] text-gray-600 bg-gray-50 rounded p-1.5 border border-gray-100">
                          {item.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerActivity;
