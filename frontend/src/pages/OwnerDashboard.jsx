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
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-400'
    },
    { 
      icon: Crown, 
      label: 'Super Admins', 
      value: stats?.total_super_admins || 0,
      subtext: `Managing ${stats?.total_users || 0} users`,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400'
    },
    { 
      icon: Users, 
      label: 'Total Users', 
      value: stats?.total_users || 0,
      subtext: `${stats?.total_sales_executives || 0} field reps`,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400'
    },
    { 
      icon: Storefront, 
      label: 'Total Dealers', 
      value: stats?.total_dealers || 0,
      subtext: 'Across all territories',
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-400'
    },
    { 
      icon: MapPin, 
      label: 'Territories', 
      value: stats?.total_territories || 0,
      subtext: 'Coverage areas',
      color: 'from-pink-500 to-rose-600',
      textColor: 'text-pink-400'
    },
    { 
      icon: Target, 
      label: 'Total Visits', 
      value: stats?.total_visits || 0,
      subtext: `${stats?.today_visits || 0} today`,
      color: 'from-violet-500 to-purple-600',
      textColor: 'text-violet-400'
    },
    { 
      icon: Pulse, 
      label: 'Active in Market', 
      value: stats?.active_in_market || 0,
      subtext: 'Currently working',
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-400'
    },
    { 
      icon: ChartLineUp, 
      label: 'Today\'s Visits', 
      value: stats?.today_visits || 0,
      subtext: 'Completed today',
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400'
    },
  ];

  if (loading) {
    return (
      <OwnerLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
            <Card key={idx} className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm" data-testid={`owner-stat-card-${idx}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white font-mono">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" weight="duotone" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Super Admins with Teams */}
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="super-admins-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" weight="duotone" />
                  Super Admins & Teams
                </CardTitle>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
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
                      <div className="bg-slate-700/50 rounded-lg border border-purple-500/20 overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-slate-700/80 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                                {admin.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-white">{admin.name}</p>
                                <p className="text-xs text-slate-400">{admin.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
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
                          <div className="px-4 pb-4 space-y-3 border-t border-purple-500/20 pt-4">
                            {/* Company Info */}
                            {admin.company && (
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                  <Buildings className="w-3 h-3" /> Company Details
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-slate-400 text-xs">Company</p>
                                    <p className="text-white">{admin.company.company_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs">Industry</p>
                                    <p className="text-white">{admin.company.industry_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs">Location</p>
                                    <p className="text-white">{admin.company.head_office_location}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-xs">GST</p>
                                    <p className="text-white font-mono text-xs">{admin.company.gst || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
                                <p className="text-emerald-400 font-bold">{admin.team_member_count}</p>
                                <p className="text-xs text-slate-400">Team</p>
                              </div>
                              <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
                                <p className="text-blue-400 font-bold">{admin.company?.id ? '–' : '–'}</p>
                                <p className="text-xs text-slate-400">Dealers</p>
                              </div>
                              <div className="bg-purple-500/10 rounded-lg p-2 text-center border border-purple-500/20">
                                <p className="text-purple-400 font-bold">{admin.company?.id ? '–' : '–'}</p>
                                <p className="text-xs text-slate-400">Visits</p>
                              </div>
                            </div>
                            {/* Actions */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
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
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="organizations-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Buildings className="w-5 h-5 text-purple-400" weight="duotone" />
                  Organizations
                </CardTitle>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
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
                    <div key={org.id} className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">{org.company_name}</p>
                          <p className="text-xs text-slate-400">{org.industry_type}</p>
                        </div>
                        <Badge className="bg-slate-600/50 text-slate-300">
                          {org.head_office_location}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-emerald-400 font-bold text-sm">{org.user_count}</p>
                          <p className="text-xs text-slate-500">Users</p>
                        </div>
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-blue-400 font-bold text-sm">{org.dealer_count}</p>
                          <p className="text-xs text-slate-500">Dealers</p>
                        </div>
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-pink-400 font-bold text-sm">{org.territory_count}</p>
                          <p className="text-xs text-slate-500">Areas</p>
                        </div>
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-amber-400 font-bold text-sm">{org.today_visits}</p>
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
        <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="activity-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Pulse className="w-5 h-5 text-emerald-400" weight="duotone" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
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
                    <tr className="text-slate-400 text-left border-b border-purple-500/20">
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Dealer</th>
                      <th className="pb-3 font-medium">Check-in</th>
                      <th className="pb-3 font-medium">Outcome</th>
                      <th className="pb-3 font-medium">Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {recentActivity.slice(0, 10).map((visit) => (
                      <tr key={visit.id} className="text-slate-300 hover:bg-slate-700/30 transition-colors">
                        <td className="py-3">
                          <span className="font-medium text-white">{visit.company_name}</span>
                        </td>
                        <td className="py-3">{visit.user_name}</td>
                        <td className="py-3">{visit.dealer_name}</td>
                        <td className="py-3 font-mono text-xs">
                          {new Date(visit.check_in_time).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <Badge className={
                            visit.outcome === 'Order Booked' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            visit.outcome === 'Follow-up Required' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            visit.outcome === 'Lost Visit' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }>
                            {visit.outcome || 'In Progress'}
                          </Badge>
                        </td>
                        <td className="py-3 font-mono">
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
