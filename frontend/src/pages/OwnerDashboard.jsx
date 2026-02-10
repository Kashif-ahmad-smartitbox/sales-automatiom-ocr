import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OwnerLayout from '../components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Buildings, 
  Users, 
  Crown,
  Storefront, 
  MapPin,
  Target,
  Pulse,
  TrendUp,
  Eye,
  ChartLineUp,
  ArrowRight,
  CaretDown,
  CaretUp,
  Clock,
  UsersFour
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '../components/ui/collapsible';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerDashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAdmins, setExpandedAdmins] = useState({});

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, orgsRes, adminsRes, activityRes] = await Promise.all([
        axios.get(`${API}/owner/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/super-admins`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/activity?limit=20`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setOrganizations(orgsRes.data);
      setSuperAdmins(adminsRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch owner dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const toggleAdminExpand = (adminId) => {
    setExpandedAdmins(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

  const statCards = [
    { 
      icon: Buildings, 
      label: 'Total Organizations', 
      value: stats?.total_organizations || 0,
      subtext: 'Registered companies',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      icon: Crown, 
      label: 'Super Admins', 
      value: stats?.total_super_admins || 0,
      subtext: `Managing ${stats?.total_users || 0} users`,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    { 
      icon: Users, 
      label: 'Total Users', 
      value: stats?.total_users || 0,
      subtext: `${stats?.total_sales_executives || 0} field reps`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { 
      icon: Storefront, 
      label: 'Total Dealers', 
      value: stats?.total_dealers || 0,
      subtext: 'Across all territories',
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    { 
      icon: MapPin, 
      label: 'Territories', 
      value: stats?.total_territories || 0,
      subtext: 'Coverage areas',
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    },
    { 
      icon: Target, 
      label: 'Total Visits', 
      value: stats?.total_visits || 0,
      subtext: `${stats?.today_visits || 0} today`,
      color: 'text-violet-600',
      bg: 'bg-violet-50'
    },
    { 
      icon: Pulse, 
      label: 'Active in Market', 
      value: stats?.active_in_market || 0,
      subtext: 'Currently working',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      icon: ChartLineUp, 
      label: 'Today\'s Visits', 
      value: stats?.today_visits || 0,
      subtext: 'Completed today',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
  ];

  if (loading) {
    return (
      <OwnerLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Owner Dashboard">
      <div className="space-y-6" data-testid="owner-dashboard">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <Card key={idx} className="stats-card" data-testid={`owner-stat-card-${idx}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold font-mono text-slate-900">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} weight="duotone" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Super Admins with Teams */}
          <Card data-testid="super-admins-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" weight="duotone" />
                  Super Admins & Teams
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                  {superAdmins.length} admins
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar">
                {superAdmins.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No super admins registered yet</p>
                ) : (
                  superAdmins.map((admin) => (
                    <Collapsible 
                      key={admin.id} 
                      open={expandedAdmins[admin.id]}
                      onOpenChange={() => toggleAdminExpand(admin.id)}
                    >
                      <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-slate-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                                {admin.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-slate-900">{admin.name}</p>
                                <p className="text-xs text-slate-500">{admin.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                                  <UsersFour className="w-3 h-3 mr-1" />
                                  {admin.team_member_count} members
                                </Badge>
                              </div>
                              {expandedAdmins[admin.id] ? (
                                <CaretUp className="w-5 h-5 text-slate-400" />
                              ) : (
                                <CaretDown className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-4 bg-white">
                            {/* Company Info */}
                            {admin.company && (
                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                  <Buildings className="w-3 h-3" /> Company Details
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-slate-500 text-xs">Company</p>
                                    <p className="text-slate-900 font-medium">{admin.company.company_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs">Industry</p>
                                    <p className="text-slate-900 font-medium">{admin.company.industry_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs">Location</p>
                                    <p className="text-slate-900 font-medium">{admin.company.head_office_location}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs">GST</p>
                                    <p className="text-slate-900 font-mono text-xs">{admin.company.gst || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                                <p className="text-emerald-700 font-bold">{admin.team_member_count}</p>
                                <p className="text-xs text-emerald-600">Team</p>
                              </div>
                              <div className="bg-primary-50 rounded-lg p-2 text-center border border-primary-100">
                                <p className="text-primary-700 font-bold">{admin.company?.id ? '–' : '–'}</p>
                                <p className="text-xs text-primary-600">Dealers</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
                                <p className="text-purple-700 font-bold">{admin.company?.id ? '–' : '–'}</p>
                                <p className="text-xs text-purple-600">Visits</p>
                              </div>
                            </div>
                            {/* Actions */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50"
                              onClick={() => window.location.href = `/owner/organizations/${admin.company?.id}`}
                            >
                              View Full Details <ArrowRight className="ml-1 w-4 h-4" />
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizations Overview */}
          <Card data-testid="organizations-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Buildings className="w-5 h-5 text-purple-500" weight="duotone" />
                  Organizations
                </CardTitle>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                  {organizations.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar">
                {organizations.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No organizations registered yet</p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-primary-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-900">{org.company_name}</p>
                          <p className="text-xs text-slate-500">{org.industry_type}</p>
                        </div>
                        <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                          {org.head_office_location}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white rounded p-2 border border-slate-100 shadow-sm">
                          <p className="text-emerald-600 font-bold text-sm">{org.user_count}</p>
                          <p className="text-xs text-slate-500">Users</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-slate-100 shadow-sm">
                          <p className="text-primary-600 font-bold text-sm">{org.dealer_count}</p>
                          <p className="text-xs text-slate-500">Dealers</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-slate-100 shadow-sm">
                          <p className="text-pink-600 font-bold text-sm">{org.territory_count}</p>
                          <p className="text-xs text-slate-500">Areas</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-slate-100 shadow-sm">
                          <p className="text-amber-600 font-bold text-sm">{org.today_visits}</p>
                          <p className="text-xs text-slate-500">Today</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card data-testid="activity-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pulse className="w-5 h-5 text-emerald-500" weight="duotone" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50">
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-200">
                      <th className="pb-3 font-medium px-2">Company</th>
                      <th className="pb-3 font-medium px-2">User</th>
                      <th className="pb-3 font-medium px-2">Dealer</th>
                      <th className="pb-3 font-medium px-2">Check-in</th>
                      <th className="pb-3 font-medium px-2">Outcome</th>
                      <th className="pb-3 font-medium px-2">Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentActivity.slice(0, 10).map((visit) => (
                      <tr key={visit.id} className="text-slate-600 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-medium text-slate-900">{visit.company_name}</span>
                        </td>
                        <td className="py-3 px-2">{visit.user_name}</td>
                        <td className="py-3 px-2">{visit.dealer_name}</td>
                        <td className="py-3 px-2 font-mono text-xs">
                          {new Date(visit.check_in_time).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={
                            visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            visit.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }>
                            {visit.outcome || 'In Progress'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {visit.order_value ? `₹${visit.order_value.toLocaleString()}` : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerDashboard;
