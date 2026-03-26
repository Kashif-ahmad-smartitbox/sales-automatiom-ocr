import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { formatDateDDMmmYYYY } from "../utils/tableHelpers";

import { Download, PaperPlaneRight } from "@phosphor-icons/react";
import { downloadOrderPDF } from "../utils/CustomerOrderPDF";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DispatchOrderPage = () => {
  const { getAuthHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNumbers, setInvoiceNumbers] = useState({});
  const [company, setCompany] = useState({});
  const [dealersMap, setDealersMap] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, companyRes, dealersRes] = await Promise.all([
        axios.get(`${API}/orders`, { headers: getAuthHeader() }),
        axios.get(`${API}/company/config`, { headers: getAuthHeader() }),
        axios.get(`${API}/dealers`, { headers: getAuthHeader() })
      ]);
      
      // Only show Approved or Dispatched orders for Account user
      const filtered = ordersRes.data.filter(o => o.order_status === 'Approved' || o.order_status === 'Dispatched');
      setOrders(filtered);
      setCompany(companyRes.data);
      
      // Create a lookup map for dealers
      const dMap = {};
      if (Array.isArray(dealersRes.data)) {
          dealersRes.data.forEach(d => {
              dMap[d.id] = d;
          });
      }
      setDealersMap(dMap);
    } catch (error) {
      toast.error("Failed to fetch order/company details");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGeneratePDF = (order, invNumber) => {
    // Enrich order with dealer details if available
    const dealer = dealersMap[order.dealer_id] || {};
    const enrichedOrder = { 
        ...order, 
        invoice_number: invNumber,
        dealer_address: dealer.address || "N/A",
        dealer_city: dealer.city || "N/A",
        dealer_gstin: dealer.gstin || "NA" 
    };
    downloadOrderPDF(enrichedOrder, company);
  };


  const handleDispatch = async (order) => {
    const inv = invoiceNumbers[order.id];
    if (!inv) return toast.error("Please enter an invoice number to dispatch");

    if (!window.confirm(`Generate Invoice ${inv} and mark as dispatched?`)) return;

    try {
      handleGeneratePDF(order, inv);
      await axios.put(`${API}/orders/${order.id}/dispatch`, { invoice_number: inv }, { headers: getAuthHeader() });
      toast.success("Order dispatched and invoice generated");
      fetchData();
    } catch(err) {
      toast.error("Failed to dispatch order");
    }
  };


  return (
    <AdminLayout title="Dispatch Orders">
      <div className="space-y-2">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            Dispatch Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate invoices and dispatch approved logic</p>
        </div>

        {loading ? (
             <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : orders.length === 0 ? (
             <Card><CardContent className="text-center py-12">No approved orders ready for dispatch.</CardContent></Card>
          ) : (
             <Card className="border-0 shadow-sm">
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-gray-200">
                       <tr className="border-y border-gray-200">
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Order Date</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Dealer</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Order Items</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Total Amount</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Status</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200">Invoice Number</th>
                         <th className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm divide-y divide-gray-100">
                       {orders.map(order => {
                         const items = order.ordered_items || order.order_items || [];
                         return (
                         <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs">{formatDateDDMmmYYYY(order.check_in_time)}</td>
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
                               <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                  {order.order_status}
                               </span>
                            </td>
                            <td className="px-4 py-2">
                               {order.order_status === 'Dispatched' ? (
                                   <span className="text-xs">{order.invoice_number}</span>
                               ) : (
                                   <Input 
                                      className="h-8 max-w-[150px] text-xs" 
                                      placeholder="e.g. INV-2023-01"
                                      value={invoiceNumbers[order.id] || ''}
                                      onChange={(e) => setInvoiceNumbers({ ...invoiceNumbers, [order.id]: e.target.value })}
                                   />
                               )}
                            </td>
                            <td className="px-4 py-2 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 {order.order_status === 'Dispatched' ? (
                                   <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleGeneratePDF(order, order.invoice_number)} 
                                      className="h-6 text-xs font-semibold"
                                   >
                                      <Download className="mr-1" size={14} /> Download
                                   </Button>
                                 ) : (
                                   <Button 
                                      size="sm" 
                                      disabled={order.order_status === 'Dispatched'} 
                                      onClick={() => handleDispatch(order)} 
                                      className="h-6 text-xs bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                                   >
                                      <PaperPlaneRight className="mr-1" size={14} /> Dispatch & Invoice
                                   </Button>
                                 )}
                               </div>
                            </td>
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

export default DispatchOrderPage;
