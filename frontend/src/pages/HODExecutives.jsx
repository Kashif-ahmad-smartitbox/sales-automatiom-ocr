import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import HODLayout from "../components/layout/HODLayout";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Phone, MapPin, Globe } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import SearchBar from "../components/SearchBar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODExecutives = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutives = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hod/sales-executives`, {
        headers: getAuthHeader(),
      });
      setExecutives(response.data);
    } catch (error) {
      console.error("Failed to fetch executives:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchExecutives();
  }, [fetchExecutives]);

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

  const filteredExecutives = executives.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <HODLayout title="My Team">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              My Team
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Sales executives assigned to you
            </p>
          </div>
          <SearchBar placeholder="Search team..." />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-md px-3 py-1.5">
            <span className="text-[11px] font-medium text-purple-700">
              Total Team
            </span>
            <span className="text-sm font-bold text-purple-800">
              {executives.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5">
            <span className="text-[11px] font-medium text-emerald-700">
              Active Now
            </span>
            <span className="text-sm font-bold text-emerald-800">
              {executives.filter((e) => e.is_in_market).length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-1.5">
            <span className="text-[11px] font-medium text-amber-700">Idle</span>
            <span className="text-sm font-bold text-amber-800">
              {executives.filter((e) => getStatus(e) === "idle").length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5">
            <span className="text-[11px] font-medium text-gray-600">
              Offline
            </span>
            <span className="text-sm font-bold text-gray-700">
              {executives.filter((e) => getStatus(e) === "offline").length}
            </span>
          </div>
        </div>

        {/* Executives Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredExecutives.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-slate-500 text-xs">
              {searchTerm
                ? "No executives match your search"
                : "No sales executives assigned to you yet."}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto bg-white shadow-sm w-full max-h-[30rem]">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-gray-200">
                    <tr className="border-y border-gray-100">
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 w-8 bg-gray-200">#</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 bg-gray-200">Name</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 bg-gray-200">Code</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 bg-gray-200">Mobile</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 bg-gray-200">Location</th>
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 border-r border-b border-gray-200 bg-gray-200">Target</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 bg-gray-200 border-b border-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExecutives.map((exec, idx) => {
                      const status = getStatus(exec);
                      return (
                        <tr
                          key={exec.id}
                          className="border-b border-gray-100 transition-colors"
                        >
                          <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-semibold text-gray-900 w-8">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-100">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                  status === "active"
                                    ? "bg-emerald-500"
                                    : status === "idle"
                                      ? "bg-amber-500"
                                      : "bg-slate-400"
                                }`}
                              >
                                {exec.name.charAt(0)}
                              </div>
                              <span className="text-[11px] font-semibold text-gray-800">
                                {exec.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-[11px] font-semibold text-gray-900 border-r border-gray-100">
                            {exec.employee_code}
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-100">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-900">
                              <Phone size={11} className="text-gray-400" />
                              <span>{exec.mobile}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-[11px] font-medium text-gray-900 border-r border-gray-100">
                            {exec.is_live_tracking ? (
                              <span className="flex items-center gap-1">
                                <Globe size={11} className="text-emerald-500" />{" "}
                                Any City
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} className="text-amber-500" />{" "}
                                {exec.assigned_city || "–"}
                                {exec.assigned_state
                                  ? `, ${exec.assigned_state}`
                                  : ""}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-[11px] font-medium text-gray-900 border-r border-gray-100">
                            {exec.daily_sales_target
                              ? `${exec.daily_sales_target}/day`
                              : "–"}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <Badge
                              className={
                                status === "active"
                                  ? "status-active"
                                  : status === "idle"
                                    ? "status-idle"
                                    : "status-offline"
                              }
                            >
                              {status}
                            </Badge>
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
    </HODLayout>
  );
};

export default HODExecutives;
