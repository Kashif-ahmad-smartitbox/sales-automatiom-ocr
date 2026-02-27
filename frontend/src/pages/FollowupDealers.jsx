import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SalesExecutiveLayout from '../components/layout/SalesExecutiveLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Calendar, Buildings, Phone, User, Clock, WarningCircle, PencilSimple, ClockClockwise, Package, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FollowupDealers = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overdue: 0,
    today: 0,
    upcoming: 0
  });
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [followupHistory, setFollowupHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [companyProducts, setCompanyProducts] = useState([]);
  const [itemDetails, setItemDetails] = useState({});
  const [followupData, setFollowupData] = useState({
    next_visit_date: '',
    notes: '',
    outcome: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    order_value: '',
    ordered_items: []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching followup dealers...');
      const [dealersRes, itemsRes] = await Promise.all([
        axios.get(`${API}/visit/my-followup-dealers`, { headers: getAuthHeader() }),
        axios.get(`${API}/items`, { headers: getAuthHeader(), params: { active: true } }).catch(() => ({ data: [] }))
      ]);
      console.log('Followup dealers response:', dealersRes.data);
      
      const dealersList = dealersRes.data || [];
      const items = itemsRes.data || [];
      
      setDealers(dealersList);
      setCompanyProducts(items);

      // Calculate stats
      const overdue = dealersList.filter(d => d.followup_status === 'overdue').length;
      const today = dealersList.filter(d => d.followup_status === 'today').length;
      const upcoming = dealersList.filter(d => d.followup_status === 'upcoming').length;

      setStats({ overdue, today, upcoming });
    } catch (error) {
      console.error('Fetch error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to fetch followup dealers');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigateToField = () => {
    navigate('/field');
  };

  const handleOpenFollowup = (dealer) => {
    setSelectedDealer(dealer);
    setFollowupData({
      next_visit_date: dealer.next_visit_date || '',
      notes: '',
      outcome: '',
      contact_name: dealer.contact_person || '',
      contact_phone: dealer.phone || '',
      contact_email: '',
      order_value: '',
      ordered_items: []
    });
    setItemDetails({});
    setFollowupDialogOpen(true);
  };

  const toggleOrderedItem = (item) => {
    const itemName = item.item_name;
    const isSelected = followupData.ordered_items.some(i => i.name === itemName);
    
    if (isSelected) {
      setFollowupData(prev => ({
        ...prev,
        ordered_items: prev.ordered_items.filter(i => i.name !== itemName)
      }));
      const newDetails = { ...itemDetails };
      delete newDetails[itemName];
      setItemDetails(newDetails);
    } else {
      const defaultRate = item.default_price || 0;
      setFollowupData(prev => ({
        ...prev,
        ordered_items: [...prev.ordered_items, { name: itemName, quantity: 1, rate: defaultRate }]
      }));
      setItemDetails(prev => ({
        ...prev,
        [itemName]: { quantity: 1, rate: defaultRate }
      }));
    }
  };

  const updateItemDetail = (itemName, field, value) => {
    const numValue = parseFloat(value) || 0;
    
    setItemDetails(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: numValue
      }
    }));

    setFollowupData(prev => ({
      ...prev,
      ordered_items: prev.ordered_items.map(item => 
        item.name === itemName 
          ? { ...item, [field]: numValue }
          : item
      )
    }));
  };

  const calculateTotalOrderValue = () => {
    return followupData.ordered_items.reduce((total, item) => {
      return total + (item.quantity * item.rate);
    }, 0);
  };

  const handleUpdateFollowup = async () => {
    if (!followupData.outcome) {
      toast.error('Please select visit outcome');
      return;
    }
    if (followupData.outcome === 'Follow-up Required' && !followupData.next_visit_date) {
      toast.error('Please select next visit date for follow-up');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const checkInResponse = await axios.post(
        `${API}/visit/check-in`,
        {
          dealer_id: selectedDealer.id,
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        { headers: getAuthHeader() }
      );

      const visitId = checkInResponse.data.visit_id;
      const totalOrderValue = calculateTotalOrderValue();

      await axios.post(
        `${API}/visit/${visitId}/check-out`,
        {
          outcome: followupData.outcome,
          order_value: totalOrderValue,
          ordered_items: followupData.ordered_items,
          notes: followupData.notes,
          next_visit_date: followupData.next_visit_date,
          contact_name: followupData.contact_name,
          contact_phone: followupData.contact_phone,
          contact_email: followupData.contact_email,
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        { headers: getAuthHeader() }
      );

      toast.success('Visit recorded successfully');
      setFollowupDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Record visit error:', error);
      if (error?.code === 1) {
        toast.error('Location permission denied. Please allow location access to record visits.');
        return;
      }
      toast.error(error.response?.data?.detail || 'Failed to record visit');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
            Overdue
          </Badge>
        );
      case 'today':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0">
            Today
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
            Upcoming
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const getDaysUntilText = (daysUntil, status) => {
    if (status === 'overdue') {
      return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`;
    } else if (status === 'today') {
      return 'Due today';
    } else {
      return `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SalesExecutiveLayout title="Followup Dealers">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Followup Dealers
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Dealers that require your follow-up visit
          </p>
        </div>

        {/* Info Banner */}
        {dealers.length > 0 && stats.overdue > 0 && (
          <Card className="border-0 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <WarningCircle size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {stats.overdue} Overdue Follow-up{stats.overdue !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    These dealers are past their scheduled follow-up date. Please visit them as soon as possible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1">
            {searchTerm && (
              <p className="text-xs text-gray-500">
                Showing results for: <span className="font-semibold text-gray-700">"{searchTerm}"</span>
              </p>
            )}
          </div>
          <Button variant="outline" onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/90">Overdue</span>
                <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                  <WarningCircle size={14} weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono">{stats.overdue}</div>
              <p className="text-[10px] text-white/80 mt-0.5">Past due date</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/90">Today</span>
                <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                  <Clock size={14} weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono">{stats.today}</div>
              <p className="text-[10px] text-white/80 mt-0.5">Due today</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/90">Upcoming</span>
                <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                  <Calendar size={14} weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono">{stats.upcoming}</div>
              <p className="text-[10px] text-white/80 mt-0.5">Next 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/90">Total</span>
                <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                  <Buildings size={14} weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono">{dealers.length}</div>
              <p className="text-[10px] text-white/80 mt-0.5">Follow-ups needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-y border-gray-200">
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Dealer Name</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Contact Info</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Location</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Last Visit</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Next Visit Date</th>
                  <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Status</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Last Outcome</th>
                  <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-2 py-8 text-center">
                      <div className="flex justify-center items-center gap-2 text-[11px] text-gray-500">
                        <div className="spinner w-4 h-4" /> Loading data...
                      </div>
                    </td>
                  </tr>
                ) : filteredDealers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-2 py-8 text-center text-[11px] text-gray-500">
                      {searchTerm ? 'No matches found.' : 'No follow-ups scheduled at this time.'}
                    </td>
                  </tr>
                ) : (
                  filteredDealers.map((dealer) => (
                    <tr key={dealer.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${dealer.followup_status === 'overdue' ? 'bg-red-50' : ''}`}>
                      <td className="px-2 py-1.5 border-r border-gray-100">
                        <div className="font-medium text-xs text-gray-800">{dealer.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {dealer.dealer_type} • Priority {dealer.priority_level}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border-r border-gray-100">
                        {dealer.contact_person && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <User size={12} className="text-gray-400" />
                            <span>{dealer.contact_person}</span>
                          </div>
                        )}
                        {dealer.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-1">
                            <Phone size={12} className="text-gray-400" />
                            <span>{dealer.phone}</span>
                          </div>
                        )}
                        {!dealer.contact_person && !dealer.phone && (
                          <span className="text-[11px] text-gray-400">Not available</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 max-w-xs border-r border-gray-100">
                        {dealer.city && (
                          <div className="text-[11px] font-medium text-gray-700 mb-1">
                            {dealer.city}
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400" />
                          <span className="line-clamp-2" title={dealer.address}>
                            {dealer.address || 'Address not available'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {dealer.last_visit_date ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Calendar size={12} className="text-gray-400" />
                              <span>{formatDate(dealer.last_visit_date)}</span>
                            </div>
                            {dealer.last_visited_by && (
                              <div className="text-[10px] text-gray-400 pl-5 mt-0.5">
                                By: You
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Never visited</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{formatDate(dealer.next_visit_date)}</span>
                        </div>
                        <div className={`text-[10px] pl-5 mt-0.5 font-medium ${
                          dealer.followup_status === 'overdue' ? 'text-red-600' :
                          dealer.followup_status === 'today' ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {getDaysUntilText(dealer.days_until_visit, dealer.followup_status)}
                        </div>
                      </td>
                      <td className="text-center">
                        {getStatusBadge(dealer.followup_status)}
                      </td>
                      <td>
                        {dealer.last_outcome ? (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${
                              dealer.last_outcome === 'Order Booked' ? 'bg-green-50 text-green-700 border-green-200' :
                              dealer.last_outcome === 'Follow-up Required' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {dealer.last_outcome}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">No previous outcome</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFollowup(dealer)}
                            className="h-8 px-2"
                            title="Update Follow-up"
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(dealer)}
                            className="h-8 px-2"
                            title="View History"
                          >
                            <ClockClockwise size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Button */}
        {dealers.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleNavigateToField}
              className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md"
            >
              Start Field Visit
              <MapPin size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Update Followup Dialog */}
      <Dialog open={followupDialogOpen} onOpenChange={setFollowupDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Visit & Dealer Details</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">Capture dealer information, order details, and follow-up notes</p>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDealer && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-semibold text-slate-800">{selectedDealer.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDealer.address}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Visit Outcome *</Label>
              <Select value={followupData.outcome} onValueChange={(val) => setFollowupData({...followupData, outcome: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Order Booked">Order Booked</SelectItem>
                  <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                  <SelectItem value="No Meeting">No Meeting</SelectItem>
                  <SelectItem value="Lost Visit">Lost Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {followupData.outcome === 'Order Booked' && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Package size={14} />
                    Select Items Ordered
                  </Label>
                  <p className="text-[11px] text-gray-500">Select items and enter quantity & rate</p>
                  {companyProducts.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg p-2 max-h-[300px] overflow-y-auto bg-gray-50/50 space-y-2">
                      {companyProducts.map((item) => {
                        const itemName = item.item_name;
                        const isSelected = followupData.ordered_items.some(i => i.name === itemName);
                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg p-3 border transition-all ${
                              isSelected
                                ? 'bg-primary-50 border-primary-200'
                                : 'bg-white border-gray-100'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer mb-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOrderedItem(item)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-800 font-medium">{itemName}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.product_category}</span>
                                </div>
                                <div className="text-xs text-emerald-600 font-semibold mt-0.5">Default: ₹{item.default_price?.toLocaleString()}</div>
                              </div>
                            </label>
                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 ml-8">
                                <div>
                                  <Label className="text-[10px] text-gray-600">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={itemDetails[itemName]?.quantity || 1}
                                    onChange={(e) => updateItemDetail(itemName, 'quantity', e.target.value)}
                                    className="h-8 text-sm mt-1"
                                    placeholder="Qty"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-600">Price (₹) - Editable</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={itemDetails[itemName]?.rate || item.default_price || 0}
                                    onChange={(e) => updateItemDetail(itemName, 'rate', e.target.value)}
                                    className="h-8 text-sm mt-1 font-semibold text-emerald-600"
                                    placeholder="Price"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">No items available. Ask admin to add items in Item Master.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Order Value (₹) - Auto Calculated</Label>
                  <Input
                    type="number"
                    value={calculateTotalOrderValue()}
                    readOnly
                    className="bg-gray-50 font-bold text-primary-600"
                    placeholder="Auto calculated from items"
                  />
                  <p className="text-[10px] text-gray-500">Total is automatically calculated from quantity × rate</p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={followupData.notes}
                onChange={(e) => setFollowupData({...followupData, notes: e.target.value})}
                placeholder="Add any notes about this visit..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Next Visit Date</Label>
              <Input
                type="date"
                value={followupData.next_visit_date}
                onChange={(e) => setFollowupData({...followupData, next_visit_date: e.target.value})}
              />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={followupData.contact_name}
                    onChange={(e) => setFollowupData({...followupData, contact_name: e.target.value})}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    type="tel"
                    value={followupData.contact_phone}
                    onChange={(e) => setFollowupData({...followupData, contact_phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (Optional)</Label>
                <Input
                  type="email"
                  value={followupData.contact_email}
                  onChange={(e) => setFollowupData({...followupData, contact_email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setFollowupDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600"
                onClick={handleUpdateFollowup}
              >
                <CheckCircle className="mr-2" size={18} />
                Save Visit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </SalesExecutiveLayout>
  );
};

export default FollowupDealers;
