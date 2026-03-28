import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { formatDateDDMmmYYYY } from "../utils/tableHelpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

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
             <Card><CardContent className="text-center py-8 sm:py-12">No approved orders ready for dispatch.</CardContent></Card>
          ) : (
             <Card className="rounded-xl border shadow-sm overflow-hidden">

               <CardContent className="p-0">
                 <div className="overflow-auto max-h-[30rem]">
                  <Table className="w-full text-left">
                    <TableHeader className="bg-gray-200 sticky top-0 z-10">
                      <TableRow className="border-y border-gray-200">
                        <TableHead className="px-3 py-2 text-left bg-gray-200">Order Date</TableHead>
                        <TableHead className="px-3 py-2 text-left bg-gray-200">Dealer</TableHead>
                        <TableHead className="px-3 py-2 text-left bg-gray-200">Order Items</TableHead>
                        <TableHead className="px-3 py-2 text-left bg-gray-200">Total Amount</TableHead>
                        <TableHead className="px-3 py-2 text-left bg-gray-200">Status</TableHead>
                        <TableHead className="px-3 py-2 text-left bg-gray-200 text-center">Invoice Number</TableHead>
                        <TableHead className="px-3 py-2 text-right bg-gray-200 border-r-0">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm divide-y divide-gray-100">
                       {orders.map(order => {
                         const items = order.ordered_items || order.order_items || [];
                         return (
                          <TableRow key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <TableCell className="px-3 py-1 text-xs text-gray-700">{formatDateDDMmmYYYY(order.check_in_time)}</TableCell>
                            <TableCell className="px-3 py-1 text-xs text-gray-900">{order.dealer_name}</TableCell>
                            <TableCell className="px-3 py-1 text-xs text-gray-700">
                              {items.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {items.map((it, idx) => (
                                    <li key={idx} className="truncate max-w-[200px]" title={`${it.name} (x${it.quantity})`}>
                                      {it.name} <span className="px-1 text-gray-800">x{it.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-gray-400 italic">No item details</span>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-1 text-xs font-normal text-emerald-700">
                               ₹{items.length > 0 
                                  ? items.reduce((sum, it) => sum + (it.quantity || 0) * (it.rate || it.unit_price || 0), 0).toLocaleString() 
                                  : (order.order_value || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="px-3 py-1">
                              <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                 {order.order_status}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-1 text-center">
                                {order.order_status === 'Dispatched' ? (
                                    <span className="text-xs text-gray-800">{order.invoice_number}</span>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <Input
                                            className="h-7 w-24 text-[11px]"
                                            placeholder="Invoice #"
                                            value={invoiceNumbers[order.id] || ''}
                                            onChange={(e) => setInvoiceNumbers({ ...invoiceNumbers, [order.id]: e.target.value })}
                                        />
                                        <Button
                                            size="sm"
                                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => handleDispatch(order.id)}
                                        >
                                            <PaperPlaneRight size={14} className="mr-1" />
                                            Dispatch
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="px-3 py-1 text-right border-r-0">
                               {order.order_status === 'Dispatched' && (
                                   <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-7 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                       onClick={() => handleDownloadPDF(order)}
                                   >
                                       <Download size={14} className="mr-1" />
                                       PDF
                                   </Button>
                               )}
                            </TableCell>
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

export default DispatchOrderPage;
