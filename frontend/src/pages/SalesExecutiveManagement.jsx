import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, MagnifyingGlass, Trash, MapPin, Phone, Pencil } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  employee_code: '',
  territory_ids: [],
  product_category_access: []
};

const SalesExecutiveManagement = () => {
  const { getAuthHeader } = useAuth();
  const [executives, setExecutives] = useState([]);
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
      const [execsRes, territoriesRes] = await Promise.all([
        axios.get(`${API}/sales-executives`, { headers: getAuthHeader() }),
        axios.get(`${API}/territories`, { headers: getAuthHeader() })
      ]);
      setExecutives(execsRes.data);
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
      if (editingId) {
        // Update territory assignment
        await axios.put(`${API}/sales-executives/${editingId}/assign-territory`, formData.territory_ids, { headers: getAuthHeader() });
        toast.success('Sales executive updated');
      } else {
        await axios.post(`${API}/sales-executives`, formData, { headers: getAuthHeader() });
        toast.success('Sales executive added');
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (exec) => {
    setEditingId(exec.id);
    setFormData({
      name: exec.name,
      email: exec.email,
      mobile: exec.mobile,
      password: '', // Don't pre-fill password
      employee_code: exec.employee_code || '',
      territory_ids: exec.territory_ids || [],
      product_category_access: exec.product_category_access || []
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales executive?')) return;
    try {
      await axios.delete(`${API}/sales-executives/${id}`, { headers: getAuthHeader() });
      toast.success('Sales executive deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete executive');
    }
  };

  const toggleTerritory = (id) => {
    setFormData(prev => ({
      ...prev,
      territory_ids: prev.territory_ids.includes(id)
        ? prev.territory_ids.filter(t => t !== id)
        : [...prev.territory_ids, id]
    }));
  };

  const getStatus = (exec) => {
    if (exec.is_in_market) return 'active';
    if (exec.last_location_update) {
      const lastUpdate = new Date(exec.last_location_update);
      const now = new Date();
      const diffMinutes = (now - lastUpdate) / (1000 * 60);
      if (diffMinutes < 30) return 'idle';
    }
    return 'offline';
  };

  const getTerritoryNames = (ids) => {
    return ids?.map(id => territories.find(t => t.id === id)?.name).filter(Boolean).join(', ') || 'None';
  };

  const filteredExecutives = executives.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Sales Team">
      <div className="space-y-6" data-testid="sales-executive-management">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="executive-search"
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-executive-btn">
                <Plus className="mr-2" size={18} />
                Add Sales Executive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Sales Executive' : 'Add Sales Executive'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required={!editingId}
                      disabled={editingId}
                      data-testid="executive-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input
                      value={formData.employee_code}
                      onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                      placeholder="EMP001"
                      required={!editingId}
                      disabled={editingId}
                      data-testid="executive-code-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="+91 98765 43210"
                      required={!editingId}
                      disabled={editingId}
                      data-testid="executive-mobile-input"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required={!editingId}
                      disabled={editingId}
                      data-testid="executive-email-input"
                    />
                  </div>

                  {!editingId && (
                    <div className="col-span-2 space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                        data-testid="executive-password-input"
                      />
                    </div>
                  )}

                  <div className="col-span-2 space-y-2">
                    <Label>Assign Territories</Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {territories.length === 0 ? (
                        <p className="text-sm text-slate-500">No territories defined yet</p>
                      ) : (
                        territories.map((t) => (
                          <div key={t.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={t.id}
                              checked={formData.territory_ids.includes(t.id)}
                              onCheckedChange={() => toggleTerritory(t.id)}
                            />
                            <label htmlFor={t.id} className="text-sm cursor-pointer">
                              {t.name} <span className="text-slate-400">({t.type})</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="executive-submit-btn">
                    {editingId ? 'Update Executive' : 'Add Executive'}
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
              <p className="text-sm text-slate-500">Total Team</p>
              <p className="text-2xl font-bold font-mono">{executives.length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Active Now</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">{executives.filter(e => e.is_in_market).length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Idle</p>
              <p className="text-2xl font-bold font-mono text-amber-600">{executives.filter(e => getStatus(e) === 'idle').length}</p>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Offline</p>
              <p className="text-2xl font-bold font-mono text-slate-400">{executives.filter(e => getStatus(e) === 'offline').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Executives Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredExecutives.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              {searchTerm ? 'No executives match your search' : 'No sales executives added yet. Click "Add Sales Executive" to get started.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExecutives.map((exec) => {
              const status = getStatus(exec);
              return (
                <Card key={exec.id} className="hover:border-blue-300 transition-colors" data-testid={`executive-card-${exec.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                          {exec.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{exec.name}</p>
                          <p className="text-sm text-slate-500 font-mono">{exec.employee_code}</p>
                        </div>
                      </div>
                      <Badge className={
                        status === 'active' ? 'status-active' : status === 'idle' ? 'status-idle' : 'status-offline'
                      }>
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} />
                        <span>{exec.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} />
                        <span className="truncate">{getTerritoryNames(exec.territory_ids) || 'No territories assigned'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(exec)}
                        data-testid={`edit-executive-${exec.id}`}
                      >
                        <Pencil size={16} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(exec.id)}
                        data-testid={`delete-executive-${exec.id}`}
                      >
                        <Trash size={16} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SalesExecutiveManagement;
