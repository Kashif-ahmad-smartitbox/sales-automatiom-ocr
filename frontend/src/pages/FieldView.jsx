import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  MapPin, 
  Play, 
  Stop, 
  CheckCircle,
  Clock,
  Storefront,
  NavigationArrow,
  SignOut,
  List,
  MapTrifold,
  CurrencyDollar
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dealerIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const currentIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px #10b98140;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const FieldView = () => {
  const { getAuthHeader, logout, user } = useAuth();
  const [isInMarket, setIsInMarket] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyDealers, setNearbyDealers] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  
  // Check-in state
  const [activeVisit, setActiveVisit] = useState(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [outcomeData, setOutcomeData] = useState({
    outcome: '',
    order_value: '',
    notes: '',
    next_visit_date: ''
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        (error) => {
          toast.error('Please enable location access');
          // Default to Mumbai for demo
          setCurrentLocation({ lat: 19.076, lng: 72.877 });
          setLoading(false);
        }
      );
    }
  };

  const fetchNearbyDealers = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const res = await axios.get(`${API}/visit/nearby-dealers`, {
        params: { lat: currentLocation.lat, lng: currentLocation.lng },
        headers: getAuthHeader()
      });
      setNearbyDealers(res.data);
    } catch (error) {
      console.error('Failed to fetch nearby dealers');
    }
  }, [currentLocation, getAuthHeader]);

  const fetchTodayVisits = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/visits/today`, { headers: getAuthHeader() });
      setTodayVisits(res.data);
      // Check if there's an active visit
      const active = res.data.find(v => !v.check_out_time);
      if (active) {
        setActiveVisit(active);
      }
    } catch (error) {
      console.error('Failed to fetch today visits');
    }
  }, [getAuthHeader]);

  useEffect(() => {
    getCurrentLocation();
    fetchTodayVisits();
  }, [fetchTodayVisits]);

  useEffect(() => {
    if (currentLocation && isInMarket) {
      fetchNearbyDealers();
    }
  }, [currentLocation, isInMarket, fetchNearbyDealers]);

  const handleStartMarket = async () => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }
    try {
      const res = await axios.post(`${API}/visit/start-market`, currentLocation, { headers: getAuthHeader() });
      setSessionId(res.data.session_id);
      setIsInMarket(true);
      toast.success('Market visit started!');
      fetchNearbyDealers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start market');
    }
  };

  const handleEndMarket = async () => {
    try {
      await axios.post(`${API}/visit/end-market`, {}, { headers: getAuthHeader() });
      setIsInMarket(false);
      setSessionId(null);
      setNearbyDealers([]);
      toast.success('Market visit ended');
    } catch (error) {
      toast.error('Failed to end market');
    }
  };

  const handleCheckIn = async () => {
    if (!selectedDealer || !currentLocation) return;
    try {
      const res = await axios.post(`${API}/visit/check-in`, {
        dealer_id: selectedDealer.id,
        lat: currentLocation.lat,
        lng: currentLocation.lng
      }, { headers: getAuthHeader() });
      setActiveVisit({ ...selectedDealer, visit_id: res.data.visit_id, check_in_time: res.data.check_in_time });
      setCheckInDialogOpen(false);
      toast.success(`Checked in at ${selectedDealer.name}`);
      fetchTodayVisits();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    if (!activeVisit || !outcomeData.outcome) {
      toast.error('Please select an outcome');
      return;
    }
    try {
      await axios.post(`${API}/visit/${activeVisit.visit_id}/check-out`, null, {
        params: {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        data: {
          outcome: outcomeData.outcome,
          order_value: outcomeData.order_value ? parseFloat(outcomeData.order_value) : null,
          notes: outcomeData.notes || null,
          next_visit_date: outcomeData.next_visit_date || null
        }
      });
      setActiveVisit(null);
      setCheckOutDialogOpen(false);
      setOutcomeData({ outcome: '', order_value: '', notes: '', next_visit_date: '' });
      toast.success('Visit completed!');
      fetchTodayVisits();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-out failed');
    }
  };

  const openCheckInDialog = (dealer) => {
    setSelectedDealer(dealer);
    setCheckInDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-500">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="field-view">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin weight="fill" className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">FieldOps</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={isInMarket ? 'status-active' : 'status-offline'}>
              {isInMarket ? 'In Market' : 'Not Started'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={logout}>
              <SignOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <Card>
          <CardContent className="p-4">
            <p className="text-slate-500 text-sm">Welcome back,</p>
            <p className="font-semibold text-lg">{user?.name || 'Sales Executive'}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <Clock size={16} />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Visit Card */}
        {activeVisit && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">ACTIVE VISIT</p>
                  <p className="font-semibold">{activeVisit.dealer_name || activeVisit.name}</p>
                  <p className="text-sm text-slate-600">
                    Started at {new Date(activeVisit.check_in_time).toLocaleTimeString()}
                  </p>
                </div>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setCheckOutDialogOpen(true)}
                  data-testid="checkout-btn"
                >
                  <CheckCircle className="mr-2" size={18} />
                  Check Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start/End Market */}
        {!activeVisit && (
          <Card>
            <CardContent className="p-4">
              {isInMarket ? (
                <Button 
                  variant="destructive" 
                  className="w-full py-6 text-lg"
                  onClick={handleEndMarket}
                  data-testid="end-market-btn"
                >
                  <Stop className="mr-2" size={20} weight="fill" />
                  End Market Visit
                </Button>
              ) : (
                <Button 
                  className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                  onClick={handleStartMarket}
                  data-testid="start-market-btn"
                >
                  <Play className="mr-2" size={20} weight="fill" />
                  Start Market Visit
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-blue-600">{todayVisits.length}</p>
              <p className="text-xs text-slate-500">Visits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-emerald-600">
                {todayVisits.filter(v => v.outcome === 'Order Booked').length}
              </p>
              <p className="text-xs text-slate-500">Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">
                ₹{todayVisits.reduce((sum, v) => sum + (v.order_value || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Value</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        {isInMarket && (
          <>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'map' ? 'default' : 'outline'}
                className={viewMode === 'map' ? 'flex-1 bg-blue-600' : 'flex-1'}
                onClick={() => setViewMode('map')}
              >
                <MapTrifold className="mr-2" size={18} />
                Map
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'}
                className={viewMode === 'list' ? 'flex-1 bg-blue-600' : 'flex-1'}
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2" size={18} />
                List
              </Button>
            </div>

            {/* Map View */}
            {viewMode === 'map' && currentLocation && (
              <Card>
                <CardContent className="p-0 h-[300px] rounded-lg overflow-hidden">
                  <MapContainer 
                    center={[currentLocation.lat, currentLocation.lng]} 
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Current location */}
                    <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentIcon}>
                      <Popup>You are here</Popup>
                    </Marker>
                    {/* Dealers */}
                    {nearbyDealers.map((dealer) => (
                      <Marker 
                        key={dealer.id} 
                        position={[dealer.lat, dealer.lng]}
                        icon={dealerIcon}
                        eventHandlers={{
                          click: () => openCheckInDialog(dealer)
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{dealer.name}</p>
                            <p className="text-slate-500">{dealer.distance}m away</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {nearbyDealers.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-slate-500">
                      No dealers found nearby. Try moving to a different area.
                    </CardContent>
                  </Card>
                ) : (
                  nearbyDealers.map((dealer) => (
                    <Card 
                      key={dealer.id} 
                      className="visit-card"
                      onClick={() => openCheckInDialog(dealer)}
                      data-testid={`dealer-card-${dealer.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Storefront className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="font-semibold">{dealer.name}</p>
                              <p className="text-xs text-slate-500">{dealer.dealer_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={dealer.distance <= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                              <NavigationArrow size={12} className="mr-1" />
                              {dealer.distance}m
                            </Badge>
                            <Badge className={`ml-2 ${dealer.priority_level === 1 ? 'priority-high' : dealer.priority_level === 2 ? 'priority-medium' : 'priority-low'}`}>
                              {dealer.priority_level === 1 ? 'High' : dealer.priority_level === 2 ? 'Med' : 'Low'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Today's Visits History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {todayVisits.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No visits yet today</p>
            ) : (
              <div className="space-y-2">
                {todayVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{visit.dealer_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(visit.check_in_time).toLocaleTimeString()}
                        {visit.time_spent_minutes && ` • ${Math.round(visit.time_spent_minutes)} min`}
                      </p>
                    </div>
                    <Badge className={
                      visit.outcome === 'Order Booked' ? 'bg-emerald-100 text-emerald-700' :
                      visit.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-700' :
                      !visit.outcome ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }>
                      {visit.outcome || 'In Progress'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In</DialogTitle>
          </DialogHeader>
          {selectedDealer && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold text-lg">{selectedDealer.name}</p>
                <p className="text-sm text-slate-500">{selectedDealer.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedDealer.dealer_type}</Badge>
                  <Badge className="bg-blue-100 text-blue-700">
                    <NavigationArrow size={12} className="mr-1" />
                    {selectedDealer.distance}m away
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCheckInDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleCheckIn}
                  data-testid="confirm-checkin-btn"
                >
                  <MapPin className="mr-2" size={18} />
                  Confirm Check-in
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Visit Outcome *</Label>
              <Select value={outcomeData.outcome} onValueChange={(val) => setOutcomeData({...outcomeData, outcome: val})}>
                <SelectTrigger data-testid="outcome-select">
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

            {outcomeData.outcome === 'Order Booked' && (
              <div className="space-y-2">
                <Label>Order Value (₹)</Label>
                <Input
                  type="number"
                  value={outcomeData.order_value}
                  onChange={(e) => setOutcomeData({...outcomeData, order_value: e.target.value})}
                  placeholder="Enter order value"
                  data-testid="order-value-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={outcomeData.notes}
                onChange={(e) => setOutcomeData({...outcomeData, notes: e.target.value})}
                placeholder="Add any notes about this visit..."
                data-testid="visit-notes-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Next Visit Date (Optional)</Label>
              <Input
                type="date"
                value={outcomeData.next_visit_date}
                onChange={(e) => setOutcomeData({...outcomeData, next_visit_date: e.target.value})}
                data-testid="next-visit-date-input"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCheckOutDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCheckOut}
                data-testid="confirm-checkout-btn"
              >
                <CheckCircle className="mr-2" size={18} />
                Complete Visit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldView;
