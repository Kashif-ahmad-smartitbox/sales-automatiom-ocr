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
  MapPin
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
      case 'super_admin': return <Crown className="w-4 h-4" weight="fill" />;
      case 'admin': return <UserCircle className="w-4 h-4" weight="fill" />;
      case 'sales_executive': return <UserSquare className="w-4 h-4" weight="fill" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'from-amber-500 to-orange-600';
      case 'admin': return 'from-purple-500 to-indigo-600';
      case 'sales_executive': return 'from-emerald-500 to-teal-600';
      case 'owner': return 'from-red-500 to-rose-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'sales_executive': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'owner': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="All Users">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Users">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-purple-500/20 text-white">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/20">
                <SelectItem value="all" className="text-white">All Roles</SelectItem>
                <SelectItem value="super_admin" className="text-white">Super Admin</SelectItem>
                <SelectItem value="admin" className="text-white">Admin</SelectItem>
                <SelectItem value="sales_executive" className="text-white">Sales Executive</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-sm whitespace-nowrap">
            {filteredUsers.length} users
          </Badge>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        {user.is_in_market && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                        )}
                      </div>
                      <Badge className={`${getRoleBadgeClass(user.role)} text-xs mb-2`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                      </Badge>
                      <div className="space-y-1 text-xs text-slate-400">
                        <p className="flex items-center gap-1 truncate">
                          <Envelope className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{user.email}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" /> {user.mobile}
                        </p>
                        {user.company_name && (
                          <p className="flex items-center gap-1 text-purple-400">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> 
                            <span className="truncate">{user.company_name}</span>
                          </p>
                        )}
                        {user.employee_code && (
                          <p className="font-mono text-slate-500">ID: {user.employee_code}</p>
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
