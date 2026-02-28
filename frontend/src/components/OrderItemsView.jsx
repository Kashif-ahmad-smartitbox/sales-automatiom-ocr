import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
                  <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm max-h-[400px]">
                    <Table className="table-auto border-collapse">
                      <TableHeader className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 sticky top-0 z-10 border-b border-primary-100 dark:border-gray-700">
                        <TableHead className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-medium text-[10px]">#</TableHead>
                        <TableHead className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-medium text-[10px]">Item</TableHead>
                        <TableHead className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-medium text-[10px] text-center">Qty</TableHead>
                        <TableHead className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-medium text-[10px] text-right">Rate (₹)</TableHead>
                        <TableHead className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-medium text-[10px] text-right">Total (₹)</TableHead>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((item, idx) => (
                          <TableRow key={idx} className="group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <TableCell className="py-1.5 px-2">
                              <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-[10px] font-medium">
                                {idx + 1}
                              </span>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-[11px] text-gray-800 dark:text-gray-200 font-medium">{item.name}</TableCell>
                            <TableCell className="py-1.5 px-2 text-center text-[11px] text-gray-700 dark:text-gray-300">{item.quantity}</TableCell>
                            <TableCell className="py-1.5 px-2 text-right text-[11px] text-gray-700 dark:text-gray-300">₹{item.rate.toFixed(2)}</TableCell>
                            <TableCell className="py-1.5 px-2 text-right text-[11px] text-primary-600 dark:text-primary-400 font-semibold">
                              ₹{(item.quantity * item.rate).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                          <TableCell colSpan={4} className="py-1.5 px-2 text-right text-[11px] text-gray-700 dark:text-gray-300">Total:</TableCell>
                          <TableCell className="py-1.5 px-2 text-right text-[11px] text-primary-600 dark:text-primary-400 font-bold">
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
              <p className="text-sm text-gray-500 py-4 text-center">No items recorded for this order.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderItemsView;
