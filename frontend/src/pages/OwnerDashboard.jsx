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
      <div className="space-y-4" data-testid="owner-dashboard">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Owner Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Platform-wide overview and analytics</p>
        </div>

        {/* Stats Grid - gradient cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((stat, idx) => {
            const gradients = [
              'from-purple-400 to-purple-500', 'from-amber-400 to-amber-500',
              'from-emerald-400 to-emerald-500', 'from-primary-400 to-primary-500',
              'from-pink-400 to-pink-500', 'from-violet-400 to-violet-500',
              'from-green-400 to-green-500', 'from-cyan-400 to-cyan-500'
            ];
            return (
            <Card key={idx} className={`border-0 bg-gradient-to-br ${gradients[idx]} text-white shadow-md hover:shadow-lg transition-all duration-300`} data-testid={`owner-stat-card-${idx}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/90">{stat.label}</span>
                  <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                    <stat.icon className="w-3.5 h-3.5" weight="fill" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono">{stat.value.toLocaleString()}</div>
                <p className="text-[10px] text-white/80 mt-0.5">{stat.subtext}</p>
              </CardContent>
            </Card>
          );})}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Super Admins with Teams */}
          <Card className="border-0 shadow-sm" data-testid="super-admins-card">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500">
                    <Crown className="w-3.5 h-3.5 text-white" weight="fill" />
                  </div>
                  Super Admins & Teams
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                  {superAdmins.length} admins
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2 max-h-[350px] overflow-auto custom-scrollbar">
                {superAdmins.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No super admins registered yet</p>
                ) : (
                  superAdmins.map((admin) => (
                    <Collapsible 
                      key={admin.id} 
                      open={expandedAdmins[admin.id]}
                      onOpenChange={() => toggleAdminExpand(admin.id)}
                    >
                      <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                                {admin.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-800">{admin.name}</p>
                                <p className="text-[10px] text-gray-500">{admin.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 text-[10px] px-1.5 py-0">
                                <UsersFour className="w-2.5 h-2.5 mr-0.5" />
                                {admin.team_member_count}
                              </Badge>
                              {expandedAdmins[admin.id] ? (
                                <CaretUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <CaretDown className="w-4 h-4 text-gray-400" />
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
          <Card className="border-0 shadow-sm" data-testid="organizations-card">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500">
                    <Buildings className="w-3.5 h-3.5 text-white" weight="fill" />
                  </div>
                  Organizations
                </CardTitle>
                <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                  {organizations.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2 max-h-[350px] overflow-auto custom-scrollbar">
                {organizations.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No organizations registered yet</p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-primary-200 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{org.company_name}</p>
                          <p className="text-[10px] text-gray-500">{org.industry_type}</p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0">
                          {org.head_office_location}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                        <div className="bg-white rounded p-1.5 border border-gray-100">
                          <p className="text-emerald-600 font-bold text-xs">{org.user_count}</p>
                          <p className="text-[10px] text-gray-500">Users</p>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-gray-100">
                          <p className="text-primary-600 font-bold text-xs">{org.dealer_count}</p>
                          <p className="text-[10px] text-gray-500">Dealers</p>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-gray-100">
                          <p className="text-pink-600 font-bold text-xs">{org.territory_count}</p>
                          <p className="text-[10px] text-gray-500">Areas</p>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-gray-100">
                          <p className="text-amber-600 font-bold text-xs">{org.today_visits}</p>
                          <p className="text-[10px] text-gray-500">Today</p>
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
        <Card className="border-0 shadow-sm" data-testid="activity-card">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                  <Pulse className="w-3.5 h-3.5 text-white" weight="fill" />
                </div>
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 h-auto py-1 px-2">
                View All <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No recent activity</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>User</th>
                      <th>Dealer</th>
                      <th>Check-in</th>
                      <th>Outcome</th>
                      <th>Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.slice(0, 10).map((visit) => (
                      <tr key={visit.id}>
                        <td>
                          <span className="font-medium text-sm text-gray-800">{visit.company_name}</span>
                        </td>
                        <td className="text-xs text-gray-600">{visit.user_name}</td>
                        <td className="text-xs text-gray-600">{visit.dealer_name}</td>
                        <td className="font-mono text-xs text-gray-600">
                          {new Date(visit.check_in_time).toLocaleString()}
                        </td>
                        <td>
                          <Badge className={
                            visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                            visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                            visit.outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }>
                            {visit.outcome || 'In Progress'}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs font-medium text-primary-600">
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
