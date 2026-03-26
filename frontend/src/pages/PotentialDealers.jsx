import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { MapPin, Calendar, Buildings, Check } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { formatDateDDMmmYYYY, getTruncatedText } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PotentialDealers = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPotential, setSelectedPotential] = useState(null);
  const [selectedExecutive, setSelectedExecutive] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [potentialsRes, executivesRes] = await Promise.all([
        axios.get(`${API}/visit/potentials`, { headers: getAuthHeader() }),
        axios.get(`${API}/sales-executives`, { headers: getAuthHeader() }),
      ]);
      setPotentials(potentialsRes.data);
      setSalesExecutives(executivesRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignClick = (potential) => {
    setSelectedPotential(potential);
    setSelectedExecutive(potential.assigned_to || "");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedExecutive) {
      toast.error("Please select a sales executive");
      return;
    }

    console.log("=== Assigning Potential ===");
    console.log("Potential:", selectedPotential);
    console.log("Potential ID:", selectedPotential.id);
    console.log("Sales Executive ID:", selectedExecutive);

    try {
      const response = await axios.put(
        `${API}/visit/potentials/${selectedPotential.id}/assign`,
        { sales_executive_id: selectedExecutive },
        { headers: getAuthHeader() },
      );
      console.log("Assignment response:", response.data);
      toast.success("Potential dealer assigned successfully");
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Assignment error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.detail || "Failed to assign potential dealer",
      );
    }
  };

  const filteredPotentials = potentials.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.place_name?.toLowerCase().includes(search) ||
      p.address?.toLowerCase().includes(search) ||
      p.found_by_name?.toLowerCase().includes(search) ||
      p.place_id?.toLowerCase().includes(search) ||
      p.assigned_to_name?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout title="Potential Dealers">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              Potential Dealers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
            Leads discovered by field team
            </p>
          </div>
          <SearchBar placeholder="Search potentials..." />
        </div>

        {/* Actions + Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-primary-400 border border-primary-100 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-medium text-white">
                Total Potentials
              </span>
              <span className="text-sm font-bold text-white">
                {potentials.length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500 border border-emerald-100 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-medium text-white">
                Assigned
              </span>
              <span className="text-sm font-bold text-white">
                {potentials.filter((p) => p.is_assigned).length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-500 border border-gray-200 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-medium text-white">
                Unassigned
              </span>
              <span className="text-sm font-bold text-white">
                {potentials.filter((p) => !p.is_assigned).length}
              </span>
            </div>
            {searchTerm && (
              <span className="text-xs text-gray-400">
                &middot; "{searchTerm}"
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-8 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-800 hover:text-white"
          >
            Refresh
          </Button>
        </div>

        {/* Content */}
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[30rem]">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                <tr className="border-y border-gray-200">
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 border-r border-gray-200 w-8">
                    #
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600 border-r border-gray-200">
                    Potential Dealer
                  </th>
                  <th className="px-2 py-1.5 text-xs font-semibold text-gray-600 border-r border-gray-200 w-10 text-center">
                    Addr
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600 border-r border-gray-200">
                    Found By
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600 border-r border-gray-200">
                    Date Found
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600 border-r border-gray-200">
                    Assigned To
                  </th>
                  <th className="px-3 py-1.5 text-center text-xs font-semibold text-gray-600">
                    Assign
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-2 py-8 text-center">
                      <div className="flex justify-center items-center gap-2 text-[11px] text-gray-500">
                        <div className="spinner w-4 h-4" /> Loading data...
                      </div>
                    </td>
                  </tr>
                ) : filteredPotentials.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-2 py-8 text-center text-[11px] text-gray-500"
                    >
                      {searchTerm
                        ? "No matches found."
                        : "No potential dealers found yet."}
                    </td>
                  </tr>
                ) : (
                  filteredPotentials.map((item, idx) => {
                    const placeName = getTruncatedText(item.place_name, 18);
                    const foundByName = getTruncatedText(
                      item.found_by_name,
                      16,
                    );
                    const assignedToName = getTruncatedText(
                      item.assigned_to_name || "–",
                      16,
                    );

                    return (
                      <tr
                        key={item._id || item.id}
                        className="border-b border-gray-100 transition-colors"
                      >
                        <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-semibold text-gray-900 w-8">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div
                            className="font-medium text-xs text-gray-800"
                            title={placeName.full}
                          >
                            {placeName.display}
                          </div>
                          <div className="text-[12px] text-gray-400 mt-0.5">
                            ID: {item.place_id.substring(0, 10)}...
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 w-10 text-center">
                          <button
                            title={item.address || "No address"}
                            className="text-gray-400 hover:text-primary-600 transition-colors cursor-help inline-flex"
                          >
                            <MapPin size={13} weight="fill" />
                          </button>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                              {item.found_by_name.charAt(0)}
                            </div>
                            <span
                              className="text-xs font-semibold text-gray-900"
                              title={foundByName.full}
                            >
                              {foundByName.display}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{formatDateDDMmmYYYY(item.created_at)}</span>
                          </div>
                          <div className="text-[12px] text-gray-400 pl-5">
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          {item.is_assigned ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0"
                              >
                                Assigned
                              </Badge>
                              <span
                                className="text-[11px] font-medium text-gray-900"
                                title={assignedToName.full}
                              >
                                {assignedToName.display}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-600 border-yellow-200 text-[10px] px-1.5 py-0"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <Button
                            variant={item.is_assigned ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleAssignClick(item)}
                            className="h-7 px-2 bg-green-600 text-white rounded-xl"
                          >
                            {item.is_assigned ? (
                              <>
                                <Check size={14} className="mr-1" />
                                Reassign
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-1" />
                                Assign
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Potential Dealer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-700">
                Dealer Name
              </Label>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {selectedPotential?.place_name}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">
                Address
              </Label>
              <div className="text-xs text-gray-600 mt-1">
                {selectedPotential?.address}
              </div>
            </div>
            <div>
              <Label
                htmlFor="executive"
                className="text-xs font-medium text-gray-700"
              >
                Select Sales Executive
              </Label>
              <Select
                value={selectedExecutive}
                onValueChange={setSelectedExecutive}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a sales executive" />
                </SelectTrigger>
                <SelectContent>
                  {salesExecutives.map((exec) => (
                    <SelectItem key={exec.id} value={exec.id}>
                      {exec.name} - {exec.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                className="rounded-xl hover:bg-gray-100"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md transition-all" onClick={handleAssign}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PotentialDealers;
