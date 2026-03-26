import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
           <Card className="border-0 shadow-sm">
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-200">
                     <tr className="border-y border-gray-200">
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Date</th>
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Sales Executive</th>
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Dealer</th>
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Order Items</th>
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Total Value</th>
                       <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Status</th>
                       {['hod', 'admin', 'organization'].includes(user?.role) && (
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Action</th>
                       )}
                     </tr>
                   </thead>
                   <tbody className="text-sm divide-y divide-gray-100">
                     {orders.map(order => {
                       const items = order.ordered_items || order.order_items || [];
                       return (
                       <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">{formatDateDDMmmYYYY(order.check_in_time)}</td>
                          <td className="px-4 py-2">{order.exec_name}</td>
                          <td className="px-4 py-2 font-medium text-slate-800">{order.dealer_name}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                             {items.length > 0 ? (
                               <ul className="list-disc list-inside">
                                 {items.map((it, idx) => (
                                   <li key={idx} className="truncate max-w-[200px]" title={`${it.name} (x${it.quantity})`}>
                                     {it.name} <span className="font-semibold px-1 text-gray-800">x{it.quantity}</span>
                                   </li>
                                 ))}
                               </ul>
                             ) : (
                               <span className="text-gray-400 italic">No item details</span>
                             )}
                          </td>
                          <td className="px-4 py-2 font-semibold text-emerald-600">
                             ₹{items.length > 0 
                                ? items.reduce((sum, it) => sum + (it.quantity || 0) * (it.rate || it.unit_price || 0), 0).toLocaleString() 
                                : (order.order_value || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                             <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.order_status === 'Approved' ? 'bg-green-100 text-green-700' : order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {order.order_status || 'Pending'}
                             </span>
                          </td>
                          {['hod', 'admin', 'organization'].includes(user?.role) && (
                            <td className="px-4 py-2 text-right">
                               <Button size="sm" disabled={order.order_status === 'Approved' || order.order_status === 'Dispatched'} onClick={() => handleApprove(order.id)} className="h-6 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                                  Approve
                               </Button>
                            </td>
                          )}
                       </tr>
                     )})}
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

export default OrdersPage;
