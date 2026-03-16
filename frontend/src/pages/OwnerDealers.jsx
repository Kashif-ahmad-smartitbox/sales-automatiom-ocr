import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import OwnerLayout from "../components/layout/OwnerLayout";
import { Card, CardContent } from "../components/ui/card";
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
  Storefront,
  Phone,
  MapPin,
  Funnel,
  Buildings,
  Calendar,
  Star,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import SearchBar from "../components/SearchBar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OwnerDealers = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [dealers, setDealers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      const [orgsRes] = await Promise.all([
        axios.get(`${API}/owner/organizations`, { headers: getAuthHeader() }),
      ]);
      setOrganizations(orgsRes.data);

      // Fetch dealers from all organizations
      const allDealers = [];
      for (const org of orgsRes.data) {
        try {
          const orgDetails = await axios.get(
            `${API}/owner/organizations/${org.id}`,
            { headers: getAuthHeader() },
          );
          if (orgDetails.data.dealers) {
            orgDetails.data.dealers.forEach((dealer) => {
              allDealers.push({ ...dealer, company_name: org.company_name });
            });
          }
        } catch (e) {
          console.error(`Failed to fetch dealers for org ${org.id}:`, e);
        }
      }
      setDealers(allDealers);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDealers = dealers.filter((dealer) => {
    const matchesSearch =
      dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany =
      companyFilter === "all" || dealer.company_id === companyFilter;
    const matchesType =
      typeFilter === "all" || dealer.dealer_type === typeFilter;
    return matchesSearch && matchesCompany && matchesType;
  });

  const dealerTypes = [...new Set(dealers.map((d) => d.dealer_type))];

  const getPriorityStars = (priority) => {
    return Array(priority || 1)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="w-3 h-3 text-amber-500" weight="fill" />
      ));
  };

  if (loading) {
    return (
      <OwnerLayout title="All Dealers">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="All Dealers">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              All Dealers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
            Dealers across all organizations
            </p>
          </div>
          <SearchBar placeholder="Search all dealers..." />
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40 bg-white border-slate-200 text-slate-900">
                <Funnel className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Dealer Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem
                  value="all"
                  className="text-slate-900 focus:bg-slate-50"
                >
                  All Types
                </SelectItem>
                {dealerTypes.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className="text-slate-900 focus:bg-slate-50"
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className="bg-primary-100 text-primary-700 text-[10px] px-1.5 py-0 whitespace-nowrap">
            {filteredDealers.length} dealers
          </Badge>
        </div>

        {/* Dealers Table */}
        {filteredDealers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Storefront className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No dealers found</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-y border-gray-200">
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200 w-8">
                        #
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Dealer Name
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Type
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Address
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Contact
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Phone
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Company
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600 border-r border-gray-200">
                        Frequency
                      </th>
                      <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-600">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDealers.map((dealer, idx) => (
                      <tr
                        key={dealer.id}
                        className="border-b border-gray-100 transition-colors"
                      >
                        <td className="px-2 py-1.5 border-r border-gray-100 text-xs font-medium text-gray-600 w-8">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <p className="text-[11px] font-medium text-gray-800 truncate max-w-[140px]">
                            {dealer.name}
                          </p>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <Badge className="bg-primary-100 text-primary-700 border-primary-200 text-[10px] px-1.5 py-0">
                            {dealer.dealer_type}
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 max-w-[160px]">
                          <p
                            className="text-[11px] text-gray-500 truncate"
                            title={dealer.address}
                          >
                            {dealer.address}
                          </p>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600">
                          {dealer.contact_person || "–"}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] font-mono text-gray-600 whitespace-nowrap">
                          {dealer.phone || "–"}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-purple-600 font-medium truncate max-w-[120px]">
                          {dealer.company_name}
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[11px] text-gray-600">
                          {dealer.visit_frequency}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex">
                            {getPriorityStars(dealer.priority_level)}
                          </div>
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

export default OwnerDealers;
