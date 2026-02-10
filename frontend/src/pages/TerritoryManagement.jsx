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
    City: 'bg-primary-100 text-primary-700',
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
      <div className="space-y-4" data-testid="territory-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Territory Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Define your territory hierarchy: State → City → Area → Beat</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-sm text-xs h-8" data-testid="add-territory-btn">
                <Plus className="mr-1" size={14} />
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
                  <Button type="submit" className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md" data-testid="territory-submit-btn">
                    {editingId ? 'Update Territory' : 'Create Territory'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - gradient cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['State', 'City', 'Area', 'Beat'].map((type, idx) => (
            <Card key={type} className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 text-white ${
              idx === 0 ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
              idx === 1 ? 'bg-gradient-to-br from-primary-400 to-primary-500' :
              idx === 2 ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' :
              'bg-gradient-to-br from-amber-400 to-amber-500'
            }`}>
              <CardContent className="p-3">
                <span className="text-xs font-medium text-white/90">{type}s</span>
                <div className="text-lg font-bold font-mono mt-1">{groupedTerritories[type].length}</div>
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
          <div className="grid md:grid-cols-2 gap-4">
            {['State', 'City', 'Area', 'Beat'].map((type) => (
              <Card key={type} className="border-0 shadow-sm" data-testid={`territory-${type.toLowerCase()}-card`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TreeStructure className="text-gray-400" size={16} />
                    <h3 className="text-sm font-bold text-gray-800">{type}s</h3>
                    <Badge className={typeColors[type] + ' text-[10px] px-1.5 py-0'}>{groupedTerritories[type].length}</Badge>
                  </div>
                  
                  {groupedTerritories[type].length === 0 ? (
                    <p className="text-xs text-gray-400">No {type.toLowerCase()}s added</p>
                  ) : (
                    <div className="space-y-2">
                      {groupedTerritories[type].map((territory) => (
                        <div key={territory.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                          <div>
                            <p className="font-medium text-sm text-gray-800">{territory.name}</p>
                            {territory.parent_id && (
                              <p className="text-[10px] text-gray-500 mt-0.5">Parent: {getParentName(territory.parent_id)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 h-7 w-7 p-0"
                              onClick={() => handleEdit(territory)}
                              data-testid={`edit-territory-${territory.id}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                              onClick={() => handleDelete(territory.id)}
                              data-testid={`delete-territory-${territory.id}`}
                            >
                              <Trash size={14} />
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
