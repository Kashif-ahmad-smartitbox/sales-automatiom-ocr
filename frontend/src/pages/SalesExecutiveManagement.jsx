import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Plus,
  Trash,
  MapPin,
  Phone,
  Pencil,
  Globe,
  Crosshair,
  ChartBar,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { toast } from "sonner";
import OrderItemsView from "../components/OrderItemsView";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { State, City } from "country-state-city";
import { formatDateDDMmmYYYY, getTruncatedText } from "../utils/tableHelpers";
import SearchBar from "../components/SearchBar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  employee_code: "",
  assigned_state: "",
  assigned_city: "",
  is_live_tracking: false,
  product_category_access: [],
  daily_sales_target: "",
  daily_sales_amount_target: "",
};

const SalesExecutiveManagement = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const execsRes = await axios.get(`${API}/sales-executives`, {
        headers: getAuthHeader(),
      });
      setExecutives(execsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
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
        axios.get(`${API}/reports/executive-performance?exec_id=${userId}`, {
          headers: getAuthHeader(),
        }),
        axios.get(`${API}/visits/history?exec_id=${userId}`, {
          headers: getAuthHeader(),
        }),
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
    setAvailableStates(State.getStatesOfCountry("IN"));
  }, [fetchData]);

  // Update available cities when state changes
  useEffect(() => {
    if (formData.assigned_state) {
      // Find state code
      const stateObj = availableStates.find(
        (s) => s.name === formData.assigned_state,
      );
      if (stateObj) {
        setAvailableCities(City.getCitiesOfState("IN", stateObj.isoCode));
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
      if (
        !formData.is_live_tracking &&
        (!formData.assigned_state || !formData.assigned_city)
      ) {
        toast.error(
          "Please select State and City for restricted access, or enable Live Tracking.",
        );
        return;
      }

      const payload = {
        ...formData,
        daily_sales_target:
          formData.daily_sales_target === ""
            ? null
            : Number(formData.daily_sales_target),
        daily_sales_amount_target:
          formData.daily_sales_amount_target === ""
            ? null
            : Number(formData.daily_sales_amount_target),
      };
      if (editingId) delete payload.password;

      if (editingId) {
        await axios.put(`${API}/sales-executives/${editingId}`, payload, {
          headers: getAuthHeader(),
        });
        toast.success("Sales executive updated");
      } else {
        await axios.post(`${API}/sales-executives`, payload, {
          headers: getAuthHeader(),
        });
        toast.success("Sales executive added");
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleEdit = (exec) => {
    setEditingId(exec.id);
    setFormData({
      name: exec.name,
      email: exec.email,
      mobile: exec.mobile,
      password: "", // Don't pre-fill password
      employee_code: exec.employee_code || "",
      assigned_state: exec.assigned_state || "",
      assigned_city: exec.assigned_city || "",
      is_live_tracking: exec.is_live_tracking || false,
      product_category_access: exec.product_category_access || [],
      daily_sales_target: exec.daily_sales_target ?? "",
      daily_sales_amount_target: exec.daily_sales_amount_target ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this sales executive?")
    )
      return;
    try {
      await axios.delete(`${API}/sales-executives/${id}`, {
        headers: getAuthHeader(),
      });
      toast.success("Sales executive deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete executive");
    }
  };

  const getStatus = (exec) => {
    if (exec.is_in_market) return "active";
    if (exec.last_location_update) {
      const lastUpdate = new Date(exec.last_location_update);
      const now = new Date();
      const diffMinutes = (now - lastUpdate) / (1000 * 60);
      if (diffMinutes < 30) return "idle";
    }
    return "offline";
  };

  const filteredExecutives = executives.filter((e) => {
    const search = searchTerm.toLowerCase();
    return (
      e.name?.toLowerCase().includes(search) ||
      e.employee_code?.toLowerCase().includes(search) ||
      e.mobile?.toLowerCase().includes(search) ||
      e.email?.toLowerCase().includes(search) ||
      e.assigned_city?.toLowerCase().includes(search) ||
      e.assigned_state?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout title="Sales Team">
      <div className="space-y-2" data-testid="sales-executive-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              Sales Team
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your field sales executives
            </p>
          </div>
          <SearchBar placeholder="Search team members..." />
        </div>

        {/* Actions + Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-primary-300 border border-primary-100 px-3 py-1.5 rounded-full">
              <span className="text-[11px] font-medium text-white">
                Total Team
              </span>
              <span className="text-sm font-bold text-white">
                {executives.length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-400 border border-emerald-100 px-3 py-1.5 rounded-full">
              <span className="text-[11px] font-medium text-white">
                Active Now
              </span>
              <span className="text-sm font-bold text-white">
                {executives.filter((e) => e.is_in_market).length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-amber-400 border border-amber-100 px-3 py-1.5 rounded-full">
              <span className="text-[11px] font-medium text-white">Idle</span>
              <span className="text-sm font-bold text-white">
                {executives.filter((e) => getStatus(e) === "idle").length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-500 border border-gray-200 px-3 py-1.5 rounded-full">
              <span className="text-[11px] font-medium text-white">
                Offline
              </span>
              <span className="text-sm font-bold text-white">
                {executives.filter((e) => getStatus(e) === "offline").length}
              </span>
            </div>
            {searchTerm && (
              <span className="text-xs text-gray-400 ml-1">
                &middot; "{searchTerm}"
              </span>
            )}
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) closeDialog();
              else setDialogOpen(true);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white shadow-sm text-xs h-8"
                data-testid="add-executive-btn"
              >
                <Plus className="mr-1" size={14} />
                Add Executive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Sales Executive" : "Add Sales Executive"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required={!editingId}
                      disabled={editingId}
                      data-testid="executive-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input
                      value={formData.employee_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_code: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        minLength={6}
                        data-testid="executive-password-input"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <Label className="text-base font-semibold mb-3 block">
                      Daily Targets
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Daily Sales Target (visits count)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.daily_sales_target}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              daily_sales_target: e.target.value,
                            })
                          }
                          placeholder="e.g. 10"
                          data-testid="daily-sales-target-input"
                        />
                        <p className="text-[10px] text-slate-500">
                          Target number of dealer visits per day
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Sales Amount Target (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.daily_sales_amount_target}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              daily_sales_amount_target: e.target.value,
                            })
                          }
                          placeholder="e.g. 50000"
                          data-testid="daily-sales-amount-target-input"
                        />
                        <p className="text-[10px] text-slate-500">
                          Target order value in ₹ per day
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <Label className="text-base font-semibold mb-3 block">
                      Visit Restrictions
                    </Label>

                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="live-mode"
                        checked={formData.is_live_tracking}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            is_live_tracking: checked,
                          })
                        }
                      />
                      <Label
                        htmlFor="live-mode"
                        className="font-medium cursor-pointer"
                      >
                        Enable Any-City Live Tracking
                        <span className="block text-xs text-slate-500 font-normal">
                          If enabled, user can visit ANY location. If disabled,
                          user is restricted to the selected city.
                        </span>
                      </Label>
                    </div>

                    {!formData.is_live_tracking && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label>State *</Label>
                          <Select
                            value={formData.assigned_state}
                            onValueChange={(val) =>
                              setFormData({
                                ...formData,
                                assigned_state: val,
                                assigned_city: "",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {availableStates.map((state) => (
                                <SelectItem
                                  key={state.isoCode}
                                  value={state.name}
                                >
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
                            onValueChange={(val) =>
                              setFormData({ ...formData, assigned_city: val })
                            }
                            disabled={!formData.assigned_state}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
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
                  <Button
                    type="button"
                    className="rounded-xl hover:bg-red-500 hover:text-white"
                    variant="outline"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md rounded-xl"
                    data-testid="executive-submit-btn"
                  >
                    {editingId ? "Update Executive" : "Add Executive"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Executives Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredExecutives.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              {searchTerm
                ? "No executives match your search"
                : 'No sales executives added yet. Click "Add Sales Executive" to get started.'}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[30rem]">
                <Table className="w-full text-left">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-y border-gray-200">
                      <TableHead className="px-2 py-2">#</TableHead>
                      <TableHead className="px-3 py-2">
                        Executive Name
                      </TableHead>
                      <TableHead className="px-3 py-2">Employee Code</TableHead>
                      <TableHead className="px-3 py-2">Email</TableHead>
                      <TableHead className="px-3 py-2">Mobile</TableHead>
                      <TableHead className="px-3 py-2">
                        Location/Tracking
                      </TableHead>
                      <TableHead className="text-center px-2 py-2">
                        Status
                      </TableHead>
                      <TableHead className="text-center px-2 py-2 border-r-0">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExecutives.map((exec, idx) => {
                      const status = getStatus(exec);
                      const nameText = getTruncatedText(exec.name, 20);
                      const emailText = getTruncatedText(exec.email, 20);
                      return (
                        <TableRow
                          key={exec.id}
                          className="transition-colors"
                          data-testid={`executive-row-${exec.id}`}
                        >
                          <TableCell className="px-2 py-1 text-xs text-gray-900 w-8 text-center border-r border-gray-200">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="px-3 py-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                                  status === "active"
                                    ? "bg-emerald-500"
                                    : status === "idle"
                                      ? "bg-amber-500"
                                      : "bg-gray-400"
                                }`}
                              >
                                {exec.name.charAt(0)}
                              </div>
                              <span
                                className="text-xs text-gray-900"
                                title={nameText.full}
                              >
                                {nameText.display}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-1 text-xs text-gray-900 border-r border-gray-200">
                            {exec.employee_code}
                          </TableCell>
                          <TableCell
                            className="px-3 py-1 text-xs text-gray-800 border-r border-gray-200"
                            title={emailText.full}
                          >
                            {emailText.display}
                          </TableCell>
                          <TableCell className="px-3 py-1 text-xs text-gray-800 border-r border-gray-200">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-500" />
                              <span>{exec.mobile}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-1 text-xs text-gray-800 border-r border-gray-200">
                            <div className="flex items-center gap-1.5">
                              {exec.is_live_tracking ? (
                                <>
                                  <Globe
                                    size={12}
                                    className="text-emerald-700 flex-shrink-0"
                                  />
                                  <span className="text-emerald-800">
                                    Live Tracking (All Cities)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <MapPin
                                    size={12}
                                    className="text-amber-700 flex-shrink-0"
                                  />
                                  <span>
                                    {exec.assigned_city || "No City"},{" "}
                                    {exec.assigned_state}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center border-r border-gray-200">
                            <span
                              className={`text-xs ${
                                status === "active"
                                  ? "text-emerald-700"
                                  : status === "idle"
                                    ? "text-amber-700"
                                    : "text-gray-500"
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center border-r-0">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs h-6 px-2"
                                onClick={() => handleViewReport(exec)}
                              >
                                <ChartBar size={12} className="mr-0.5" />
                                Report
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary-700 hover:text-primary-800 hover:bg-primary-50 text-xs h-6 px-2"
                                onClick={() => handleEdit(exec)}
                                data-testid={`edit-executive-${exec.id}`}
                              >
                                <Pencil size={12} className="mr-0.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-700 hover:text-red-800 hover:bg-red-50 text-xs h-6 px-2"
                                onClick={() => handleDelete(exec.id)}
                                data-testid={`delete-executive-${exec.id}`}
                              >
                                <Trash size={12} className="mr-0.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Modal */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sales Executive Report</DialogTitle>
            </DialogHeader>
            {reportLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : !execReport ? (
              <div className="text-center py-8 text-slate-500">
                No report data available
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-gray-100 gap-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-800">
                      {execReport.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{execReport.employee_code}</span>
                      <span>•</span>
                      <span>{execReport.mobile}</span>
                    </p>
                  </div>
                  <span
                    className={
                      execReport.is_in_market
                        ? "text-xs font-semibold text-emerald-600"
                        : "text-xs font-semibold text-slate-500"
                    }
                  >
                    {execReport.is_in_market
                      ? "Currently In Market"
                      : "Currently Offline"}
                  </span>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 mb-1">
                      Total Visits
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {execReport.total_visits}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 mb-1">
                      Completed
                    </p>
                    <p className="text-lg font-bold text-emerald-700">
                      {execReport.completed_visits}
                    </p>
                  </div>
                  <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                    <p className="text-[10px] text-primary-600 mb-1">Orders</p>
                    <p className="text-lg font-bold text-primary-700">
                      ₹{execReport.total_orders.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <p className="text-[10px] text-purple-600 mb-1">Avg Time</p>
                    <p className="text-lg font-bold text-purple-700">
                      {execReport.avg_time_per_visit}m
                    </p>
                  </div>
                </div>

                {/* Visit History Table */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2">
                    Recent Visit History
                  </h4>
                  <div className="border border-gray-100 rounded-lg overflow-auto max-h-[30rem]">
                    <Table className="w-full border-collapse text-left min-w-[500px]">
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-y border-gray-200">
                          <TableHead className="px-2 py-2 w-8">#</TableHead>
                          <TableHead className="px-2 py-2">
                            Date & Time
                          </TableHead>
                          <TableHead className="px-2 py-2">
                            Dealer / Location
                          </TableHead>
                          <TableHead className="px-2 py-2">Duration</TableHead>
                          <TableHead className="px-2 py-2">Outcome</TableHead>
                          <TableHead className="px-2 py-2 text-right">
                            Order Value
                          </TableHead>
                          <TableHead className="px-2 py-2 text-center border-r-0">
                            Items
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {execVisits.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="px-2 py-6 text-center text-[11px] text-gray-500"
                            >
                              No visit history found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          execVisits.map((visit, idx) => {
                            const dealerName = getTruncatedText(
                              visit.dealer_name || "Unknown Dealer",
                              20,
                            );
                            const locationAddress = getTruncatedText(
                              visit.location_address || "No address",
                              25,
                            );

                            return (
                              <TableRow
                                key={visit.id}
                                className="transition-colors"
                              >
                                <TableCell className="px-2 py-1 text-xs text-gray-900 w-8 border-r border-gray-200">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="px-2 py-1 whitespace-nowrap border-r border-gray-200">
                                  <div className="text-xs text-gray-900">
                                    {formatDateDDMmmYYYY(visit.check_in_time)}
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {new Date(
                                      visit.check_in_time,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1 border-r border-gray-200">
                                  <div
                                    className="text-xs text-gray-900"
                                    title={dealerName.full}
                                  >
                                    {dealerName.display}
                                  </div>
                                  <div
                                    className="text-[10px] text-gray-600"
                                    title={locationAddress.full}
                                  >
                                    {locationAddress.display}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1 text-xs text-gray-900 border-r border-gray-200">
                                  {visit.duration_minutes
                                    ? `${visit.duration_minutes}m`
                                    : "-"}
                                </TableCell>
                                <TableCell className="px-2 py-1 border-r border-gray-200">
                                  <span
                                    className={`text-xs ${
                                      visit.outcome === "Order Booked"
                                        ? "text-primary-700"
                                        : visit.outcome === "No Meeting"
                                          ? "text-red-700"
                                          : "text-gray-500"
                                    }`}
                                  >
                                    {visit.outcome || "Pending"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-2 py-1 text-right text-xs text-primary-700 border-r border-gray-200">
                                  {visit.order_value > 0
                                    ? `₹${visit.order_value.toLocaleString()}`
                                    : "-"}
                                </TableCell>
                                <TableCell className="px-2 py-1 text-center border-r-0">
                                  <OrderItemsView visit={visit} />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
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
