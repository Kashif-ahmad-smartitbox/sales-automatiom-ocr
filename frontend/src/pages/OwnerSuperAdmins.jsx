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
      setTeamMembers(prev => ({ ...prev, [companyId]: response.data.filter(u => u.role !== 'organization') }));
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
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Super Admins">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Super Admins</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage organization administrators</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search super admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary-500"
            />
          </div>
          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
            {filteredAdmins.length} super admins
          </Badge>
        </div>

        {/* Super Admins List */}
        <div className="space-y-3">
          {filteredAdmins.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Crown className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No super admins found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAdmins.map((admin) => (
              <Collapsible 
                key={admin.id} 
                open={expandedAdmins[admin.id]}
                onOpenChange={() => toggleAdminExpand(admin.id, admin.company_id)}
              >
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                              {admin.name}
                              <Crown className="w-3.5 h-3.5 text-amber-500" weight="fill" />
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <Envelope className="w-2.5 h-2.5" />
                                {admin.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {admin.mobile}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex items-center gap-3">
                            {admin.company && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-800">{admin.company.company_name}</p>
                                <p className="text-[10px] text-gray-500">{admin.company.industry_type}</p>
                              </div>
                            )}
                            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                              <UsersFour className="w-2.5 h-2.5 mr-0.5" />
                              {admin.team_member_count}
                            </Badge>
                          </div>
                          {expandedAdmins[admin.id] ? (
                            <CaretUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <CaretDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-gray-100 bg-gray-50/50 pt-3">
                      <div className="space-y-4">
                        {/* Company Details */}
                        {admin.company && (
                          <div className="bg-white border border-gray-100 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                              <Buildings className="w-3 h-3" /> Company Details
                            </p>
                            <div className="grid md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Company</p>
                                <p className="text-sm text-gray-800 font-medium">{admin.company.company_name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Industry</p>
                                <p className="text-sm text-gray-800 font-medium">{admin.company.industry_type}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Location</p>
                                <p className="text-sm text-gray-800 font-medium flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                  {admin.company.head_office_location}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">GST</p>
                                <p className="text-sm text-gray-800 font-mono font-medium">{admin.company.gst || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Team Members */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Team Members
                          </p>
                          {teamMembers[admin.company_id] ? (
                            teamMembers[admin.company_id].length === 0 ? (
                              <p className="text-xs text-gray-500 italic">No team members yet</p>
                            ) : (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {teamMembers[admin.company_id].map((member) => (
                                  <div key={member.id} className="bg-white border border-gray-100 rounded-lg p-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                        member.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                                      }`}>
                                        {member.name.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-medium truncate">{member.name}</p>
                                        <p className="text-[10px] text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                                      </div>
                                      {member.is_in_market && (
                                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1 py-0">Active</Badge>
                                      )}
                                    </div>
                                    <div className="mt-1.5 text-[10px] text-gray-500 space-y-0.5">
                                      <p className="flex items-center gap-1 truncate">
                                        <Envelope className="w-2.5 h-2.5 text-gray-400" /> {member.email}
                                      </p>
                                      <p className="flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5 text-gray-400" /> {member.mobile}
                                      </p>
                                      {member.employee_code && (
                                        <p className="font-mono text-gray-400">Code: {member.employee_code}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <div className="spinner"></div>
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
