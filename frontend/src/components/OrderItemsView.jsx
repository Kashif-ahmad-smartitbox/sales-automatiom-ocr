import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Package, Eye } from '@phosphor-icons/react';

/**
 * View button + modal to show ordered items for a visit with outcome "Order Booked"
 */
const OrderItemsView = ({ visit }) => {
  const [open, setOpen] = useState(false);
  const items = visit?.ordered_items || [];
  const hasItems = Array.isArray(items) && items.length > 0;
  const isOrderBooked = visit?.outcome === 'Order Booked';

  if (!isOrderBooked) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
        onClick={() => setOpen(true)}
        disabled={!hasItems}
        title={hasItems ? 'View ordered items' : 'No items recorded'}
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
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {hasItems ? (
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
              <p className="text-sm text-gray-500 py-4 text-center">No items recorded for this order.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderItemsView;
