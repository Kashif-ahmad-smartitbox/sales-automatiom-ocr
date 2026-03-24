import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import {
  MapPin,
  Play,
  Stop,
  CheckCircle,
  Clock,
  Storefront,
  NavigationArrow,
  List,
  MapTrifold,
  CurrencyInr,
  ArrowUp,
  ArrowsClockwise,
  Target,
  Package,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import OrderItemsView from "../components/OrderItemsView";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SalesExecutiveLayout from "../components/layout/SalesExecutiveLayout";
import { formatDateDDMmmYYYY, getTruncatedText } from "../utils/tableHelpers";

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dealerIcon = new L.DivIcon({
  className: "custom-marker",
  html: '<div style="background-color:#2563eb;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const currentIcon = new L.DivIcon({
  className: "custom-marker",
  html: '<div style="background-color:#10b981;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #10b98140;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const FieldView = () => {
  const { getAuthHeader, user } = useAuth();
  const [isInMarket, setIsInMarket] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyDealers, setNearbyDealers] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [visitTab, setVisitTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("map");
  const [lastSync, setLastSync] = useState(null);
  const [fieldStats, setFieldStats] = useState(null); // { distance_km, active_count, completed_count, missed_count, duration_mins }

  // Check-in / check-out state
  const [activeVisit, setActiveVisit] = useState(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [outcomeData, setOutcomeData] = useState({
    outcome: "",
    order_value: "",
    ordered_items: [],
    notes: "",
    next_visit_date: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });
  const [companyProducts, setCompanyProducts] = useState([]);
  const [itemDetails, setItemDetails] = useState({});

  // ── Geolocation ────────────────────────────────────────────────────
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLoading(false);
        },
        () => {
          setCurrentLocation({ lat: 19.076, lng: 72.877 });
          setLoading(false);
        },
      );
    } else {
      setCurrentLocation({ lat: 19.076, lng: 72.877 });
      setLoading(false);
    }
  };

  // ── API helpers ─────────────────────────────────────────────────────
  const fetchNearbyDealers = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const res = await axios.get(`${API}/visit/nearby-dealers`, {
        params: { lat: currentLocation.lat, lng: currentLocation.lng },
        headers: getAuthHeader(),
      });
      setNearbyDealers(res.data);
    } catch {
      /* silent */
    }
  }, [currentLocation, getAuthHeader]);

  const fetchTodayVisits = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/visits/today`, {
        headers: getAuthHeader(),
      });
      setTodayVisits(res.data);
      setLastSync(new Date());
      const active = res.data.find((v) => !v.check_out_time);
      setActiveVisit(active || null);
    } catch {
      /* silent */
    }
  }, [getAuthHeader]);

  const fetchAllVisits = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/visits/history`, {
        headers: getAuthHeader(),
      });
      setAllVisits(res.data);
    } catch {
      /* silent */
    }
  }, [getAuthHeader]);

  // Try to get richer field stats from the backend; fall back gracefully
  const fetchFieldStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/visits/field-stats`, {
        headers: getAuthHeader(),
      });
      setFieldStats(res.data);
    } catch {
      // endpoint may not exist yet — we'll compute from todayVisits
      setFieldStats(null);
    }
  }, [getAuthHeader]);

  const fetchUserStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (res.data?.is_in_market) setIsInMarket(true);
    } catch {
      /* silent */
    }
  }, [getAuthHeader]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTodayVisits(), fetchFieldStats()]);
    if (currentLocation) fetchNearbyDealers();
    setLastSync(new Date());
  }, [fetchTodayVisits, fetchFieldStats, currentLocation, fetchNearbyDealers]);

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    getCurrentLocation();
    fetchTodayVisits();
    fetchUserStatus();
    fetchFieldStats();
  }, [fetchTodayVisits, fetchUserStatus, fetchFieldStats]);

  useEffect(() => {
    if (visitTab === "overall") fetchAllVisits();
  }, [visitTab, fetchAllVisits]);

  useEffect(() => {
    if (currentLocation) fetchNearbyDealers();
  }, [currentLocation, fetchNearbyDealers]);

  // ── Market session ───────────────────────────────────────────────────
  const handleStartMarket = async () => {
    if (!currentLocation) {
      toast.error("Location not available");
      return;
    }
    try {
      await axios.post(`${API}/visit/start-market`, currentLocation, {
        headers: getAuthHeader(),
      });
      setIsInMarket(true);
      toast.success("Market visit started!");
      fetchNearbyDealers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to start market");
    }
  };

  const handleEndMarket = async () => {
    try {
      await axios.post(
        `${API}/visit/end-market`,
        {},
        { headers: getAuthHeader() },
      );
      setIsInMarket(false);
      setNearbyDealers([]);
      toast.success("Market visit ended");
    } catch {
      toast.error("Failed to end market");
    }
  };

  // ── Check-in ─────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!selectedDealer || !currentLocation) return;
    try {
      const payload = {
        dealer_id: selectedDealer.id,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      };
      if (selectedDealer.source === "google_places")
        payload.dealer_data = selectedDealer;
      const res = await axios.post(`${API}/visit/check-in`, payload, {
        headers: getAuthHeader(),
      });
      setActiveVisit({
        ...selectedDealer,
        visit_id: res.data.visit_id,
        check_in_time: res.data.check_in_time,
      });
      setCheckInDialogOpen(false);
      setNearbyDealers([]);
      toast.success(`Checked in at ${selectedDealer.name}`);
      fetchTodayVisits();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Check-in failed");
    }
  };

  // ── Check-out helpers ─────────────────────────────────────────────────
  const toggleOrderedItem = (item) => {
    const itemName = item.item_name;
    const isSelected = outcomeData.ordered_items.some(
      (i) => i.name === itemName,
    );
    if (isSelected) {
      setOutcomeData((p) => ({
        ...p,
        ordered_items: p.ordered_items.filter((i) => i.name !== itemName),
      }));
      const nd = { ...itemDetails };
      delete nd[itemName];
      setItemDetails(nd);
    } else {
      const defaultRate = item.default_price || 0;
      setOutcomeData((p) => ({
        ...p,
        ordered_items: [
          ...p.ordered_items,
          { name: itemName, quantity: 1, rate: defaultRate },
        ],
      }));
      setItemDetails((p) => ({
        ...p,
        [itemName]: { quantity: 1, rate: defaultRate },
      }));
    }
  };

  const updateItemDetail = (itemName, field, value) => {
    const numValue = parseFloat(value) || 0;
    setItemDetails((p) => ({
      ...p,
      [itemName]: { ...p[itemName], [field]: numValue },
    }));
    setOutcomeData((p) => ({
      ...p,
      ordered_items: p.ordered_items.map((i) =>
        i.name === itemName ? { ...i, [field]: numValue } : i,
      ),
    }));
  };

  const calculateTotalOrderValue = () =>
    outcomeData.ordered_items.reduce((t, i) => t + i.quantity * i.rate, 0);

  const handleCheckOut = async () => {
    if (!activeVisit || !outcomeData.outcome) {
      toast.error("Please select an outcome");
      return;
    }
    const visitId = activeVisit.id || activeVisit.visit_id;
    if (!visitId) {
      toast.error("Invalid visit ID");
      return;
    }
    try {
      await axios.post(
        `${API}/visit/${visitId}/check-out`,
        {
          outcome: outcomeData.outcome,
          order_value: calculateTotalOrderValue(),
          ordered_items: outcomeData.ordered_items,
          notes: outcomeData.notes || null,
          next_visit_date: outcomeData.next_visit_date || null,
          contact_name: outcomeData.contact_name || null,
          contact_phone: outcomeData.contact_phone || null,
          contact_email: outcomeData.contact_email || null,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
        },
        { headers: getAuthHeader() },
      );
      setActiveVisit(null);
      setCheckOutDialogOpen(false);
      setOutcomeData({
        outcome: "",
        order_value: "",
        ordered_items: [],
        notes: "",
        next_visit_date: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });
      setItemDetails({});
      toast.success("Visit completed!");
      fetchTodayVisits();
      fetchNearbyDealers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Check-out failed");
    }
  };

  const handleForceCheckout = async () => {
    try {
      await axios.post(
        `${API}/visit/force-checkout`,
        {},
        { headers: getAuthHeader() },
      );
      setActiveVisit(null);
      toast.success("Stale visit closed");
      fetchTodayVisits();
      fetchNearbyDealers();
    } catch {
      toast.error("Failed to force close visit");
    }
  };

  const openCheckInDialog = (dealer) => {
    setSelectedDealer(dealer);
    setCheckInDialogOpen(true);
  };

  const fetchCompanyProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/items`, {
        headers: getAuthHeader(),
        params: { active: true },
      });
      const items = res.data || [];
      setCompanyProducts(Array.isArray(items) ? items : []);
    } catch {
      setCompanyProducts([]);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (
      checkOutDialogOpen &&
      outcomeData.outcome === "Order Booked" &&
      companyProducts.length === 0
    ) {
      fetchCompanyProducts();
    }
  }, [
    checkOutDialogOpen,
    outcomeData.outcome,
    companyProducts.length,
    fetchCompanyProducts,
  ]);

  // ── Computed stats ───────────────────────────────────────────────────
  const activeVisitsCount =
    fieldStats?.active_count ??
    todayVisits.filter((v) => !v.check_out_time).length;
  const completedVisitsCount =
    fieldStats?.completed_count ??
    todayVisits.filter((v) => !!v.check_out_time).length;
  const missedVisitsCount =
    fieldStats?.missed_count ??
    todayVisits.filter(
      (v) => v.outcome === "Lost Visit" || v.outcome === "No Meeting",
    ).length;
  const totalRevenue = todayVisits.reduce(
    (s, v) => s + (v.order_value || 0),
    0,
  );
  const prevRevenue = fieldStats?.prev_order_value ?? 0;
  const distanceKm = fieldStats?.distance_km ?? 0;
  const prevDistanceKm = fieldStats?.prev_distance_km ?? 0;
  const totalDurationMins =
    fieldStats?.duration_mins ??
    todayVisits.reduce((s, v) => s + (v.time_spent_minutes || 0), 0);
  const durationStr =
    totalDurationMins >= 60
      ? `${Math.floor(totalDurationMins / 60)}hr ${Math.round(totalDurationMins % 60)} mins`
      : `${Math.round(totalDurationMins)} mins`;

  // Last sync text
  const syncText = lastSync
    ? (() => {
        const diffMins = Math.floor((Date.now() - lastSync.getTime()) / 60000);
        return diffMins < 1
          ? "Just now"
          : `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
      })()
    : "—";

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <SalesExecutiveLayout title="Field View">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">
              Getting your location…
            </p>
          </div>
        </div>
      </SalesExecutiveLayout>
    );
  }

  // ── Outcome badge helper ─────────────────────────────────────────────
  const outcomeBadge = (outcome) => {
    const cls =
      outcome === "Order Booked"
        ? "bg-emerald-100 text-emerald-700"
        : outcome === "Follow-up Required"
          ? "bg-amber-100 text-amber-700"
          : outcome === "Lost Visit"
            ? "bg-red-100 text-red-700"
            : !outcome
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600";
    return (
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}
      >
        {outcome || "In Progress"}
      </span>
    );
  };

  // ── Visit table shared ────────────────────────────────────────────────
  const VisitTable = ({ visits }) =>
    visits.length === 0 ? (
      <p className="text-xs text-gray-400 text-center py-10">
        No visits yet today
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y border-gray-200">
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200 w-8">
                #
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Date
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Dealer
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Contact
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Check-in
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Duration
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Outcome
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2 border-r border-gray-200">
                Value
              </th>
              <th className="text-[10px] text-gray-600 font-semibold px-2 py-2">
                Items
              </th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit, idx) => {
              const dealerName = getTruncatedText(visit.dealer_name, 16);
              const contactName = getTruncatedText(
                visit.contact_name || "–",
                12,
              );

              return (
                <tr
                  key={visit.id}
                  className="border-b border-gray-100 transition-colors"
                >
                  <td className="px-2 py-1.5 text-xs font-medium text-gray-600 border-r border-gray-100 w-8">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-gray-600 whitespace-nowrap border-r border-gray-100">
                    {formatDateDDMmmYYYY(visit.check_in_time)}
                  </td>
                  <td
                    className="px-2 py-1.5 text-xs font-medium text-gray-800 border-r border-gray-100"
                    title={dealerName.full}
                  >
                    {dealerName.display}
                  </td>
                  <td
                    className="px-2 py-1.5 text-[11px] text-gray-500 border-r border-gray-100"
                    title={contactName.full}
                  >
                    {contactName.display}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-gray-500 whitespace-nowrap border-r border-gray-100">
                    {new Date(visit.check_in_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-gray-500 text-center border-r border-gray-100">
                    {visit.time_spent_minutes
                      ? `${Math.round(visit.time_spent_minutes)}m`
                      : "–"}
                  </td>
                  <td className="px-2 py-1.5 border-r border-gray-100">
                    {outcomeBadge(visit.outcome)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-orange-600 text-right whitespace-nowrap border-r border-gray-100">
                    {visit.order_value
                      ? `₹${visit.order_value.toLocaleString()}`
                      : "–"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <OrderItemsView visit={visit} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SalesExecutiveLayout title="Field View">
      <div className="space-y-4" data-testid="field-view">
        {/* ── ROW 1: Welcome + Status + Start/End Visit ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 md:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Left: welcome */}
          <div>
            <p className="text-xs text-gray-400">Welcome back,</p>
            <p className="font-bold text-sm md:text-base text-gray-900">
              {user?.name || "Sales Executive"}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
              <Clock size={11} />
              <span>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>

          {/* Center: Last Sync */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            Last Sync: {syncText}
            <button
              onClick={refreshAll}
              className="ml-1 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowsClockwise size={13} className="text-gray-400" />
            </button>
          </div>

          {/* Right: GPS + Accuracy + Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-2.5 py-1 text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              GPS
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 text-xs font-semibold">
              <MapPin size={11} weight="bold" />
              Accuracy : 10m
            </div>
            {isInMarket ? (
              <button
                onClick={handleEndMarket}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors shadow-sm"
                data-testid="end-market-btn"
              >
                <Stop size={12} weight="fill" />
                End Visit
              </button>
            ) : (
              <button
                onClick={handleStartMarket}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors shadow-sm"
                data-testid="start-market-btn"
              >
                <Play size={12} weight="fill" />
                Start Visit
              </button>
            )}
          </div>
        </div>

        {/* ── Active visit banner ── */}
        {activeVisit && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-emerald-600">
                Active Visit
              </p>
              <p className="text-sm font-bold text-gray-900">
                {activeVisit.dealer_name || activeVisit.name}
              </p>
              <p className="text-xs text-gray-500">
                Started at{" "}
                {new Date(activeVisit.check_in_time).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleForceCheckout}
                className="text-red-600 border border-red-200 bg-white hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                data-testid="force-checkout-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => setCheckOutDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                data-testid="checkout-btn"
              >
                <CheckCircle size={13} weight="bold" /> Check Out
              </button>
            </div>
          </div>
        )}

        {/* ── ROW 2: 3 Stat cards ── */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {/* Visits Today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-400 font-semibold mb-2">
              Visits Today
            </p>
            <div className="flex items-end justify-between gap-1">
              <div>
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {todayVisits.length}
                </div>
                {activeVisitsCount > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold mt-0.5">
                    <ArrowUp size={9} weight="bold" />
                    {activeVisitsCount}
                  </div>
                )}
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={15} className="text-orange-500" weight="fill" />
              </div>
            </div>
          </div>

          {/* Orders Today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-400 font-semibold mb-2">
              Orders Today
            </p>
            <div className="flex items-end justify-between gap-1">
              <div>
                <div className="text-base md:text-xl font-black text-gray-900 leading-tight">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </div>
                {prevRevenue > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold mt-0.5">
                    <ArrowUp size={9} weight="bold" />₹
                    {prevRevenue.toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CurrencyInr
                  size={15}
                  className="text-blue-500"
                  weight="bold"
                />
              </div>
            </div>
          </div>

          {/* Distance Travelled */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-400 font-semibold mb-2">
              Distance
            </p>
            <div className="flex items-end justify-between gap-1">
              <div>
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {distanceKm}
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-bold mt-0.5">
                  {prevDistanceKm > 0 ? (
                    <>
                      <ArrowUp
                        size={9}
                        className="text-emerald-600"
                        weight="bold"
                      />
                      <span className="text-emerald-600">
                        {prevDistanceKm} km
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">km</span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <NavigationArrow
                  size={15}
                  className="text-emerald-500"
                  weight="bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Activity summary bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center gap-3 md:gap-5 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-100 flex-shrink-0"></span>
            <span className="text-gray-500">Active Visits</span>
            <span className="font-bold text-gray-900">{activeVisitsCount}</span>
          </div>
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-100 flex-shrink-0"></span>
            <span className="text-gray-500">Completed Visits</span>
            <span className="font-bold text-gray-900">
              {completedVisitsCount}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-bold text-sm leading-none">
              ✕
            </span>
            <span className="text-gray-500">Missed Visits</span>
            <span className="font-bold text-gray-900">
              {missedVisitsCount} Km
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-gray-500">Duration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="font-bold text-gray-900">{durationStr}</span>
          </div>
        </div>

        {/* ── ROW 4: Map / List tabs (always visible) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-0">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === "map"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <MapTrifold
                  size={15}
                  weight={viewMode === "map" ? "fill" : "regular"}
                />
                Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === "list"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List
                  size={15}
                  weight={viewMode === "list" ? "fill" : "regular"}
                />
                List
              </button>
            </div>
            <button
              onClick={refreshAll}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowsClockwise size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Map view */}
          {viewMode === "map" && currentLocation && (
            <div className="h-[240px] sm:h-[300px] md:h-[380px]">
              <MapContainer
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[currentLocation.lat, currentLocation.lng]}
                  icon={currentIcon}
                >
                  <Popup>You are here</Popup>
                </Marker>
                {nearbyDealers.map((dealer) => (
                  <Marker
                    key={dealer.id}
                    position={[dealer.lat, dealer.lng]}
                    icon={dealerIcon}
                    eventHandlers={{ click: () => openCheckInDialog(dealer) }}
                  >
                    <Popup>
                      <p className="font-semibold text-sm">{dealer.name}</p>
                      <p className="text-xs text-gray-400">
                        {dealer.distance}m away
                      </p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <div className="p-3 space-y-2">
              {nearbyDealers.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin size={36} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    {isInMarket
                      ? "No dealers found nearby."
                      : "Start a market visit to see nearby dealers."}
                  </p>
                  {!isInMarket && (
                    <button
                      onClick={handleStartMarket}
                      className="mt-3 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full mx-auto transition-colors"
                    >
                      <Play size={12} weight="fill" /> Start Visit
                    </button>
                  )}
                </div>
              ) : (
                nearbyDealers.map((dealer) => (
                  <div
                    key={dealer.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openCheckInDialog(dealer)}
                    data-testid={`dealer-card-${dealer.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Storefront size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {dealer.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {dealer.dealer_type}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        dealer.distance <= 100
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <NavigationArrow size={10} />
                      {dealer.distance}m
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Daily Targets (optional) ── */}
        {(user?.daily_sales_target != null ||
          user?.daily_sales_amount_target != null) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
              <Target size={13} /> Daily Targets
            </p>
            <div className="grid grid-cols-2 gap-3">
              {user?.daily_sales_target != null && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400">Visit Target</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    <span className="text-orange-600">
                      {todayVisits.length}
                    </span>
                    <span className="text-gray-300 font-normal">
                      {" "}
                      / {user.daily_sales_target}
                    </span>
                  </p>
                </div>
              )}
              {user?.daily_sales_amount_target != null && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400">Sales Target (₹)</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    <span className="text-emerald-600">
                      ₹{totalRevenue.toLocaleString()}
                    </span>
                    <span className="text-gray-300 font-normal">
                      {" "}
                      / ₹{user.daily_sales_amount_target?.toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROW 5: Visit History ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900">
              Visit History
            </span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {["today", "overall"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setVisitTab(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    visitTab === tab
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {visitTab === "today" ? (
            <VisitTable visits={todayVisits} />
          ) : allVisits.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">
              No visits recorded yet
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <VisitTable visits={allVisits} />
            </div>
          )}
        </div>
      </div>

      {/* ═══════ Check-in Dialog ═══════ */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In</DialogTitle>
          </DialogHeader>
          {selectedDealer && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-semibold text-gray-900">
                  {selectedDealer.name}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedDealer.address}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                    {selectedDealer.dealer_type}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <NavigationArrow size={10} />
                    {selectedDealer.distance}m away
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  onClick={() => setCheckInDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  onClick={handleCheckIn}
                  data-testid="confirm-checkin-btn"
                >
                  <MapPin size={15} weight="bold" /> Confirm Check-in
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ Check-out Dialog ═══════ */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent
          className="z-[9999] max-h-[90vh] overflow-y-auto"
          overlayClassName="z-[9998]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Complete Visit &amp; Record Details
            </DialogTitle>
            <p className="text-xs text-gray-400 mt-1">
              Capture dealer information, order details, and follow-up notes
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {activeVisit && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {activeVisit.dealer_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recording visit details…
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Visit Outcome *</Label>
              <Select
                value={outcomeData.outcome}
                onValueChange={(val) =>
                  setOutcomeData({ ...outcomeData, outcome: val })
                }
              >
                <SelectTrigger data-testid="outcome-select">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent className="!z-[10001]">
                  <SelectItem value="Order Booked">Order Booked</SelectItem>
                  <SelectItem value="Follow-up Required">
                    Follow-up Required
                  </SelectItem>
                  <SelectItem value="No Meeting">No Meeting</SelectItem>
                  <SelectItem value="Lost Visit">Lost Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outcomeData.outcome === "Order Booked" && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Package size={14} /> Select Items Ordered
                  </Label>
                  <p className="text-[11px] text-gray-400">
                    Select items and enter quantity &amp; rate
                  </p>
                  {companyProducts.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl p-2 max-h-[280px] overflow-y-auto space-y-2 bg-gray-50/50">
                      {companyProducts.map((item) => {
                        const itemName = item.item_name;
                        const isSelected = outcomeData.ordered_items.some(
                          (i) => i.name === itemName,
                        );
                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl p-3 border transition-all ${isSelected ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"}`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer mb-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOrderedItem(item)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {itemName}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {item.product_category}
                                  </span>
                                </div>
                                <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                                  Default: ₹
                                  {item.default_price?.toLocaleString()}
                                </div>
                              </div>
                            </label>
                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 ml-8">
                                <div>
                                  <Label className="text-[10px] text-gray-500">
                                    Quantity
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={itemDetails[itemName]?.quantity || 1}
                                    onChange={(e) =>
                                      updateItemDetail(
                                        itemName,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-sm mt-1"
                                    placeholder="Qty"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-500">
                                    Price (₹) - Editable
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      itemDetails[itemName]?.rate ||
                                      item.default_price ||
                                      0
                                    }
                                    onChange={(e) =>
                                      updateItemDetail(
                                        itemName,
                                        "rate",
                                        e.target.value,
                                      )
                                    }
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
                    <p className="text-xs text-gray-400 py-2">
                      No items available. Ask admin to add items in Item Master.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Order Value (₹) — Auto Calculated</Label>
                  <Input
                    type="number"
                    value={calculateTotalOrderValue()}
                    readOnly
                    className="bg-gray-50 font-bold text-orange-600"
                    placeholder="Auto calculated"
                    data-testid="order-value-input"
                  />
                  <p className="text-[10px] text-gray-400">
                    Total is automatically calculated from quantity × rate
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={outcomeData.notes}
                onChange={(e) =>
                  setOutcomeData({ ...outcomeData, notes: e.target.value })
                }
                placeholder="Add any notes about this visit…"
                data-testid="visit-notes-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Next Visit Date</Label>
              <Input
                type="date"
                value={outcomeData.next_visit_date}
                onChange={(e) =>
                  setOutcomeData({
                    ...outcomeData,
                    next_visit_date: e.target.value,
                  })
                }
                data-testid="next-visit-date-input"
              />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500">
                Contact Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={outcomeData.contact_name}
                    onChange={(e) =>
                      setOutcomeData({
                        ...outcomeData,
                        contact_name: e.target.value,
                      })
                    }
                    placeholder="Contact name"
                    data-testid="contact-name-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    type="tel"
                    value={outcomeData.contact_phone}
                    onChange={(e) =>
                      setOutcomeData({
                        ...outcomeData,
                        contact_phone: e.target.value,
                      })
                    }
                    placeholder="Phone number"
                    data-testid="contact-phone-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (Optional)</Label>
                <Input
                  type="email"
                  value={outcomeData.contact_email}
                  onChange={(e) =>
                    setOutcomeData({
                      ...outcomeData,
                      contact_email: e.target.value,
                    })
                  }
                  placeholder="Email address"
                  data-testid="contact-email-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 py-2.5 rounded-xl text-sm font-medium transition-colors"
                onClick={() => setCheckOutDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                onClick={handleCheckOut}
                data-testid="confirm-checkout-btn"
              >
                <CheckCircle size={15} weight="bold" /> Complete Visit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SalesExecutiveLayout>
  );
};

export default FieldView;
