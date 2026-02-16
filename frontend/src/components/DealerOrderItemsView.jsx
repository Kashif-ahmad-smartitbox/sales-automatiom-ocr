import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Package, Eye } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * View button for dealer page - fetches latest visit when clicked and shows ordered items
 */
const DealerOrderItemsView = ({ dealer }) => {
  const { getAuthHeader } = useAuth();
  const [open, setOpen] = useState(false);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(false);

  const isOrderBooked = dealer?.last_outcome === 'Order Booked';

  const handleView = async () => {
    if (!dealer?.id || !isOrderBooked) return;
    setOpen(true);
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
  };

  if (!isOrderBooked) return null;

  const items = visit?.ordered_items || [];
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
        onClick={handleView}
        title="View ordered items from last visit"
      >
        <Eye className="w-3 h-3 mr-1" />
        View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm z-[9999]">
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
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-gray-50">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-800">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">
                {visit ? 'No items recorded for this order.' : 'No visit data found.'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealerOrderItemsView;
