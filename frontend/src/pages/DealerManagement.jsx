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
import { Plus, MapPin, Trash, Pencil, ClockClockwise, Calendar, User } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import DealerOrderItemsView from '../components/DealerOrderItemsView';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { formatDateDDMmmYYYY, getTruncatedText } from '../utils/tableHelpers';

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
  phone: '',
  found_by: ''
};

const DealerManagement = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [dealers, setDealers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [followupHistory, setFollowupHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [orderDialogDealer, setOrderDialogDealer] = useState(null);

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
      phone: dealer.phone || '',
      found_by: dealer.found_by || ''
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

  const handleViewHistory = async (dealer) => {
    setSelectedDealer(dealer);
    setHistoryDialogOpen(true);
    setLoadingHistory(true);

    try {
      const response = await axios.get(
        `${API}/visit/dealer/${dealer.id}/followup-history`,
        { headers: getAuthHeader() }
      );
      setFollowupHistory(response.data);
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Failed to load follow-up history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

const filteredDealers = dealers.filter(d => {
    const search = searchTerm.toLowerCase();
    return (
      d.name?.toLowerCase().includes(search) ||
      d.address?.toLowerCase().includes(search) ||
      d.dealer_type?.toLowerCase().includes(search) ||
      getTerritoryName(d.territory_id)?.toLowerCase().includes(search) ||
      d.contact_person?.toLowerCase().includes(search) ||
      d.phone?.toLowerCase().includes(search) ||
      d.found_by?.toLowerCase().includes(search) ||
      d.last_visited_by?.toLowerCase().includes(search)
    );
  });

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
          <div className="flex-1">
            {searchTerm && (
              <p className="text-xs text-gray-500">
                Showing results for: <span className="font-semibold text-gray-700">"{searchTerm}"</span>
              </p>
            )}
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-sm text-xs h-8" data-testid="add-dealer-btn">
                <Plus className="mr-1" size={14} />
                Add Dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Dealer' : 'Add New Dealer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
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

                  <div className="sm:col-span-2 space-y-2">
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

                  <div className="space-y-2">
                    <Label>Found By</Label>
                    <Input
                      value={formData.found_by}
                      onChange={(e) => setFormData({...formData, found_by: e.target.value})}
                      placeholder="Name of person who found this dealer"
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
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="border-y border-gray-200">
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200 w-8">#</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Dealer</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200 text-center">Address</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Type</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Territory</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Contact</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Phone</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Priority</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Booked Amount</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Last Visit</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Visited By</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Outcome</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 border-r border-gray-200">Next Visit</th>
                      <th className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredDealers.map((dealer, idx) => {
                      const dealerName = getTruncatedText(dealer.name, 18);
                      const contactPerson = getTruncatedText(dealer.contact_person || '–', 15);
                      const visitedBy = getTruncatedText(dealer.last_visited_by || '–', 15);

                      return (
                      <tr key={dealer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-medium text-gray-600 w-8">{idx + 1}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <p className="text-xs font-medium text-gray-900" title={dealerName.full}>{dealerName.display}</p>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center cursor-help">
                                  <MapPin size={16} className="text-blue-500" weight="fill" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white">
                                <p className="text-xs">{dealer.address || 'No address available'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600">{dealer.dealer_type}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600">{getTerritoryName(dealer.territory_id)}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600" title={contactPerson.full}>{contactPerson.display}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-[11px] text-gray-600 whitespace-nowrap">{dealer.phone || '–'}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <Badge className={`text-[10px] px-1.5 py-0 ${
                            dealer.priority_level === 1 ? 'priority-high' :
                            dealer.priority_level === 2 ? 'priority-medium' : 'priority-low'
                          }`}>
                            {dealer.priority_level === 1 ? 'High' : dealer.priority_level === 2 ? 'Medium' : 'Low'}
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          {dealer.total_booked_amount > 0 ? (
                            <span className="text-[11px] font-bold text-emerald-600">
                              ₹{dealer.total_booked_amount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">₹0</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                          {dealer.last_visit_date ? formatDateDDMmmYYYY(dealer.last_visit_date) : 'Never'}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600" title={visitedBy.full}>
                          {visitedBy.display}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {dealer.last_outcome ? (
                              dealer.last_outcome === 'Order Booked' ? (
                                <Badge 
                                  className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200 transition-colors"
                                  onClick={() => setOrderDialogDealer(dealer)}
                                >
                                  {dealer.last_outcome}
                                </Badge>
                              ) : (
                                <Badge className={`text-[10px] px-1.5 py-0 ${
                                  dealer.last_outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                                  dealer.last_outcome === 'Lost Visit' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {dealer.last_outcome}
                                </Badge>
                              )
                            ) : (
                              <span className="text-[11px] text-gray-400">–</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                          {dealer.next_visit_date ? formatDateDDMmmYYYY(dealer.next_visit_date) : '–'}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 w-7 p-0"
                              onClick={() => handleViewHistory(dealer)}
                              title="View History"
                              data-testid={`history-dealer-${dealer.id}`}
                            >
                              <ClockClockwise size={14} />
                            </Button>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Follow-up History</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">View all visits and follow-ups for this dealer</p>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDealer && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-semibold text-slate-800">{selectedDealer.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDealer.address}</p>
              </div>
            )}

            {loadingHistory ? (
              <div className="flex justify-center items-center gap-2 text-xs text-gray-500 py-8">
                <div className="spinner w-4 h-4" /> Loading history...
              </div>
            ) : followupHistory.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                No visit history found for this dealer
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {followupHistory.map((visit, index) => (
                  <div
                    key={visit.id || index}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">
                            {new Date(visit.check_in_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(visit.check_in_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User size={12} className="text-gray-400" />
                          <span>{visit.user_name}</span>
                        </div>
                      </div>
                      {visit.outcome && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            visit.outcome === 'Order Booked'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : visit.outcome === 'Follow-up Required' || visit.outcome === 'Follow-up Scheduled'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {visit.outcome}
                        </Badge>
                      )}
                    </div>
                    {visit.notes && (
                      <p className="text-xs text-gray-600 mt-2 pl-5">{visit.notes}</p>
                    )}
                    {visit.order_value && visit.order_value > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 mt-2 pl-5">
                        <span className="font-semibold">Order Value:</span>
                        <span>₹{visit.order_value.toLocaleString()}</span>
                      </div>
                    )}
                    {visit.next_visit_date && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-2 pl-5">
                        <Calendar size={12} />
                        <span className="font-medium">Next Visit:</span>
                        <span>{formatDate(visit.next_visit_date)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Items Dialog */}
      {orderDialogDealer && (
        <DealerOrderItemsView 
          dealer={orderDialogDealer} 
          externalOpen={!!orderDialogDealer}
          onExternalClose={() => setOrderDialogDealer(null)}
        />
      )}
    </AdminLayout>
  );
};

export default DealerManagement;
