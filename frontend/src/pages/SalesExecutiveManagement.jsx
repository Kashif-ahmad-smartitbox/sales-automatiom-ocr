import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, MagnifyingGlass, Trash, MapPin, Phone, Pencil, Globe, Crosshair, ChartBar } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import OrderItemsView from '../components/OrderItemsView';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { State, City } from 'country-state-city';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  employee_code: '',
  assigned_state: '',
  assigned_city: '',
  is_live_tracking: false,
  product_category_access: [],
  daily_sales_target: '',
  daily_sales_amount_target: ''
};

const SalesExecutiveManagement = () => {
  const { getAuthHeader } = useAuth();
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Locations State
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [execReport, setExecReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [execVisits, setExecVisits] = useState([]);



  const fetchData = useCallback(async () => {
    try {
      const execsRes = await axios.get(`${API}/sales-executives`, { headers: getAuthHeader() });
      setExecutives(execsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const fetchUserReport = async (userId) => {
      setReportLoading(true);
      setExecReport(null);
      setExecVisits([]); // Reset visits
      try {
          const [perfRes, visitsRes] = await Promise.all([
             axios.get(`${API}/reports/executive-performance?exec_id=${userId}`, { headers: getAuthHeader() }),
             axios.get(`${API}/visits/history?exec_id=${userId}`, { headers: getAuthHeader() })
          ]);
          
          if (perfRes.data && perfRes.data.length > 0) {
              setExecReport(perfRes.data[0]);
          }
          setExecVisits(visitsRes.data);
      } catch (error) {
          console.error("Report fetch error", error);
          toast.error("Failed to load report");
      } finally {
          setReportLoading(false);
      }
  };

  const handleViewReport = (exec) => {
      setSelectedExecId(exec.id);
      setReportDialogOpen(true);
      fetchUserReport(exec.id);
  };

  useEffect(() => {
    fetchData();
    // Load states for India (implied context) or generic
    setAvailableStates(State.getStatesOfCountry('IN')); 
  }, [fetchData]);

  // Update available cities when state changes
  useEffect(() => {
    if (formData.assigned_state) {
      // Find state code
      const stateObj = availableStates.find(s => s.name === formData.assigned_state);
      if (stateObj) {
        setAvailableCities(City.getCitiesOfState('IN', stateObj.isoCode));
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.assigned_state, availableStates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation: If NOT live tracking, City is required
      if (!formData.is_live_tracking && (!formData.assigned_state || !formData.assigned_city)) {
          toast.error("Please select State and City for restricted access, or enable Live Tracking.");
          return;
      }

      const payload = {
        ...formData,
        daily_sales_target: formData.daily_sales_target === '' ? null : Number(formData.daily_sales_target),
        daily_sales_amount_target: formData.daily_sales_amount_target === '' ? null : Number(formData.daily_sales_amount_target)
      };
      if (editingId) delete payload.password;

      if (editingId) {
        await axios.put(`${API}/sales-executives/${editingId}`, payload, { headers: getAuthHeader() });
        toast.success('Sales executive updated');
      } else {
        await axios.post(`${API}/sales-executives`, payload, { headers: getAuthHeader() });
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
      assigned_state: exec.assigned_state || '',
      assigned_city: exec.assigned_city || '',
      is_live_tracking: exec.is_live_tracking || false,
      product_category_access: exec.product_category_access || [],
      daily_sales_target: exec.daily_sales_target ?? '',
      daily_sales_amount_target: exec.daily_sales_amount_target ?? ''
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

  const filteredExecutives = executives.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Sales Team">
      <div className="space-y-4" data-testid="sales-executive-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Sales Team</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your field sales executives</p>
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
              data-testid="executive-search"
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-sm text-xs h-8" data-testid="add-executive-btn">
                <Plus className="mr-1" size={14} />
                Add Executive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Sales Executive' : 'Add Sales Executive'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
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

                  <div className="sm:col-span-2 space-y-2">
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
                    <div className="sm:col-span-2 space-y-2">
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

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <Label className="text-base font-semibold mb-3 block">Daily Targets</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Daily Sales Target (visits count)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.daily_sales_target}
                          onChange={(e) => setFormData({...formData, daily_sales_target: e.target.value})}
                          placeholder="e.g. 10"
                          data-testid="daily-sales-target-input"
                        />
                        <p className="text-[10px] text-slate-500">Target number of dealer visits per day</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Sales Amount Target (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.daily_sales_amount_target}
                          onChange={(e) => setFormData({...formData, daily_sales_amount_target: e.target.value})}
                          placeholder="e.g. 50000"
                          data-testid="daily-sales-amount-target-input"
                        />
                        <p className="text-[10px] text-slate-500">Target order value in ₹ per day</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <Label className="text-base font-semibold mb-3 block">Visit Restrictions</Label>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="live-mode"
                        checked={formData.is_live_tracking}
                        onCheckedChange={(checked) => setFormData({...formData, is_live_tracking: checked})}
                      />
                      <Label htmlFor="live-mode" className="font-medium cursor-pointer">
                        Enable Any-City Live Tracking
                        <span className="block text-xs text-slate-500 font-normal">
                          If enabled, user can visit ANY location. If disabled, user is restricted to the selected city.
                        </span>
                      </Label>
                    </div>

                    {!formData.is_live_tracking && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label>State *</Label>
                          <Select 
                            value={formData.assigned_state} 
                            onValueChange={(val) => setFormData({...formData, assigned_state: val, assigned_city: ''})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className='max-h-60'>
                              {availableStates.map((state) => (
                                <SelectItem key={state.isoCode} value={state.name}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>City *</Label>
                          <Select 
                            value={formData.assigned_city} 
                            onValueChange={(val) => setFormData({...formData, assigned_city: val})}
                            disabled={!formData.assigned_state}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent className='max-h-60'>
                              {availableCities.map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md" data-testid="executive-submit-btn">
                    {editingId ? 'Update Executive' : 'Add Executive'}
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
              <span className="text-xs font-medium text-white/90">Total Team</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Active Now</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => e.is_in_market).length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Idle</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => getStatus(e) === 'idle').length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Offline</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => getStatus(e) === 'offline').length}</div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExecutives.map((exec) => {
              const status = getStatus(exec);
              return (
                <Card key={exec.id} className="border-0 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300" data-testid={`executive-card-${exec.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                          {exec.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{exec.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{exec.employee_code}</p>
                        </div>
                      </div>
                      <Badge className={
                        status === 'active' ? 'status-active' : status === 'idle' ? 'status-idle' : 'status-offline'
                      }>
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone size={12} />
                        <span>{exec.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        {exec.is_live_tracking ? (
                           <><Globe size={12} className="text-emerald-500" /> <span>Live Tracking (All Cities)</span></>
                        ) : (
                           <><MapPin size={12} className="text-amber-500" /> <span>{exec.assigned_city || 'No City'}, {exec.assigned_state}</span></>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs h-7 px-2"
                        onClick={() => handleViewReport(exec)}
                      >
                         <ChartBar size={12} className="mr-1" />
                         Report
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary-600 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 text-xs h-7 px-2"
                        onClick={() => handleEdit(exec)}
                        data-testid={`edit-executive-${exec.id}`}
                      >
                        <Pencil size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                        onClick={() => handleDelete(exec.id)}
                        data-testid={`delete-executive-${exec.id}`}
                      >
                        <Trash size={12} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      {/* Report Modal */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Sales Executive Report</DialogTitle>
              </DialogHeader>
              {reportLoading ? (
                  <div className="flex justify-center py-8"><div className="spinner" /></div>
              ) : !execReport ? (
                  <div className="text-center py-8 text-slate-500">No report data available</div>
              ) : (
                  <div className="space-y-6">
                      {/* Header Info */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-gray-100 gap-3">
                          <div>
                            <h3 className="font-bold text-base text-gray-800">{execReport.name}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                <span>{execReport.employee_code}</span>
                                <span>•</span>
                                <span>{execReport.mobile}</span>
                            </p>
                          </div>
                          <Badge className={execReport.is_in_market ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                             {execReport.is_in_market ? 'Currently In Market' : 'Currently Offline'}
                         </Badge>
                      </div>
                      
                      {/* Key Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Visits</p>
                              <p className="text-lg font-bold font-mono text-gray-700">{execReport.total_visits}</p>
                          </div>
                           <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                              <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                              <p className="text-lg font-bold font-mono text-emerald-700">{execReport.completed_visits}</p>
                          </div>
                           <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                              <p className="text-[10px] text-primary-600 uppercase tracking-wider mb-1">Orders</p>
                              <p className="text-lg font-bold font-mono text-primary-700">₹{execReport.total_orders.toLocaleString()}</p>
                          </div>
                           <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                              <p className="text-[10px] text-purple-600 uppercase tracking-wider mb-1">Avg Time</p>
                              <p className="text-lg font-bold font-mono text-purple-700">{execReport.avg_time_per_visit}m</p>
                          </div>
                      </div>

                      {/* Visit History Table */}
                      <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-2">Recent Visit History</h4>
                          <div className="border border-gray-100 rounded-lg overflow-x-auto">
                              <table className="w-full text-left min-w-[500px]">
                                  <thead>
                                      <tr style={{background: 'linear-gradient(to right, #f9fafb, #ffffff)'}}>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Date & Time</th>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Dealer / Location</th>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Duration</th>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Outcome</th>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Order Value</th>
                                          <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-center">Items</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                      {execVisits.length === 0 ? (
                                          <tr>
                                              <td colSpan="6" className="px-3 py-6 text-center text-xs text-gray-500">
                                                  No visit history found.
                                              </td>
                                          </tr>
                                      ) : (
                                          execVisits.map((visit) => (
                                              <tr key={visit.id} className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 transition-colors">
                                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                                      <div className="text-sm font-medium text-gray-700">
                                                          {new Date(visit.check_in_time).toLocaleDateString()}
                                                      </div>
                                                      <div className="text-[10px] text-gray-400">
                                                          {new Date(visit.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                      </div>
                                                  </td>
                                                  <td className="px-3 py-2.5">
                                                      <div className="text-sm font-medium text-gray-800">{visit.dealer_name || 'Unknown Dealer'}</div>
                                                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                                          {visit.location_address || 'No address'}
                                                      </div>
                                                  </td>
                                                  <td className="px-3 py-2.5 text-xs text-gray-600">
                                                      {visit.duration_minutes ? `${visit.duration_minutes}m` : '-'}
                                                  </td>
                                                  <td className="px-4 py-3">
                                                      <Badge variant="outline" className={
                                                          visit.outcome === 'Order Booked' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                                          visit.outcome === 'No Meeting' ? 'bg-red-50 text-red-700 border-red-200' :
                                                          'text-slate-600'
                                                      }>
                                                          {visit.outcome || 'Pending'}
                                                      </Badge>
                                                  </td>
                                                  <td className="px-3 py-2.5 text-right font-mono text-xs font-medium text-primary-600">
                                                      {visit.order_value > 0 ? `₹${visit.order_value.toLocaleString()}` : '-'}
                                                  </td>
                                                  <td className="px-3 py-2.5 text-center">
                                                      <OrderItemsView visit={visit} />
                                                  </td>
                                              </tr>
                                          ))
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SalesExecutiveManagement;
