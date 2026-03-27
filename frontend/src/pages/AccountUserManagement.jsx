import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Trash, Phone, Pencil } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { getTruncatedText } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  employee_code: ""
};

const AccountUserManagement = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/account-users`, { headers: getAuthHeader() });
      setUsers(res.data);
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
        await axios.put(`${API}/account-users/${editingId}`, formData, { headers: getAuthHeader() });
        toast.success("Account User updated successfully");
      } else {
        await axios.post(`${API}/account-users`, formData, { headers: getAuthHeader() });
        toast.success("Account User added successfully");
      }
      closeDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: "",
      employee_code: user.employee_code || ""
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Account User?")) return;
    try {
      await axios.delete(`${API}/account-users/${id}`, { headers: getAuthHeader() });
      toast.success("Account User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete Account User");
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = (searchTerm || "").toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.employee_code?.toLowerCase().includes(search) ||
      user.mobile?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout title="Account User Management">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
              Account User Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage finance and account users</p>
          </div>
          <SearchBar placeholder="Search Account Users..." />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-primary-400 border border-primary-100 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-medium text-white">Total Users</span>
              <span className="text-sm font-bold text-white">{users.length}</span>
            </div>
            {searchTerm && (
              <span className="text-xs text-gray-400 ml-1">&middot; "{searchTerm}"</span>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 text-white shadow-sm text-xs h-8 rounded-xl">
                <Plus className="mr-1" size={14} /> Add Account User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Account User" : "Add Account User"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input value={formData.employee_code} onChange={e => setFormData({ ...formData, employee_code: e.target.value })} placeholder="ACC001" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="+91 98765 43210" required />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Email Address *</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  {!editingId && (
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" className="rounded-xl hover:bg-gray-100" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md transition-all">
                    {editingId ? "Update Account User" : "Add Account User"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filteredUsers.length === 0 ? (
          <Card><CardContent className="text-center py-12 text-slate-500">No Account Users Found.</CardContent></Card>
        ) : (
          <Card className="rounded-xl border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[30rem]">
                <Table className="w-full text-left">
                  <TableHeader className="sticky top-0 z-10 bg-gray-200">
                    <TableRow className="border-y border-gray-200">
                       <TableHead className="text-center px-2 py-2 bg-gray-200 w-8">#</TableHead>
                       <TableHead className="text-left px-2 py-2 bg-gray-200">Account User Name</TableHead>
                       <TableHead className="text-left px-2 py-2 bg-gray-200">Employee Code</TableHead>
                       <TableHead className="text-left px-2 py-2 bg-gray-200">Email</TableHead>
                       <TableHead className="text-left px-2 py-2 bg-gray-200">Mobile</TableHead>
                       <TableHead className="text-center px-2 py-2 bg-gray-200 border-r-0">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, idx) => {
                      const userName = getTruncatedText(user.name, 18);
                      const userEmail = getTruncatedText(user.email, 20);

                      return (
                        <TableRow key={user.id} className="border-b border-gray-100 transition-colors">
                          <TableCell className="px-2 py-1 text-center text-xs text-gray-800 w-8 border-r border-gray-100 font-normal">{idx + 1}</TableCell>
                          <TableCell className="px-2 py-1 border-r border-gray-100 font-normal">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-900" title={userName.full}>
                                {userName.display}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-xs text-gray-800 border-r border-gray-100 font-normal">
                            {user.employee_code}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-xs text-gray-700 border-r border-gray-100 font-normal" title={userEmail.full}>
                            {userEmail.display}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-xs text-gray-700 border-r border-gray-100 font-normal">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400" />
                              <span>{user.mobile}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center border-r-0 font-normal">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-[10px] h-6 px-2" onClick={() => handleEdit(user)}>
                                <Pencil size={12} className="mr-0.5"/> Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] h-6 px-2" onClick={() => handleDelete(user.id)}>
                                <Trash size={12} className="mr-0.5"/> Delete
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
      </div>
    </AdminLayout>
  );
};

export default AccountUserManagement;
