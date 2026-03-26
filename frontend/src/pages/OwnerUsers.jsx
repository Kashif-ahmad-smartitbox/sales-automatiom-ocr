import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import OwnerLayout from "../components/layout/OwnerLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Users,
  Phone,
  Envelope,
  Funnel,
  Crown,
  UserCircle,
  UserSquare,
  MapPin,
  Globe,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import SearchBar from "../components/SearchBar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerUsers = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        axios.get(`${API}/owner/users`, { headers: getAuthHeader() }),
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() }),
      ]);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesCompany =
      companyFilter === "all" || user.company_id === companyFilter;
    return matchesSearch && matchesRole && matchesCompany;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case "organization":
        return <Crown className="w-4 h-4" weight="fill" />;
      case "admin":
        return <UserCircle className="w-4 h-4" weight="fill" />;
      case "sales_executive":
        return <UserSquare className="w-4 h-4" weight="fill" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "organization":
        return "from-amber-500 to-orange-600";
      case "admin":
        return "from-purple-500 to-indigo-600";
      case "sales_executive":
        return "from-emerald-500 to-teal-600";
      case "owner":
        return "from-red-500 to-rose-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "organization":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "sales_executive":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "owner":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="All Users">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Users">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              All Users
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Users across all organizations
            </p>
          </div>
          <SearchBar placeholder="Search users..." />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
            <div className="flex-1">
              {searchTerm && (
                <p className="text-xs text-slate-500">
                  Showing results for:{" "}
                  <span className="font-semibold text-slate-700">
                    "{searchTerm}"
                  </span>
                </p>
              )}
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem
                  value="all"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  All Roles
                </SelectItem>
                <SelectItem
                  value="organization"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  Super Admin
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="sales_executive"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  Sales Executive
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 max-h-64">
                <SelectItem
                  value="all"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  All Companies
                </SelectItem>
                {organizations.map((org) => (
                  <SelectItem
                    key={org.id}
                    value={org.id}
                    className="text-slate-900 focus:bg-slate-50"
                  >
                    {org.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredUsers.length} users
          </Badge>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto bg-white shadow-sm w-full max-h-[30rem]">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-y border-gray-100">
                      <th className="text-left px-2 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 w-8 bg-gray-200">
                        #
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-200">
                        Name
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-200">
                        Role
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-200">
                        Email
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-200">
                        Mobile
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-200">
                        Company
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200">
                        Location / Code
                      </th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-gray-600">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 transition-colors"
                      >
                        <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-medium text-gray-600 w-8">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <span className="text-[11px] font-medium text-gray-800 truncate">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <Badge
                            variant="outline"
                            className={`${getRoleBadgeClass(user.role)} text-[10px] px-1.5 py-0`}
                          >
                            <span className="capitalize">
                              {user.role.replace("_", " ")}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-gray-600 border-r border-gray-100 max-w-[160px] truncate">
                          {user.email}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-gray-600 border-r border-gray-100 whitespace-nowrap">
                          {user.mobile}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-purple-600 font-medium border-r border-gray-100 truncate">
                          {user.company_name || "–"}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-gray-600 border-r border-gray-100">
                          {user.role === "sales_executive" ? (
                            user.is_live_tracking ? (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-emerald-500" />{" "}
                                Live
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />{" "}
                                {user.assigned_city || "–"}
                              </span>
                            )
                          ) : user.employee_code ? (
                            <span className="text-gray-400">
                              {user.employee_code}
                            </span>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {user.is_in_market ? (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                              title="Active in Market"
                            ></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerUsers;
