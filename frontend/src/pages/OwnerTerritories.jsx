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
  MapPin,
  MagnifyingGlass,
  Funnel,
  Buildings,
  TreeStructure
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerTerritories = () => {
  const { getAuthHeader } = useAuth();
  const [territories, setTerritories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const orgsRes = await axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() });
      setOrganizations(orgsRes.data);
      
      // Fetch territories from all organizations
      const allTerritories = [];
      for (const org of orgsRes.data) {
        try {
          const orgDetails = await axios.get(`${API}/owner/organizations/${org.id}`, { headers: getAuthHeader() });
          if (orgDetails.data.territories) {
            orgDetails.data.territories.forEach(territory => {
              allTerritories.push({ ...territory, company_name: org.company_name });
            });
          }
        } catch (e) {
          console.error(`Failed to fetch territories for org ${org.id}:`, e);
        }
      }
      setTerritories(allTerritories);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTerritories = territories.filter(territory => {
    const matchesSearch = 
      territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      territory.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || territory.company_id === companyFilter;
    const matchesType = typeFilter === 'all' || territory.type === typeFilter;
    return matchesSearch && matchesCompany && matchesType;
  });

  const territoryTypes = [...new Set(territories.map(t => t.type))];

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'state': return 'from-red-500 to-rose-600';
      case 'city': return 'from-blue-500 to-cyan-600';
      case 'area': return 'from-emerald-500 to-teal-600';
      case 'beat': return 'from-amber-500 to-orange-600';
      default: return 'from-purple-500 to-indigo-600';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'state': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'city': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'area': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'beat': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  // Build parent name lookup
  const territoryNameMap = territories.reduce((acc, t) => {
    acc[t.id] = t.name;
    return acc;
  }, {});

  if (loading) {
    return (
      <OwnerLayout title="All Territories">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Territories">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search territories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500"
              />
            </div>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40 bg-slate-800/50 border-purple-500/20 text-white">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Territory Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/20">
                <SelectItem value="all" className="text-white">All Types</SelectItem>
                {territoryTypes.map(type => (
                  <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-sm whitespace-nowrap">
            {filteredTerritories.length} territories
          </Badge>
        </div>

        {/* Territories Grid */}
        {filteredTerritories.length === 0 ? (
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No territories found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTerritories.map((territory) => (
              <Card key={territory.id} className="bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(territory.type)} flex items-center justify-center text-white flex-shrink-0`}>
                      <MapPin className="w-5 h-5" weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate mb-1">{territory.name}</p>
                      <Badge className={`${getTypeBadgeClass(territory.type)} text-xs mb-2`}>
                        {territory.type}
                      </Badge>
                      <div className="space-y-1 text-xs text-slate-400">
                        {territory.parent_id && (
                          <p className="flex items-center gap-1">
                            <TreeStructure className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Parent: {territoryNameMap[territory.parent_id] || 'Unknown'}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-purple-400">
                          <Buildings className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{territory.company_name}</span>
                        </p>
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

export default OwnerTerritories;
