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
import { Plus, TreeStructure, Trash, Pencil } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  type: 'State',
  parent_id: '',
  lat: '',
  lng: ''
};

const TerritoryManagement = () => {
  const { getAuthHeader } = useAuth();
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchTerritories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/territories`, { headers: getAuthHeader() });
      setTerritories(res.data);
    } catch (error) {
      toast.error('Failed to fetch territories');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id === 'none' || !formData.parent_id ? null : formData.parent_id,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null
      };

      if (editingId) {
        await axios.put(`${API}/territories/${editingId}`, payload, { headers: getAuthHeader() });
        toast.success('Territory updated');
      } else {
        await axios.post(`${API}/territories`, payload, { headers: getAuthHeader() });
        toast.success('Territory created');
      }
      closeDialog();
      fetchTerritories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (territory) => {
    setEditingId(territory.id);
    setFormData({
      name: territory.name,
      type: territory.type,
      parent_id: territory.parent_id || 'none',
      lat: territory.lat?.toString() || '',
      lng: territory.lng?.toString() || ''
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will also affect child territories.')) return;
    try {
      await axios.delete(`${API}/territories/${id}`, { headers: getAuthHeader() });
      toast.success('Territory deleted');
      fetchTerritories();
    } catch (error) {
      toast.error('Failed to delete territory');
    }
  };

  const getParentName = (id) => territories.find(t => t.id === id)?.name || '-';
  
  const typeColors = {
    State: 'bg-purple-100 text-purple-700',
    City: 'bg-blue-100 text-blue-700',
    Area: 'bg-emerald-100 text-emerald-700',
    Beat: 'bg-amber-100 text-amber-700'
  };

  const groupedTerritories = {
    State: territories.filter(t => t.type === 'State'),
    City: territories.filter(t => t.type === 'City'),
    Area: territories.filter(t => t.type === 'Area'),
    Beat: territories.filter(t => t.type === 'Beat')
  };

  return (
    <AdminLayout title="Territory Management">
      <div className="space-y-6" data-testid="territory-management">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500">Define your territory hierarchy: State → City → Area → Beat</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-territory-btn">
                <Plus className="mr-2" size={18} />
                Add Territory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Territory' : 'Add New Territory'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Territory Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Maharashtra, Mumbai, Andheri West"
                    required
                    data-testid="territory-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Territory Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger data-testid="territory-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="State">State</SelectItem>
                      <SelectItem value="City">City</SelectItem>
                      <SelectItem value="Area">Area</SelectItem>
                      <SelectItem value="Beat">Beat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Parent Territory</Label>
                  <Select value={formData.parent_id || "none"} onValueChange={(val) => setFormData({...formData, parent_id: val === "none" ? "" : val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {territories.filter(t => t.id !== editingId).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude (Optional)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({...formData, lat: e.target.value})}
                      placeholder="19.0760"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude (Optional)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({...formData, lng: e.target.value})}
                      placeholder="72.8777"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="territory-submit-btn">
                    {editingId ? 'Update Territory' : 'Create Territory'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['State', 'City', 'Area', 'Beat'].map((type) => (
            <Card key={type} className="stats-card">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">{type}s</p>
                <p className="text-2xl font-bold font-mono">{groupedTerritories[type].length}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Territories by Type */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : territories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              No territories defined yet. Start by adding your states.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {['State', 'City', 'Area', 'Beat'].map((type) => (
              <Card key={type} data-testid={`territory-${type.toLowerCase()}-card`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TreeStructure className="text-slate-400" size={20} />
                    <h3 className="font-semibold">{type}s</h3>
                    <Badge className={typeColors[type]}>{groupedTerritories[type].length}</Badge>
                  </div>
                  
                  {groupedTerritories[type].length === 0 ? (
                    <p className="text-sm text-slate-400">No {type.toLowerCase()}s added</p>
                  ) : (
                    <div className="space-y-2">
                      {groupedTerritories[type].map((territory) => (
                        <div key={territory.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">{territory.name}</p>
                            {territory.parent_id && (
                              <p className="text-xs text-slate-500">Parent: {getParentName(territory.parent_id)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(territory)}
                              data-testid={`edit-territory-${territory.id}`}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(territory.id)}
                              data-testid={`delete-territory-${territory.id}`}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TerritoryManagement;
