import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { formatDateDDMmmYYYY } from "../utils/tableHelpers";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Download, PaperPlaneRight } from "@phosphor-icons/react";

if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DispatchOrderPage = () => {
  const { getAuthHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNumbers, setInvoiceNumbers] = useState({});

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/orders`, { headers: getAuthHeader() });
      // Only show Approved or Dispatched orders for Account user
      const filtered = res.data.filter(o => o.order_status === 'Approved' || o.order_status === 'Dispatched');
      setOrders(filtered);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const generateInvoicePDF = (order, invNumber) => {
    const itemsBody = [
      [{ text: 'Item Name', style: 'tableHeader' }, { text: 'Quantity', style: 'tableHeader' }, { text: 'Rate (₹)', style: 'tableHeader' }, { text: 'Amount (₹)', style: 'tableHeader' }]
    ];

    let totalAmount = 0;
    const itemsList = order.ordered_items || order.order_items || [];
    
    if (itemsList.length > 0) {
      itemsList.forEach(item => {
        const qty = item.quantity || 0;
        const rate = item.rate || item.unit_price || 0;
        const amount = qty * rate;
        totalAmount += amount;
        itemsBody.push([
          item.name || 'Unknown Item',
          qty.toString(),
          rate.toLocaleString(),
          amount.toLocaleString()
        ]);
      });
    } else {
        totalAmount = order.order_value || 0;
        itemsBody.push([
          'Miscellaneous Order Value',
          '1',
          totalAmount.toLocaleString(),
          totalAmount.toLocaleString()
        ]);
    }

    const docDefinition = {
      content: [
        { text: 'TAX INVOICE', style: 'header', alignment: 'center' },
        { text: '\n' },
        {
          columns: [
            {
              text: [
                { text: 'From:\n', style: 'subheader' },
                'SMART ITBox\n',
                'Your Company Address\n',
                'City, State\n'
              ]
            },
            {
              text: [
                { text: 'To:\n', style: 'subheader' },
                `${order.dealer_name}\n`,
                `Date: ${formatDateDDMmmYYYY(new Date().toISOString())}\n`,
                `Invoice #: ${invNumber}\n`
              ],
              alignment: 'right'
            }
          ]
        },
        { text: '\n\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: itemsBody
          },
          layout: 'lightHorizontalLines'
        },
        { text: '\n' },
        {
          text: `Total Amount: ₹${totalAmount.toLocaleString()}`,
          style: 'total',
          alignment: 'right'
        }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black'
        },
        total: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 0]
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Invoice-${invNumber}.pdf`);
  };

  const handleDispatch = async (order) => {
    const inv = invoiceNumbers[order.id];
    if (!inv) return toast.error("Please enter an invoice number to dispatch");

    if (!window.confirm(`Generate Invoice ${inv} and mark as dispatched?`)) return;

    try {
      generateInvoicePDF(order, inv);
      await axios.put(`${API}/orders/${order.id}/dispatch`, { invoice_number: inv }, { headers: getAuthHeader() });
      toast.success("Order dispatched and invoice generated");
      fetchOrders();
    } catch(err) {
      toast.error("Failed to dispatch order");
    }
  };


  return (
    <AdminLayout title="Dispatch Orders">
      <div className="space-y-4">
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
                     <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                       <tr>
                         <th className="px-4 py-3 border-b">Order Date</th>
                         <th className="px-4 py-3 border-b">Dealer</th>
                         <th className="px-4 py-3 border-b">Order Items</th>
                         <th className="px-4 py-3 border-b">Total Amount</th>
                         <th className="px-4 py-3 border-b">Status</th>
                         <th className="px-4 py-3 border-b">Invoice Number</th>
                         <th className="px-4 py-3 border-b text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm divide-y divide-gray-100">
                       {orders.map(order => {
                         const items = order.ordered_items || order.order_items || [];
                         return (
                         <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs">{formatDateDDMmmYYYY(order.check_in_time)}</td>
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
                               <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                  {order.order_status}
                               </span>
                            </td>
                            <td className="px-4 py-3">
                               {order.order_status === 'Dispatched' ? (
                                   <span className="font-mono text-xs">{order.invoice_number}</span>
                               ) : (
                                   <Input 
                                      className="h-8 max-w-[150px] text-xs" 
                                      placeholder="e.g. INV-2023-01"
                                      value={invoiceNumbers[order.id] || ''}
                                      onChange={(e) => setInvoiceNumbers({ ...invoiceNumbers, [order.id]: e.target.value })}
                                   />
                               )}
                            </td>
                            <td className="px-4 py-3 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 {order.order_status === 'Dispatched' ? (
                                   <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => generateInvoicePDF(order, order.invoice_number)} 
                                      className="h-8 text-xs font-semibold"
                                   >
                                      <Download className="mr-1" size={14} /> Download
                                   </Button>
                                 ) : (
                                   <Button 
                                      size="sm" 
                                      disabled={order.order_status === 'Dispatched'} 
                                      onClick={() => handleDispatch(order)} 
                                      className="h-8 text-xs bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
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
