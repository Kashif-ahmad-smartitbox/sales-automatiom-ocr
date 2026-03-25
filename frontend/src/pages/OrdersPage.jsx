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
      <div className="space-y-4">
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
                   <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                     <tr>
                       <th className="px-4 py-3 border-b">Date</th>
                       <th className="px-4 py-3 border-b">Sales Executive</th>
                       <th className="px-4 py-3 border-b">Dealer</th>
                       <th className="px-4 py-3 border-b">Order Items</th>
                       <th className="px-4 py-3 border-b">Total Value</th>
                       <th className="px-4 py-3 border-b">Status</th>
                       {['hod', 'admin', 'organization'].includes(user?.role) && (
                         <th className="px-4 py-3 border-b text-right">Action</th>
                       )}
                     </tr>
                   </thead>
                   <tbody className="text-sm divide-y divide-gray-100">
                     {orders.map(order => {
                       const items = order.ordered_items || order.order_items || [];
                       return (
                       <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs">{formatDateDDMmmYYYY(order.check_in_time)}</td>
                          <td className="px-4 py-3">{order.exec_name}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{order.dealer_name}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
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
                          <td className="px-4 py-3 font-semibold text-emerald-600">
                             ₹{items.length > 0 
                                ? items.reduce((sum, it) => sum + (it.quantity || 0) * (it.rate || it.unit_price || 0), 0).toLocaleString() 
                                : (order.order_value || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                             <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.order_status === 'Approved' ? 'bg-green-100 text-green-700' : order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {order.order_status || 'Pending'}
                             </span>
                          </td>
                          {['hod', 'admin', 'organization'].includes(user?.role) && (
                            <td className="px-4 py-3 text-right">
                               <Button size="sm" disabled={order.order_status === 'Approved' || order.order_status === 'Dispatched'} onClick={() => handleApprove(order.id)} className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
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
