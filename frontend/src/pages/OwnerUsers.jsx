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
  Users,
  MagnifyingGlass,
  Phone,
  Envelope,
  Funnel,
  Crown,
  UserCircle,
  UserSquare,
  MapPin,
  Globe
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerUsers = () => {
  const { getAuthHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        axios.get(`${API}/owner/users`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() })
      ]);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesCompany = companyFilter === 'all' || user.company_id === companyFilter;
    return matchesSearch && matchesRole && matchesCompany;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'organization': return <Crown className="w-4 h-4" weight="fill" />;
      case 'admin': return <UserCircle className="w-4 h-4" weight="fill" />;
      case 'sales_executive': return <UserSquare className="w-4 h-4" weight="fill" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'organization': return 'from-amber-500 to-orange-600';
      case 'admin': return 'from-purple-500 to-indigo-600';
      case 'sales_executive': return 'from-emerald-500 to-teal-600';
      case 'owner': return 'from-red-500 to-rose-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'organization': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sales_executive': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'owner': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="All Users">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Users">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">All Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">Users across all organizations</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary-500"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Roles</SelectItem>
                <SelectItem value="organization" className="text-slate-900 focus:bg-slate-50">Super Admin</SelectItem>
                <SelectItem value="admin" className="text-slate-900 focus:bg-slate-50">Admin</SelectItem>
                <SelectItem value="sales_executive" className="text-slate-900 focus:bg-slate-50">Sales Executive</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
          <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredUsers.length} users
          </Badge>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                        {user.is_in_market && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Active in Market"></span>
                        )}
                      </div>
                      <Badge variant="outline" className={`${getRoleBadgeClass(user.role)} text-[10px] px-1.5 py-0 mb-1.5`}>
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </Badge>
                      <div className="space-y-0.5 text-[10px] text-gray-500">
                        <p className="flex items-center gap-1 truncate">
                          <Envelope className="w-2.5 h-2.5 flex-shrink-0 text-gray-400" /> 
                          <span className="truncate">{user.email}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 flex-shrink-0 text-gray-400" /> {user.mobile}
                        </p>
                        {user.company_name && (
                          <p className="flex items-center gap-1 text-purple-600 font-medium">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> 
                            <span className="truncate">{user.company_name}</span>
                          </p>
                        )}
                        {user.role === 'sales_executive' && (
                           <p className="flex items-center gap-1 text-gray-600">
                             {user.is_live_tracking ? (
                               <>
                                 <Globe className="w-3 h-3 text-emerald-500" />
                                 <span>Live Tracking</span>
                               </>
                             ) : (
                               <>
                                 <MapPin className="w-3 h-3 text-amber-500" />
                                 <span>{user.assigned_city || 'No City'}, {user.assigned_state}</span>
                               </>
                             )}
                           </p>
                        )}
                        {user.employee_code && (
                          <p className="font-mono text-gray-400">ID: {user.employee_code}</p>
                        )}
                      </div>
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

export default OwnerUsers;
