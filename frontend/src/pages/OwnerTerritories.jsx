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
      case 'state': return 'bg-red-100 text-red-600';
      case 'city': return 'bg-primary-100 text-primary-600';
      case 'area': return 'bg-emerald-100 text-emerald-600';
      case 'beat': return 'bg-amber-100 text-amber-600';
      default: return 'bg-purple-100 text-purple-600';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'state': return 'bg-red-100 text-red-700 border-red-200';
      case 'city': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'area': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'beat': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
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
          <div className="spinner"></div>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Territory Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Types</SelectItem>
                {territoryTypes.map(type => (
                  <SelectItem key={type} value={type} className="text-slate-900 focus:bg-slate-50">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200 text-sm whitespace-nowrap">
            {filteredTerritories.length} territories
          </Badge>
        </div>

        {/* Territories Grid */}
        {filteredTerritories.length === 0 ? (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No territories found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTerritories.map((territory) => (
              <Card key={territory.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getTypeColor(territory.type)} flex items-center justify-center font-bold flex-shrink-0`}>
                      <MapPin className="w-5 h-5" weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate mb-1">{territory.name}</p>
                      <Badge variant="outline" className={`${getTypeBadgeClass(territory.type)} text-xs mb-2`}>
                        {territory.type}
                      </Badge>
                      <div className="space-y-1 text-xs text-slate-500">
                        {territory.parent_id && (
                          <p className="flex items-center gap-1">
                            <TreeStructure className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate">Parent: <span className="text-slate-700 font-medium">{territoryNameMap[territory.parent_id] || 'Unknown'}</span></span>
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-purple-600 font-medium">
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
