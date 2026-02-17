import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MagnifyingGlass, MapPin, Calendar, User, Buildings, Check } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PotentialDealers = () => {
  const { getAuthHeader } = useAuth();
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPotential, setSelectedPotential] = useState(null);
  const [selectedExecutive, setSelectedExecutive] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [potentialsRes, executivesRes] = await Promise.all([
        axios.get(`${API}/visit/potentials`, { headers: getAuthHeader() }),
        axios.get(`${API}/sales-executives`, { headers: getAuthHeader() })
      ]);
      setPotentials(potentialsRes.data);
      setSalesExecutives(executivesRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignClick = (potential) => {
    setSelectedPotential(potential);
    setSelectedExecutive(potential.assigned_to || '');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedExecutive) {
      toast.error('Please select a sales executive');
      return;
    }

    console.log('=== Assigning Potential ===');
    console.log('Potential:', selectedPotential);
    console.log('Potential ID:', selectedPotential.id);
    console.log('Sales Executive ID:', selectedExecutive);

    try {
      const response = await axios.put(
        `${API}/visit/potentials/${selectedPotential.id}/assign`,
        { sales_executive_id: selectedExecutive },
        { headers: getAuthHeader() }
      );
      console.log('Assignment response:', response.data);
      toast.success('Potential dealer assigned successfully');
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Assignment error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to assign potential dealer');
    }
  };

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
                            <th>Assigned To</th>
                            <th className="text-center">Assign</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center">
                                    <div className="flex justify-center items-center gap-2 text-xs text-gray-500">
                                        <div className="spinner w-4 h-4" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPotentials.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-xs text-gray-500">
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
                                    <td>
                                        {item.is_assigned ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                                                    Assigned
                                                </Badge>
                                                <span className="text-xs text-gray-600">{item.assigned_to_name}</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0">
                                                Unassigned
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <Button
                                            variant={item.is_assigned ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleAssignClick(item)}
                                            className="h-7 px-2"
                                        >
                                            {item.is_assigned ? (
                                                <>
                                                    <Check size={14} className="mr-1" />
                                                    Reassign
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={14} className="mr-1" />
                                                    Assign
                                                </>
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Potential Dealer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700">Dealer Name</Label>
              <div className="text-sm font-semibold text-gray-900 mt-1">{selectedPotential?.place_name}</div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Address</Label>
              <div className="text-xs text-gray-600 mt-1">{selectedPotential?.address}</div>
            </div>
            <div>
              <Label htmlFor="executive" className="text-xs font-medium text-gray-700">Select Sales Executive</Label>
              <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a sales executive" />
                </SelectTrigger>
                <SelectContent>
                  {salesExecutives.map((exec) => (
                    <SelectItem key={exec.id} value={exec.id}>
                      {exec.name} - {exec.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PotentialDealers;
