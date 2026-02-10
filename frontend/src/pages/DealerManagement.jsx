import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, MagnifyingGlass, MapPin, Trash, Pencil } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  dealer_type: 'Retailer',
  category_mapping: [],
  lat: '',
  lng: '',
  address: '',
  territory_id: '',
  visit_frequency: 'Weekly',
  priority_level: 1,
  contact_person: '',
  phone: ''
};

const DealerManagement = () => {
  const { getAuthHeader } = useAuth();
  const [dealers, setDealers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [dealersRes, territoriesRes] = await Promise.all([
        axios.get(`${API}/dealers`, { headers: getAuthHeader() }),
        axios.get(`${API}/territories`, { headers: getAuthHeader() })
      ]);
      setDealers(dealersRes.data);
      setTerritories(territoriesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        priority_level: parseInt(formData.priority_level)
      };

      if (editingId) {
        await axios.put(`${API}/dealers/${editingId}`, payload, { headers: getAuthHeader() });
        toast.success('Dealer updated successfully');
      } else {
        await axios.post(`${API}/dealers`, payload, { headers: getAuthHeader() });
        toast.success('Dealer added successfully');
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (dealer) => {
    setEditingId(dealer.id);
    setFormData({
      name: dealer.name,
      dealer_type: dealer.dealer_type,
      category_mapping: dealer.category_mapping || [],
      lat: dealer.lat.toString(),
      lng: dealer.lng.toString(),
      address: dealer.address,
      territory_id: dealer.territory_id,
      visit_frequency: dealer.visit_frequency,
      priority_level: dealer.priority_level,
      contact_person: dealer.contact_person || '',
      phone: dealer.phone || ''
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dealer?')) return;
    try {
      await axios.delete(`${API}/dealers/${id}`, { headers: getAuthHeader() });
      toast.success('Dealer deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete dealer');
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTerritoryName = (id) => {
      if (!id) return 'Unknown';
      const t = territories.find(t => t.id === id);
      if (t) return t.name;
      // Fallback: If ID is not found, it might be the Name itself (legacy data)
      // Check if any territory matches this Name
      const tByName = territories.find(t => t.name.toLowerCase() === id.toLowerCase());
      if (tByName) return tByName.name;
      
      // Look like a name? Return it.
      if (id.length < 30 && !id.includes('-')) return id;
      
      return 'Unknown';
  };

  return (
    <AdminLayout title="Dealer Management">
      <div className="space-y-4" data-testid="dealer-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Dealer Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your dealer network</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="dealer-search"
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-sm text-xs h-8" data-testid="add-dealer-btn">
                <Plus className="mr-1" size={14} />
                Add Dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Dealer' : 'Add New Dealer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Dealer Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      data-testid="dealer-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dealer Type *</Label>
                    <Select value={formData.dealer_type} onValueChange={(val) => setFormData({...formData, dealer_type: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retailer">Retailer</SelectItem>
                        <SelectItem value="Distributor">Distributor</SelectItem>
                        <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Territory *</Label>
                    <Select value={formData.territory_id} onValueChange={(val) => setFormData({...formData, territory_id: val})}>
                      <SelectTrigger data-testid="dealer-territory-select">
                        <SelectValue placeholder="Select Territory" />
                      </SelectTrigger>
                      <SelectContent>
                        {territories.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Address *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      data-testid="dealer-address-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Latitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({...formData, lat: e.target.value})}
                      placeholder="19.0760"
                      required
                      data-testid="dealer-lat-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Longitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({...formData, lng: e.target.value})}
                      placeholder="72.8777"
                      required
                      data-testid="dealer-lng-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Visit Frequency</Label>
                    <Select value={formData.visit_frequency} onValueChange={(val) => setFormData({...formData, visit_frequency: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select value={formData.priority_level.toString()} onValueChange={(val) => setFormData({...formData, priority_level: parseInt(val)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">High</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md" data-testid="dealer-submit-btn">
                    {editingId ? 'Update Dealer' : 'Add Dealer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - gradient cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total Dealers</span>
              <div className="text-lg font-bold font-mono mt-1">{dealers.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Retailers</span>
              <div className="text-lg font-bold font-mono mt-1">{dealers.filter(d => d.dealer_type === 'Retailer').length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Distributors</span>
              <div className="text-lg font-bold font-mono mt-1">{dealers.filter(d => d.dealer_type === 'Distributor').length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">High Priority</span>
              <div className="text-lg font-bold font-mono mt-1">{dealers.filter(d => d.priority_level === 1).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dealers Table */}
        <Card className="border-0 shadow-sm" data-testid="dealers-table-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                {searchTerm ? 'No dealers match your search' : 'No dealers added yet. Click "Add Dealer" to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dealer</th>
                      <th>Type</th>
                      <th>Territory</th>
                      <th>Frequency</th>
                      <th>Priority</th>
                      <th>Last Visit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDealers.map((dealer) => (
                      <tr key={dealer.id}>
                        <td>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{dealer.name}</p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />
                              {dealer.address}
                            </p>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline">{dealer.dealer_type}</Badge>
                        </td>
                        <td>{getTerritoryName(dealer.territory_id)}</td>
                        <td>{dealer.visit_frequency}</td>
                        <td>
                          <Badge className={
                            dealer.priority_level === 1 ? 'priority-high' :
                            dealer.priority_level === 2 ? 'priority-medium' : 'priority-low'
                          }>
                            {dealer.priority_level === 1 ? 'High' : dealer.priority_level === 2 ? 'Medium' : 'Low'}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs text-gray-600">
                          {dealer.last_visit_date ? new Date(dealer.last_visit_date).toLocaleDateString() : 'Never'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 h-7 w-7 p-0"
                              onClick={() => handleEdit(dealer)}
                              data-testid={`edit-dealer-${dealer.id}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0" 
                              onClick={() => handleDelete(dealer.id)}
                              data-testid={`delete-dealer-${dealer.id}`}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DealerManagement;
