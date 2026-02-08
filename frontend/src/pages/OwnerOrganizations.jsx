import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OwnerLayout from '../components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Buildings, 
  Users, 
  Storefront, 
  MapPin,
  MagnifyingGlass,
  Eye,
  CaretDown,
  CaretUp,
  Clock,
  Target,
  Crown
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '../components/ui/collapsible';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerOrganizations = () => {
  const { getAuthHeader } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [orgDetails, setOrgDetails] = useState({});

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() });
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const fetchOrgDetails = async (orgId) => {
    if (orgDetails[orgId]) return; // Already fetched
    try {
      const response = await axios.get(`${API}/owner/organizations/${orgId}`, { headers: getAuthHeader() });
      setOrgDetails(prev => ({ ...prev, [orgId]: response.data }));
    } catch (error) {
      console.error('Failed to fetch org details:', error);
    }
  };

  const toggleOrgExpand = async (orgId) => {
    const isExpanding = !expandedOrgs[orgId];
    setExpandedOrgs(prev => ({
      ...prev,
      [orgId]: isExpanding
    }));
    if (isExpanding) {
      await fetchOrgDetails(orgId);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.industry_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.head_office_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <OwnerLayout title="Organizations">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Organizations">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm">
            {filteredOrgs.length} organizations
          </Badge>
        </div>

        {/* Organizations List */}
        <div className="space-y-4">
          {filteredOrgs.length === 0 ? (
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-8 text-center">
                <Buildings className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No organizations found</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrgs.map((org) => (
              <Collapsible 
                key={org.id} 
                open={expandedOrgs[org.id]}
                onOpenChange={() => toggleOrgExpand(org.id)}
              >
                <Card className="bg-white border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
                            {org.company_name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-slate-900 text-lg">{org.company_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
                                {org.industry_type}
                              </Badge>
                              <span className="text-xs text-slate-500">{org.head_office_location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex items-center gap-3">
                            <div className="text-center px-3">
                              <p className="text-emerald-600 font-bold">{org.user_count}</p>
                              <p className="text-xs text-slate-500">Users</p>
                            </div>
                            <div className="text-center px-3">
                              <p className="text-blue-600 font-bold">{org.dealer_count}</p>
                              <p className="text-xs text-slate-500">Dealers</p>
                            </div>
                            <div className="text-center px-3">
                              <p className="text-pink-600 font-bold">{org.territory_count}</p>
                              <p className="text-xs text-slate-500">Territories</p>
                            </div>
                            <div className="text-center px-3">
                              <p className="text-amber-600 font-bold">{org.today_visits}</p>
                              <p className="text-xs text-slate-500">Today</p>
                            </div>
                          </div>
                          {expandedOrgs[org.id] ? (
                            <CaretUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <CaretDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-slate-100 bg-slate-50/50">
                      {orgDetails[org.id] ? (
                        <div className="space-y-6 pt-4">
                          {/* Company Info */}
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                              <p className="text-xs text-slate-500 mb-2">Contact Info</p>
                              <p className="text-slate-900 text-sm font-medium">{orgDetails[org.id].admin_email}</p>
                              <p className="text-slate-500 text-sm">{orgDetails[org.id].admin_mobile}</p>
                              <p className="text-xs text-slate-400 mt-2">GST: {orgDetails[org.id].gst || 'N/A'}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                              <p className="text-xs text-slate-500 mb-2">Configuration</p>
                              <p className="text-slate-900 text-sm">
                                Working: {orgDetails[org.id].config?.working_hours?.start || '09:00'} - {orgDetails[org.id].config?.working_hours?.end || '18:00'}
                              </p>
                              <p className="text-slate-500 text-sm">
                                Visit Radius: {orgDetails[org.id].config?.visit_radius || 500}m
                              </p>
                              <p className="text-slate-500 text-sm">
                                Daily Target: {orgDetails[org.id].config?.visits_per_day_target || 10} visits
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                              <p className="text-xs text-slate-500 mb-2">Created</p>
                              <p className="text-slate-900 text-sm">
                                {new Date(orgDetails[org.id].created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Users */}
                          <div>
                            <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Team Members ({orgDetails[org.id].users?.length || 0})
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {orgDetails[org.id].users?.slice(0, 6).map((user) => (
                                <div key={user.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                    user.role === 'organization' ? 'bg-amber-500' : 
                                    user.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                                  }`}>
                                    {user.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-900 text-sm truncate font-medium">{user.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
                                  </div>
                                  {user.is_in_market && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs hover:bg-emerald-200">Active</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                            {orgDetails[org.id].users?.length > 6 && (
                              <p className="text-xs text-slate-500 mt-2">
                                + {orgDetails[org.id].users.length - 6} more users
                              </p>
                            )}
                          </div>

                          {/* Today's Visits */}
                          {orgDetails[org.id].today_visits?.length > 0 && (
                            <div>
                              <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Today's Visits ({orgDetails[org.id].today_visits.length})
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-slate-500 border-b border-slate-200">
                                      <th className="text-left pb-2 font-medium">Dealer</th>
                                      <th className="text-left pb-2 font-medium">Time</th>
                                      <th className="text-left pb-2 font-medium">Outcome</th>
                                      <th className="text-left pb-2 font-medium">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {orgDetails[org.id].today_visits.slice(0, 5).map((visit) => (
                                      <tr key={visit.id} className="text-slate-600">
                                        <td className="py-2">{visit.dealer_name}</td>
                                        <td className="py-2 font-mono text-xs">
                                          {new Date(visit.check_in_time).toLocaleTimeString()}
                                        </td>
                                        <td className="py-2">
                                          <Badge className={
                                            visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                                            visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-600'
                                          }>
                                            {visit.outcome || 'In Progress'}
                                          </Badge>
                                        </td>
                                        <td className="py-2 font-mono">
                                          {visit.order_value ? `₹${visit.order_value.toLocaleString()}` : '–'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="spinner"></div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerOrganizations;
