import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Package, Eye } from '@phosphor-icons/react';

const OrderItemsView = ({ visit }) => {
  const [open, setOpen] = useState(false);
  const items = visit?.ordered_items || [];
  const hasItems = Array.isArray(items) && items.length > 0;
  const isOrderBooked = visit?.outcome === 'Order Booked';

  if (!isOrderBooked) return null;

  const isDetailedFormat = hasItems && items[0]?.name;

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
        <DialogContent className="max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package size={18} />
              Ordered Items
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {hasItems ? (
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
              <p className="text-sm text-gray-500 py-4 text-center">No items recorded for this order.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderItemsView;
