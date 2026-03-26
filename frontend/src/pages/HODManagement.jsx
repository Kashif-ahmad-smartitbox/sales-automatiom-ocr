import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Phone,
  Pencil,
  Users,
  UserCircleGear,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { Checkbox } from "../components/ui/checkbox";
import { getTruncatedText } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  employee_code: "",
  assigned_sales_executive_ids: [],
};

const HODManagement = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [hods, setHODs] = useState([]);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [hodsRes, execsRes] = await Promise.all([
        axios.get(`${API}/hod`, { headers: getAuthHeader() }),
        axios.get(`${API}/sales-executives`, { headers: getAuthHeader() }),
      ]);
      setHODs(hodsRes.data);
      setSalesExecutives(execsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
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
        await axios.put(`${API}/hod/${editingId}`, formData, {
          headers: getAuthHeader(),
        });
        toast.success("HOD updated successfully");
      } else {
        await axios.post(`${API}/hod`, formData, { headers: getAuthHeader() });
        toast.success("HOD added successfully");
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleEdit = (hod) => {
    setEditingId(hod.id);
    setFormData({
      name: hod.name,
      email: hod.email,
      mobile: hod.mobile,
      password: "",
      employee_code: hod.employee_code || "",
      assigned_sales_executive_ids: hod.assigned_sales_executive_ids || [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this HOD?")) return;
    try {
      await axios.delete(`${API}/hod/${id}`, { headers: getAuthHeader() });
      toast.success("HOD deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete HOD");
    }
  };

  const toggleSalesExecutive = (execId) => {
    setFormData((prev) => {
      const ids = prev.assigned_sales_executive_ids;
      if (ids.includes(execId)) {
        return {
          ...prev,
          assigned_sales_executive_ids: ids.filter((id) => id !== execId),
        };
      } else {
        return { ...prev, assigned_sales_executive_ids: [...ids, execId] };
      }
    });
  };

  const filteredHODs = hods.filter((hod) => {
    const search = searchTerm.toLowerCase();
    const assignedExecutivesNames =
      hod.assigned_sales_executives
        ?.map((exec) => exec.name.toLowerCase())
        .join(" ") || "";
    return (
      hod.name?.toLowerCase().includes(search) ||
      hod.employee_code?.toLowerCase().includes(search) ||
      hod.mobile?.toLowerCase().includes(search) ||
      hod.email?.toLowerCase().includes(search) ||
      assignedExecutivesNames.includes(search)
    );
  });

  return (
    <AdminLayout title="HOD Management">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              HOD Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage Head of Departments
            </p>
          </div>
          <SearchBar placeholder="Search HODs..." />
        </div>

        {/* Actions + Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-md px-3 py-1.5">
              <span className="text-[11px] font-medium text-primary-700">
                Total HODs
              </span>
              <span className="text-sm font-bold text-primary-800">
                {hods.length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5">
              <span className="text-[11px] font-medium text-emerald-700">
                Sales Executives
              </span>
              <span className="text-sm font-bold text-emerald-800">
                {salesExecutives.length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-1.5">
              <span className="text-[11px] font-medium text-amber-700">
                Assigned
              </span>
              <span className="text-sm font-bold text-amber-800">
                {hods.reduce(
                  (sum, hod) =>
                    sum + (hod.assigned_sales_executive_ids?.length || 0),
                  0,
                )}
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
              <Button className="bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 text-white shadow-sm text-xs h-8 rounded-xl">
                <Plus className="mr-1" size={14} />
                Add HOD
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit HOD" : "Add HOD"}</DialogTitle>
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
                      required
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
                      placeholder="HOD001"
                      required
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
                      required
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
                      required
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
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-2 border-t pt-4">
                    <Label className="text-base font-semibold">
                      Assign Sales Executives
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Select sales executives to be managed by this HOD
                    </p>

                    {salesExecutives.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No sales executives available
                      </p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                        {salesExecutives.map((exec) => (
                          <div
                            key={exec.id}
                            className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded"
                          >
                            <Checkbox
                              id={exec.id}
                              checked={formData.assigned_sales_executive_ids.includes(
                                exec.id,
                              )}
                              onCheckedChange={() =>
                                toggleSalesExecutive(exec.id)
                              }
                            />
                            <Label
                              htmlFor={exec.id}
                              className="flex-1 cursor-pointer font-normal text-sm"
                            >
                              {exec.name}{" "}
                              <span className="text-xs text-gray-500">
                                ({exec.employee_code})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Selected: {formData.assigned_sales_executive_ids.length}{" "}
                      sales executive(s)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" className="rounded-xl hover:bg-gray-100" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md transition-all"
                  >
                    {editingId ? "Update HOD" : "Add HOD"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* HODs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredHODs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              {searchTerm
                ? "No HODs match your search"
                : 'No HODs added yet. Click "Add HOD" to get started.'}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-200">
                    <tr className="border-y border-gray-200">
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200 w-8">
                        #
                      </th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        HOD Name
                      </th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Employee Code
                      </th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Email
                      </th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Mobile
                      </th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Team Size
                      </th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Assigned Team
                      </th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHODs.map((hod, idx) => {
                      const hodName = getTruncatedText(hod.name, 18);
                      const hodEmail = getTruncatedText(hod.email, 20);
                      const assignedTeamNames = (
                        hod.assigned_sales_executives || []
                      )
                        .map((exec) => exec.name)
                        .join(", ");

                      return (
                        <tr
                          key={hod.id}
                          className="border-b border-gray-100 transition-colors"
                        >
                          <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-semibold text-gray-900 w-8">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-500 to-indigo-600 flex-shrink-0">
                                {hod.name.charAt(0)}
                              </div>
                              <span
                                className="text-[11px] font-semibold text-gray-800"
                                title={hodName.full}
                              >
                                {hodName.display}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-[11px] font-semibold text-gray-900 border-r border-gray-100">
                            {hod.employee_code}
                          </td>
                          <td
                            className="px-2 py-1.5 text-[11px] font-medium text-gray-900 border-r border-gray-100"
                            title={hodEmail.full}
                          >
                            {hodEmail.display}
                          </td>
                          <td className="px-2 py-1.5 text-[11px] font-medium text-gray-900 border-r border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400" />
                              <span>{hod.mobile}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center border-r border-gray-100">
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">
                              <Users size={10} className="mr-1" />
                              {hod.assigned_sales_executive_ids?.length || 0}
                            </Badge>
                          </td>
                          <td
                            className="px-2 py-1.5 border-r border-gray-100"
                            title={assignedTeamNames || "No team assigned"}
                          >
                            {hod.assigned_sales_executives &&
                            hod.assigned_sales_executives.length > 0 ? (
                              <div className="text-[11px] text-gray-700">
                                {hod.assigned_sales_executives
                                  .slice(0, 2)
                                  .map((exec, execIdx) => (
                                    <span key={exec.id}>
                                      {exec.name}
                                      {execIdx <
                                      Math.min(
                                        1,
                                        hod.assigned_sales_executives.length -
                                          1,
                                      )
                                        ? ", "
                                        : ""}
                                    </span>
                                  ))}
                                {hod.assigned_sales_executives.length > 2 && (
                                  <span className="text-gray-500">
                                    {" "}
                                    +{hod.assigned_sales_executives.length -
                                      2}{" "}
                                    more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                No team assigned
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-xs h-6 px-2"
                                onClick={() => handleEdit(hod)}
                              >
                                <Pencil size={12} className="mr-0.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-6 px-2"
                                onClick={() => handleDelete(hod.id)}
                              >
                                <Trash size={12} className="mr-0.5" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default HODManagement;
