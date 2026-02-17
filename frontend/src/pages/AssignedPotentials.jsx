import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SalesExecutiveLayout from '../components/layout/SalesExecutiveLayout';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MagnifyingGlass, MapPin, Calendar, User, Buildings, ArrowRight, CheckCircle, Package } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AssignedPotentials = () => {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [companyProducts, setCompanyProducts] = useState([]);
  const [visitData, setVisitData] = useState({
    outcome: '',
    order_value: '',
    ordered_items: [],
    notes: '',
    next_visit_date: '',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  });
  const [itemDetails, setItemDetails] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching assigned potentials...');
      const [potentialsRes, configRes] = await Promise.all([
        axios.get(`${API}/visit/my-assigned-potentials`, { headers: getAuthHeader() }),
        axios.get(`${API}/company/config`, { headers: getAuthHeader() }).catch(() => ({ data: { config: { product_categories: [], product_items: [] } } }))
      ]);
      console.log('Assigned potentials response:', potentialsRes.data);
      console.log('Company config response:', configRes.data);
      
      // Use product_categories if product_items is empty
      const products = configRes.data?.config?.product_items?.length > 0 
        ? configRes.data.config.product_items 
        : configRes.data?.config?.product_categories || [];
      
      setPotentials(potentialsRes.data);
      setCompanyProducts(products);
      console.log('Products loaded:', products);
    } catch (error) {
      console.error('Fetch error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to fetch assigned dealers');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecordVisit = (dealer) => {
    setSelectedDealer(dealer);
    setVisitData({
      outcome: '',
      order_value: '',
      ordered_items: [],
      notes: '',
      next_visit_date: '',
      contact_name: '',
      contact_phone: '',
      contact_email: ''
    });
    setItemDetails({});
    setVisitDialogOpen(true);
  };

  const toggleOrderedItem = (item) => {
    const isSelected = visitData.ordered_items.some(i => i.name === item);
    
    if (isSelected) {
      setVisitData(prev => ({
        ...prev,
        ordered_items: prev.ordered_items.filter(i => i.name !== item)
      }));
      const newDetails = { ...itemDetails };
      delete newDetails[item];
      setItemDetails(newDetails);
    } else {
      setVisitData(prev => ({
        ...prev,
        ordered_items: [...prev.ordered_items, { name: item, quantity: 1, rate: 0 }]
      }));
      setItemDetails(prev => ({
        ...prev,
        [item]: { quantity: 1, rate: 0 }
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

    setVisitData(prev => ({
      ...prev,
      ordered_items: prev.ordered_items.map(item => 
        item.name === itemName 
          ? { ...item, [field]: numValue }
          : item
      )
    }));
  };

  const calculateTotalOrderValue = () => {
    return visitData.ordered_items.reduce((total, item) => {
      return total + (item.quantity * item.rate);
    }, 0);
  };

  const handleSaveVisit = async () => {
    if (!visitData.outcome) {
      toast.error('Please select visit outcome');
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
          dealer_id: `google_${selectedDealer.place_id}`,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          dealer_data: {
            place_id: selectedDealer.place_id,
            name: selectedDealer.place_name,
            lat: selectedDealer.lat,
            lng: selectedDealer.lng,
            address: selectedDealer.address,
            vicinity: selectedDealer.address,
            dealer_type: 'Store',
            source: 'google_places'
          }
        },
        { headers: getAuthHeader() }
      );

      const visitId = checkInResponse.data.visit_id;
      const totalOrderValue = calculateTotalOrderValue();

      await axios.post(
        `${API}/visit/${visitId}/check-out`,
        {
          outcome: visitData.outcome,
          order_value: totalOrderValue,
          ordered_items: visitData.ordered_items,
          notes: visitData.notes,
          next_visit_date: visitData.next_visit_date,
          contact_name: visitData.contact_name,
          contact_phone: visitData.contact_phone,
          contact_email: visitData.contact_email,
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        { headers: getAuthHeader() }
      );

      toast.success('Visit recorded successfully');
      setVisitDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save visit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to record visit');
    }
  };

  const filteredPotentials = potentials.filter(p => 
    p.place_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SalesExecutiveLayout title="My Assigned Dealers">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">My Assigned Dealers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Potential dealers assigned to you for follow-up</p>
        </div>

        {/* Info Banner */}
        {potentials.length > 0 && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Ready to Visit These Dealers?</p>
                  <p className="text-xs text-gray-600 mt-1">These assigned dealers will automatically appear in your Field View when you start a market visit.</p>
                </div>
                <Button 
                  onClick={() => navigate('/field')}
                  className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md whitespace-nowrap"
                  size="sm"
                >
                  Go to Field View
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name or address..."
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
                        <span className="text-xs font-medium text-white/90">Assigned Dealers</span>
                        <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
                            <Buildings size={14} weight="fill" />
                        </div>
                    </div>
                    <div className="text-lg font-bold font-mono">{potentials.length}</div>
                    <p className="text-[10px] text-white/80 mt-0.5">Ready for follow-up</p>
                </CardContent>
            </Card>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Dealer Name</th>
                            <th>Location / Address</th>
                            <th>Originally Found By</th>
                            <th>Assigned Date</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">Action</th>
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
                                    {searchTerm ? 'No matches found.' : 'No dealers assigned to you yet.'}
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
                                            <span>{new Date(item.assigned_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 pl-5">
                                            {new Date(item.assigned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                            Assigned
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRecordVisit(item)}
                                            className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white h-8 px-3"
                                        >
                                            <CheckCircle size={14} className="mr-1" />
                                            Record Visit
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

      {/* Visit Recording Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Visit & Dealer Details</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">Capture dealer information, order details, and follow-up notes</p>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDealer && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-semibold text-slate-800">{selectedDealer.place_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDealer.address}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Visit Outcome *</Label>
              <Select value={visitData.outcome} onValueChange={(val) => setVisitData({...visitData, outcome: val})}>
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

            {visitData.outcome === 'Order Booked' && (
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
                        const isSelected = visitData.ordered_items.some(i => i.name === item);
                        return (
                          <div
                            key={item}
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
                              <span className="text-sm text-gray-800 font-medium flex-1">{item}</span>
                            </label>
                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 ml-8">
                                <div>
                                  <Label className="text-[10px] text-gray-600">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={itemDetails[item]?.quantity || 1}
                                    onChange={(e) => updateItemDetail(item, 'quantity', e.target.value)}
                                    className="h-8 text-sm mt-1"
                                    placeholder="Qty"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-600">Rate (₹)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={itemDetails[item]?.rate || 0}
                                    onChange={(e) => updateItemDetail(item, 'rate', e.target.value)}
                                    className="h-8 text-sm mt-1"
                                    placeholder="Rate"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">No products configured. Ask admin to add product items in Settings.</p>
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
                value={visitData.notes}
                onChange={(e) => setVisitData({...visitData, notes: e.target.value})}
                placeholder="Add any notes about this visit..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Next Visit Date (Optional)</Label>
              <Input
                type="date"
                value={visitData.next_visit_date}
                onChange={(e) => setVisitData({...visitData, next_visit_date: e.target.value})}
              />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={visitData.contact_name}
                    onChange={(e) => setVisitData({...visitData, contact_name: e.target.value})}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    type="tel"
                    value={visitData.contact_phone}
                    onChange={(e) => setVisitData({...visitData, contact_phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (Optional)</Label>
                <Input
                  type="email"
                  value={visitData.contact_email}
                  onChange={(e) => setVisitData({...visitData, contact_email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setVisitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600"
                onClick={handleSaveVisit}
              >
                <CheckCircle className="mr-2" size={18} />
                Save Visit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SalesExecutiveLayout>
  );
};

export default AssignedPotentials;
