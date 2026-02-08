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
  Storefront,
  MagnifyingGlass,
  Phone,
  MapPin,
  Funnel,
  Buildings,
  Calendar,
  Star
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerDealers = () => {
  const { getAuthHeader } = useAuth();
  const [dealers, setDealers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [orgsRes] = await Promise.all([
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() })
      ]);
      setOrganizations(orgsRes.data);
      
      // Fetch dealers from all organizations
      const allDealers = [];
      for (const org of orgsRes.data) {
        try {
          const orgDetails = await axios.get(`${API}/owner/organizations/${org.id}`, { headers: getAuthHeader() });
          if (orgDetails.data.dealers) {
            orgDetails.data.dealers.forEach(dealer => {
              allDealers.push({ ...dealer, company_name: org.company_name });
            });
          }
        } catch (e) {
          console.error(`Failed to fetch dealers for org ${org.id}:`, e);
        }
      }
      setDealers(allDealers);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = 
      dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || dealer.company_id === companyFilter;
    const matchesType = typeFilter === 'all' || dealer.dealer_type === typeFilter;
    return matchesSearch && matchesCompany && matchesType;
  });

  const dealerTypes = [...new Set(dealers.map(d => d.dealer_type))];

  const getPriorityStars = (priority) => {
    return Array(priority || 1).fill(0).map((_, i) => (
      <Star key={i} className="w-3 h-3 text-amber-500" weight="fill" />
    ));
  };

  if (loading) {
    return (
      <OwnerLayout title="All Dealers">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Dealers">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search dealers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
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
                <SelectValue placeholder="Dealer Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 focus:bg-slate-50">All Types</SelectItem>
                {dealerTypes.map(type => (
                  <SelectItem key={type} value={type} className="text-slate-900 focus:bg-slate-50">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm whitespace-nowrap">
            {filteredDealers.length} dealers
          </Badge>
        </div>

        {/* Dealers Grid */}
        {filteredDealers.length === 0 ? (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-8 text-center">
              <Storefront className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No dealers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDealers.map((dealer) => (
              <Card key={dealer.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                      <Storefront className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-slate-900 font-medium truncate">{dealer.name}</p>
                        <div className="flex">{getPriorityStars(dealer.priority_level)}</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mb-2 hover:bg-blue-200">
                        {dealer.dealer_type}
                      </Badge>
                      <div className="space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" /> 
                          <span className="truncate">{dealer.address}</span>
                        </p>
                        {dealer.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" /> {dealer.phone}
                          </p>
                        )}
                        {dealer.contact_person && (
                          <p className="text-slate-500">Contact: <span className="text-slate-700 font-medium">{dealer.contact_person}</span></p>
                        )}
                        <p className="flex items-center gap-1 text-purple-600 font-medium">
                          <Buildings className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{dealer.company_name}</span>
                        </p>
                        <div className="flex gap-3 pt-1">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {dealer.visit_frequency}
                          </span>
                          {dealer.last_visit_date && (
                            <span className="text-slate-500 text-xs">
                              Last: {new Date(dealer.last_visit_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
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

export default OwnerDealers;
