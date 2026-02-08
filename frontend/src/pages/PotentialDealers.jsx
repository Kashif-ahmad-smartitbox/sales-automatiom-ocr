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
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Buildings size={24} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Potentials</p>
                        <h3 className="text-2xl font-bold text-slate-900">{potentials.length}</h3>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Content */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Potential Dealer</th>
                            <th className="px-6 py-4">Location / Address</th>
                            <th className="px-6 py-4">Found By</th>
                            <th className="px-6 py-4">Date Found</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex justify-center items-center gap-2 text-slate-500">
                                        <div className="spinner w-5 h-5" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPotentials.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    {searchTerm ? 'No matches found.' : 'No potential dealers found yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredPotentials.map((item) => (
                                <tr key={item._id || item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800 text-base">{item.place_name}</div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">ID: {item.place_id.substring(0, 10)}...</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                            <span className="truncate-2-lines line-clamp-2" title={item.address}>{item.address || 'Address not available'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {item.found_by_name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-700">{item.found_by_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 pl-6">
                                            {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
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
