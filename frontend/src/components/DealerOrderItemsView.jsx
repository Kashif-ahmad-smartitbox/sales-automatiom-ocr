import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Package, Eye } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * View button for dealer page - fetches latest visit when clicked and shows ordered items
 * Can be controlled externally via externalOpen and onExternalClose props
 */
const DealerOrderItemsView = ({ dealer, externalOpen = false, onExternalClose = null }) => {
  const { getAuthHeader } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(false);

  const isOrderBooked = dealer?.last_outcome === 'Order Booked';
  const open = externalOpen || internalOpen;
  
  const setOpen = (value) => {
    if (onExternalClose && !value) {
      onExternalClose();
    } else {
      setInternalOpen(value);
    }
  };

  const handleView = useCallback(async () => {
    if (!dealer?.id || !isOrderBooked) return;
    setVisit(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/visits/history`, {
        params: { dealer_id: dealer.id },
        headers: getAuthHeader()
      });
      const orderBookedVisits = (res.data || []).filter(v => v.outcome === 'Order Booked');
      const latest = orderBookedVisits[0] || null;
      setVisit(latest);
    } catch (err) {
      console.error('Failed to fetch visit', err);
      setVisit(null);
    } finally {
      setLoading(false);
    }
  }, [dealer?.id, isOrderBooked, getAuthHeader]);

  // Fetch data when externally opened
  useEffect(() => {
    if (externalOpen && isOrderBooked) {
      handleView();
    }
  }, [externalOpen, handleView, isOrderBooked]);

  const items = visit?.ordered_items || [];
  const hasItems = Array.isArray(items) && items.length > 0;
  const isDetailedFormat = hasItems && items[0]?.name;

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Package size={18} />
          Ordered Items
          {dealer?.name && (
            <span className="text-xs font-normal text-gray-500 truncate max-w-[180px]">
              — {dealer.name}
            </span>
          )}
        </DialogTitle>
      </DialogHeader>
      <div className="py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : hasItems ? (
          isDetailedFormat ? (
            <div className="space-y-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50">
                    <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">#</th>
                    <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Item</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Qty</th>
                    <th className="text-right py-1.5 px-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Rate (₹)</th>
                    <th className="text-right py-1.5 px-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-1.5 px-2 border-r border-gray-100">
                        <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-medium">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-[11px] text-gray-800 font-medium border-r border-gray-100">{item.name}</td>
                      <td className="py-1.5 px-2 text-center text-[11px] text-gray-700 border-r border-gray-100">{item.quantity}</td>
                      <td className="py-1.5 px-2 text-right text-[11px] text-gray-700 border-r border-gray-100">₹{item.rate.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-[11px] text-primary-600 font-semibold">
                        ₹{(item.quantity * item.rate).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold border-t border-gray-200">
                    <td colSpan="4" className="py-1.5 px-2 text-right text-[11px] text-gray-700">Total:</td>
                    <td className="py-1.5 px-2 text-right text-[11px] text-primary-600">
                      ₹{items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-gray-50">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-800">{typeof item === 'string' ? item : item?.name || 'Item'}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">
            {visit ? 'No items recorded for this order.' : 'No visit data found.'}
          </p>
        )}
      </div>
    </>
  );

  // When controlled externally, just return the dialog without button
  if (onExternalClose) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md z-[9999]">{dialogContent}</DialogContent>
      </Dialog>
    );
  }

  // If not an order booked case, don't show anything
  if (!isOrderBooked) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
        onClick={() => {
          setInternalOpen(true);
          handleView();
        }}
        title="View ordered items from last visit"
      >
        <Eye className="w-3 h-3 mr-1" />
        View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md z-[9999]">{dialogContent}</DialogContent>
      </Dialog>
    </>
  );
};

export default DealerOrderItemsView;
