import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OwnerLayout from '../components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Crown,
  Buildings,
  Users,
  MagnifyingGlass,
  Phone,
  Envelope,
  MapPin,
  CaretDown,
  CaretUp,
  UsersFour
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '../components/ui/collapsible';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerSuperAdmins = () => {
  const { getAuthHeader } = useAuth();
  const [superAdmins, setSuperAdmins] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAdmins, setExpandedAdmins] = useState({});

  const fetchSuperAdmins = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/owner/super-admins`, { headers: getAuthHeader() });
      setSuperAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch super admins:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchSuperAdmins();
  }, [fetchSuperAdmins]);

  const fetchTeamMembers = async (companyId) => {
    if (teamMembers[companyId]) return;
    try {
      const response = await axios.get(`${API}/owner/users?company_id=${companyId}`, { headers: getAuthHeader() });
      setTeamMembers(prev => ({ ...prev, [companyId]: response.data.filter(u => u.role !== 'super_admin') }));
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const toggleAdminExpand = async (adminId, companyId) => {
    const isExpanding = !expandedAdmins[adminId];
    setExpandedAdmins(prev => ({
      ...prev,
      [adminId]: isExpanding
    }));
    if (isExpanding && companyId) {
      await fetchTeamMembers(companyId);
    }
  };

  const filteredAdmins = superAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.company?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <OwnerLayout title="Super Admins">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Super Admins">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search super admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500"
            />
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm">
            {filteredAdmins.length} super admins
          </Badge>
        </div>

        {/* Super Admins List */}
        <div className="space-y-4">
          {filteredAdmins.length === 0 ? (
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardContent className="p-8 text-center">
                <Crown className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No super admins found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAdmins.map((admin) => (
              <Collapsible 
                key={admin.id} 
                open={expandedAdmins[admin.id]}
                onOpenChange={() => toggleAdminExpand(admin.id, admin.company_id)}
              >
                <Card className="bg-slate-800/50 border-purple-500/20 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                              {admin.name}
                              <Crown className="w-4 h-4 text-amber-400" weight="fill" />
                            </CardTitle>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <Envelope className="w-3 h-3" />
                                {admin.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {admin.mobile}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex items-center gap-4">
                            {admin.company && (
                              <div className="text-right">
                                <p className="text-white font-medium">{admin.company.company_name}</p>
                                <p className="text-xs text-slate-500">{admin.company.industry_type}</p>
                              </div>
                            )}
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
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-purple-500/20 pt-4">
                      <div className="space-y-6">
                        {/* Company Details */}
                        {admin.company && (
                          <div className="bg-slate-700/30 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                              <Buildings className="w-4 h-4" /> Company Details
                            </p>
                            <div className="grid md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-slate-500">Company Name</p>
                                <p className="text-white">{admin.company.company_name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Industry</p>
                                <p className="text-white">{admin.company.industry_type}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Location</p>
                                <p className="text-white flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {admin.company.head_office_location}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">GST</p>
                                <p className="text-white font-mono text-sm">{admin.company.gst || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Team Members */}
                        <div>
                          <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Team Members
                          </p>
                          {teamMembers[admin.company_id] ? (
                            teamMembers[admin.company_id].length === 0 ? (
                              <p className="text-slate-500 text-sm">No team members yet</p>
                            ) : (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {teamMembers[admin.company_id].map((member) => (
                                  <div key={member.id} className="bg-slate-700/30 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                        member.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                                      }`}>
                                        {member.name.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{member.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{member.role.replace('_', ' ')}</p>
                                      </div>
                                      {member.is_in_market && (
                                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Active</Badge>
                                      )}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                                      <p className="flex items-center gap-1 truncate">
                                        <Envelope className="w-3 h-3" /> {member.email}
                                      </p>
                                      <p className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {member.mobile}
                                      </p>
                                      {member.employee_code && (
                                        <p className="font-mono">Code: {member.employee_code}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                            </div>
                          )}
                        </div>
                      </div>
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

export default OwnerSuperAdmins;
