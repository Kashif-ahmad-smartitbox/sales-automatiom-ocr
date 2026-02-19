import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, MagnifyingGlass, Trash, Phone, Pencil, Users, UserCircleGear } from '@phosphor-icons/react';
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
  assigned_sales_executive_ids: []
};

const HODManagement = () => {
  const { getAuthHeader } = useAuth();
  const [hods, setHODs] = useState([]);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [hodsRes, execsRes] = await Promise.all([
        axios.get(`${API}/hod`, { headers: getAuthHeader() }),
        axios.get(`${API}/sales-executives`, { headers: getAuthHeader() })
      ]);
      setHODs(hodsRes.data);
      setSalesExecutives(execsRes.data);
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
      if (editingId) {
        await axios.put(`${API}/hod/${editingId}`, formData, { headers: getAuthHeader() });
        toast.success('HOD updated successfully');
      } else {
        await axios.post(`${API}/hod`, formData, { headers: getAuthHeader() });
        toast.success('HOD added successfully');
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (hod) => {
    setEditingId(hod.id);
    setFormData({
      name: hod.name,
      email: hod.email,
      mobile: hod.mobile,
      password: '',
      employee_code: hod.employee_code || '',
      assigned_sales_executive_ids: hod.assigned_sales_executive_ids || []
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this HOD?')) return;
    try {
      await axios.delete(`${API}/hod/${id}`, { headers: getAuthHeader() });
      toast.success('HOD deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete HOD');
    }
  };

  const toggleSalesExecutive = (execId) => {
    setFormData(prev => {
      const ids = prev.assigned_sales_executive_ids;
      if (ids.includes(execId)) {
        return { ...prev, assigned_sales_executive_ids: ids.filter(id => id !== execId) };
      } else {
        return { ...prev, assigned_sales_executive_ids: [...ids, execId] };
      }
    });
  };

  const filteredHODs = hods.filter(hod => 
    hod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hod.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="HOD Management">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">HOD Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage Head of Departments</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-sm text-xs h-8">
                <Plus className="mr-1" size={14} />
                Add HOD
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit HOD' : 'Add HOD'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input
                      value={formData.employee_code}
                      onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                      placeholder="HOD001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  {!editingId && (
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-2 border-t pt-4">
                    <Label className="text-base font-semibold">Assign Sales Executives</Label>
                    <p className="text-xs text-gray-500 mb-2">Select sales executives to be managed by this HOD</p>
                    
                    {salesExecutives.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No sales executives available</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                        {salesExecutives.map((exec) => (
                          <div key={exec.id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded">
                            <Checkbox
                              id={exec.id}
                              checked={formData.assigned_sales_executive_ids.includes(exec.id)}
                              onCheckedChange={() => toggleSalesExecutive(exec.id)}
                            />
                            <Label 
                              htmlFor={exec.id} 
                              className="flex-1 cursor-pointer font-normal text-sm"
                            >
                              {exec.name} <span className="text-xs text-gray-500">({exec.employee_code})</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Selected: {formData.assigned_sales_executive_ids.length} sales executive(s)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md">
                    {editingId ? 'Update HOD' : 'Add HOD'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total HODs</span>
              <div className="text-lg font-bold font-mono mt-1">{hods.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Sales Executives</span>
              <div className="text-lg font-bold font-mono mt-1">{salesExecutives.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Assigned</span>
              <div className="text-lg font-bold font-mono mt-1">
                {hods.reduce((sum, hod) => sum + (hod.assigned_sales_executive_ids?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HODs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredHODs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              {searchTerm ? 'No HODs match your search' : 'No HODs added yet. Click "Add HOD" to get started.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredHODs.map((hod) => (
              <Card key={hod.id} className="border-0 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-purple-500 to-indigo-600">
                        {hod.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{hod.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{hod.employee_code}</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      HOD
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone size={12} />
                      <span>{hod.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users size={12} />
                      <span>{hod.assigned_sales_executive_ids?.length || 0} Sales Executives</span>
                    </div>
                  </div>

                  {hod.assigned_sales_executives && hod.assigned_sales_executives.length > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Assigned Team</p>
                      <div className="space-y-1">
                        {hod.assigned_sales_executives.slice(0, 3).map((exec) => (
                          <p key={exec.id} className="text-xs text-gray-700">• {exec.name}</p>
                        ))}
                        {hod.assigned_sales_executives.length > 3 && (
                          <p className="text-xs text-gray-500">+ {hod.assigned_sales_executives.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-3 border-t border-gray-100 gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 text-xs h-7 px-2"
                      onClick={() => handleEdit(hod)}
                    >
                      <Pencil size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                      onClick={() => handleDelete(hod.id)}
                    >
                      <Trash size={12} className="mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HODManagement;
