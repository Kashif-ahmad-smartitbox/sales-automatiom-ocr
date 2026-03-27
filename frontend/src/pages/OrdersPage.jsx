import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { formatDateDDMmmYYYY } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrdersPage = () => {
  const { getAuthHeader, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/orders`, { headers: getAuthHeader() });
      setOrders(res.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this order?")) return;
    try {
      await axios.put(`${API}/orders/${id}/approve`, {}, { headers: getAuthHeader() });
      toast.success("Order approved");
      fetchOrders();
    } catch(err) {
      toast.error("Failed to approve order");
    }
  };

  const calculateTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, it) => sum + (it.quantity || 0) * (it.rate || it.unit_price || 0), 0);
  };

  return (
    <AdminLayout title="Booked Orders">
      <div className="space-y-2">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Booked Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and approve orders from the field</p>
        </div>

        {loading ? (
           <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
           <Card><CardContent className="text-center py-12">No orders found.</CardContent></Card>
        ) : (
           <Card className="rounded-xl border shadow-sm overflow-hidden">
             <CardContent className="p-0">
               <div className="overflow-auto max-h-[30rem]">
                 <Table className="w-full text-left">
                    <TableHeader className="sticky top-0 z-10 bg-gray-200">
                      <TableRow className="border-y border-gray-200">
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Date</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Sales Executive</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Dealer</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Order Items</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Total Value</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-gray-800 bg-gray-200">Status</TableHead>
                        {['hod', 'admin', 'organization'].includes(user?.role) && (
                          <TableHead className="px-3 py-2 text-xs text-gray-800 text-right bg-gray-200 border-r-0">Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                   <TableBody>
                     {orders.map(order => {
                       const items = order.ordered_items || order.order_items || [];
                       return (
                        <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                           <TableCell className="px-3 py-1 text-xs text-gray-800 border-r border-gray-100 font-normal">{formatDateDDMmmYYYY(order.check_in_time)}</TableCell>
                           <TableCell className="px-3 py-1 text-xs text-gray-900 border-r border-gray-100 font-normal">{order.exec_name}</TableCell>
                           <TableCell className="px-3 py-1 text-xs text-gray-900 font-normal border-r border-gray-100">{order.dealer_name}</TableCell>
                           <TableCell className="px-3 py-1 text-xs text-gray-800 border-r border-gray-100 font-normal">
                              {items.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {items.map((it, idx) => (
                                    <li key={idx} className="truncate max-w-[200px]" title={`${it.name} (x${it.quantity})`}>
                                      {it.name} <span className="px-1 text-gray-900">x{it.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-gray-500 italic">No item details</span>
                              )}
                           </TableCell>
                           <TableCell className="px-3 py-1 text-xs text-emerald-800 font-normal border-r border-gray-100">
                              ₹{items.length > 0 
                                 ? items.reduce((sum, it) => sum + (it.quantity || 0) * (it.rate || it.unit_price || 0), 0).toLocaleString() 
                                 : (order.order_value || 0).toLocaleString()}
                           </TableCell>
                           <TableCell className="px-3 py-1 text-xs border-r border-gray-100">
                              <span className={`px-2 py-1 text-[10px] rounded-full ${order.order_status === 'Approved' ? 'bg-green-100 text-green-800' : order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                 {order.order_status || 'Pending'}
                              </span>
                           </TableCell>
                           {['hod', 'admin', 'organization'].includes(user?.role) && (
                             <TableCell className="px-3 py-1 text-right border-r-0 font-normal">
                                <Button size="sm" disabled={order.order_status === 'Approved' || order.order_status === 'Dispatched'} onClick={() => handleApprove(order.id)} className="h-6 text-[10px] py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                   Approve
                                </Button>
                             </TableCell>
                           )}
                        </TableRow>
                     )})}
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

export default OrdersPage;
