import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
  };

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

  const getTerritoryName = (id) => territories.find(t => t.id === id)?.name || 'Unknown';

  return (
    <AdminLayout title="Dealer Management">
      <div className="space-y-6" data-testid="dealer-management">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-dealer-btn">
                <Plus className="mr-2" size={18} />
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
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="dealer-submit-btn">
                    {editingId ? 'Update Dealer' : 'Add Dealer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Dealers</p>
              <p className="text-2xl font-bold font-mono">{dealers.length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Retailers</p>
              <p className="text-2xl font-bold font-mono">{dealers.filter(d => d.dealer_type === 'Retailer').length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Distributors</p>
              <p className="text-2xl font-bold font-mono">{dealers.filter(d => d.dealer_type === 'Distributor').length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">High Priority</p>
              <p className="text-2xl font-bold font-mono">{dealers.filter(d => d.priority_level === 1).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Dealers Table */}
        <Card data-testid="dealers-table-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
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
                            <p className="font-medium">{dealer.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin size={12} />
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
                        <td className="font-mono text-sm">
                          {dealer.last_visit_date ? new Date(dealer.last_visit_date).toLocaleDateString() : 'Never'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(dealer)}
                              data-testid={`edit-dealer-${dealer.id}`}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => handleDelete(dealer.id)}
                              data-testid={`delete-dealer-${dealer.id}`}
                            >
                              <Trash size={16} />
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
