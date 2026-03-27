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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
          <Card className="rounded-xl border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto bg-white dark:bg-gray-900 shadow-sm w-full max-h-[30rem]">
                <Table className="w-full text-left">
                  <TableHeader className="sticky top-0 z-10 bg-gray-200">
                    <TableRow className="border-y border-gray-200">
                       <TableHead className="text-left px-2 py-2 text-xs text-gray-800 w-8 bg-gray-200">#</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Dealer Name</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Type</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Address</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Contact</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Phone</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Company</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Frequency</TableHead>
                       <TableHead className="text-left px-3 py-2 text-xs text-gray-800 bg-gray-200">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((dealer, idx) => (
                      <TableRow
                        key={dealer.id}
                        className="border-b border-gray-100 transition-colors"
                      >
                        <TableCell className="px-2 py-1 text-xs text-gray-900 w-8 text-center border-r border-gray-100">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="px-2 py-1 border-r border-gray-100">
                          <p className="text-xs text-gray-900 truncate max-w-[140px] font-normal">
                             {dealer.name}
                          </p>
                        </TableCell>
                        <TableCell className="px-2 py-1 border-r border-gray-100">
                          <Badge className="bg-primary-100 text-primary-800 border-primary-200 text-[10px] px-1.5 py-0 font-normal">
                            {dealer.dealer_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-1 max-w-[160px] border-r border-gray-100">
                          <p
                            className="text-xs text-gray-700 truncate font-normal"
                            title={dealer.address}
                          >
                            {dealer.address}
                          </p>
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs text-gray-800 border-r border-gray-100 font-normal">
                          {dealer.contact_person || "–"}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs text-gray-800 whitespace-nowrap border-r border-gray-100 font-normal">
                           {dealer.phone || "–"}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs text-purple-700 font-normal truncate max-w-[120px] border-r border-gray-100">
                           {dealer.company_name}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs text-gray-800 border-r border-gray-100 font-normal">
                          {dealer.visit_frequency}
                        </TableCell>
                        <TableCell className="px-2 py-1 border-r-0">
                          <div className="flex">
                            {getPriorityStars(dealer.priority_level)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerDealers;
