import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
              <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm max-h-[400px]">
                <Table className="table-auto border-collapse">
                  <TableHeader>
                    <TableRow className="border-y border-gray-200 bg-gray-200 hover:bg-gray-200">
                      <TableHead className="px-2 py-2 text-center w-8 bg-gray-200">#</TableHead>
                      <TableHead className="px-2 py-2 text-left bg-gray-200">Item</TableHead>
                      <TableHead className="px-2 py-2 text-center bg-gray-200">Qty</TableHead>
                      <TableHead className="px-2 py-2 text-right bg-gray-200">Rate (₹)</TableHead>
                      <TableHead className="px-2 py-2 text-right bg-gray-200 border-r-0">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((item, idx) => (
                      <TableRow key={idx} className="group transition-all duration-200">
                        <TableCell className="px-2 py-1 text-center font-normal">
                          <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs text-gray-900 dark:text-gray-200">{item.name}</TableCell>
                        <TableCell className="px-2 py-1 text-center text-xs text-gray-700 dark:text-gray-300">{item.quantity}</TableCell>
                        <TableCell className="px-2 py-1 text-right text-xs text-gray-700 dark:text-gray-300">₹{item.rate.toFixed(2)}</TableCell>
                        <TableCell className="px-2 py-1 text-right text-xs text-primary-700 dark:text-primary-400 border-r-0">
                          ₹{(item.quantity * item.rate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-gray-200 dark:border-gray-700 font-normal">
                      <TableCell colSpan={4} className="px-2 py-1 text-right text-xs text-gray-700 dark:text-gray-300">Total:</TableCell>
                      <TableCell className="px-2 py-1 text-right text-xs text-primary-700 dark:text-primary-400 font-bold border-r-0">
                        ₹{items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
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
