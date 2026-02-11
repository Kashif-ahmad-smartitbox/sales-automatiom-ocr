import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MagnifyingGlass, MapPin, Calendar, User, Buildings } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PotentialDealers = () => {
  const { getAuthHeader } = useAuth();
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/visit/potentials`, { headers: getAuthHeader() });
      setPotentials(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch potential dealers');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPotentials = potentials.filter(p => 
    p.place_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.found_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Potential Dealers">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Potential Dealers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Leads discovered by field team</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name, address or executive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchData}>
             Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white/90">Total Potentials</span>
                        <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                            <Buildings size={14} weight="fill" />
                        </div>
                    </div>
                    <div className="text-lg font-bold font-mono">{potentials.length}</div>
                    <p className="text-[10px] text-white/80 mt-0.5">Discovered leads</p>
                </CardContent>
            </Card>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Potential Dealer</th>
                            <th>Location / Address</th>
                            <th>Found By</th>
                            <th>Date Found</th>
                            <th className="text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center">
                                    <div className="flex justify-center items-center gap-2 text-xs text-gray-500">
                                        <div className="spinner w-4 h-4" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPotentials.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-xs text-gray-500">
                                    {searchTerm ? 'No matches found.' : 'No potential dealers found yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredPotentials.map((item) => (
                                <tr key={item._id || item.id}>
                                    <td>
                                        <div className="font-medium text-sm text-gray-800">{item.place_name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {item.place_id.substring(0, 10)}...</div>
                                    </td>
                                    <td className="max-w-xs">
                                        <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                            <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400" />
                                            <span className="line-clamp-2" title={item.address}>{item.address || 'Address not available'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                {item.found_by_name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{item.found_by_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Calendar size={12} className="text-gray-400" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 pl-5">
                                            {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                                            New Lead
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PotentialDealers;
