import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Flame } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceiptOrder: order, setActiveReceiptOrder, settings, language, t } = useApp();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn print:p-0 print:bg-white">
      <div className="fixed inset-0 print:hidden" onClick={() => setActiveReceiptOrder(null)} />

      <div
        className="relative bg-white text-black rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl z-10 p-6 flex flex-col font-mono-receipt text-xs print:shadow-none print:max-w-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls */}
        <div className="flex justify-between items-center mb-4 print:hidden border-b border-zinc-300 pb-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-[#E51E2A] text-white rounded-lg font-sans text-xs font-bold flex items-center gap-1.5 hover:bg-[#c41420] transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printReceiptBtn')}</span>
          </button>
          <button
            onClick={() => setActiveReceiptOrder(null)}
            className="p-1 rounded text-zinc-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3 mb-3">
          <div className="text-xl font-black tracking-widest uppercase">FRANK BURGER</div>
          <div className="text-[10px] text-zinc-600">
            {language === 'ar' ? settings.sloganAr : settings.sloganEn}
          </div>
          <div className="text-[11px] text-zinc-600 font-sans flex items-center justify-center gap-1.5 flex-wrap">
            <span dir="ltr" className="font-mono font-bold">{settings.phone || '01091266737'}</span>
            <span>|</span>
            <span>{language === 'ar' ? settings.addressAr : settings.addressEn}</span>
          </div>
        </div>

        {/* Order Details Header */}
        <div className="space-y-1 border-b border-dashed border-zinc-400 pb-3 mb-3 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>ORDER #{order.id}</span>
            <span>{order.orderType.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Date:</span>
            <span>{new Date(order.orderDate).toLocaleString()}</span>
          </div>
          {order.cashierName && (
            <div className="flex justify-between text-zinc-700 font-medium">
              <span>Cashier:</span>
              <span className="font-bold">{order.cashierName}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-600">
            <span>Customer:</span>
            <span>{order.customer?.name || (language === 'ar' ? 'عميل' : 'Customer')}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Phone:</span>
            <span dir="ltr" className="font-mono font-bold">{order.customer?.phone || ''}</span>
          </div>
          {order.customer?.addressStreet && (
            <div className="text-zinc-600 text-[10px] pt-1">
              <span>Address: </span>
              <span>
                {order.customer.addressStreet}
                {order.customer.addressBuilding ? ` - ${order.customer.addressBuilding}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Itemized list */}
        <div className="space-y-2 border-b border-dashed border-zinc-400 pb-3 mb-3">
          <div className="flex justify-between font-bold text-[11px] border-b border-zinc-300 pb-1">
            <span>ITEM</span>
            <span>QTY</span>
            <span>TOTAL</span>
          </div>
          {order.items.map((item, idx) => {
            const name = language === 'ar' ? (item.product?.nameAr || 'منتج') : (item.product?.nameEn || 'Item');
            const size = item.selectedSize ? (language === 'ar' ? item.selectedSize.nameAr : item.selectedSize.nameEn) : null;
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span className="truncate max-w-[170px]">{name}</span>
                  <span>x{item.quantity}</span>
                  <span>{item.totalPrice}</span>
                </div>
                {size && <div className="text-[10px] text-zinc-500">- {size}</div>}
                {item.selectedAddons.map((addon, aIdx) => (
                  <div key={aIdx} className="text-[10px] text-zinc-500">
                    + {language === 'ar' ? addon.nameAr : addon.nameEn}
                  </div>
                ))}
                {item.specialInstructions && (
                  <div className="text-[10px] text-zinc-600 italic">
                    Note: {item.specialInstructions}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-1 border-b border-dashed border-zinc-400 pb-3 mb-3 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{order.subtotal} EGP</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-zinc-700">
              <span>Discount ({order.couponCode || 'Promo'}):</span>
              <span>-{order.discount} EGP</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>{order.deliveryFee} EGP</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black pt-1 border-t border-zinc-300">
            <span>TOTAL:</span>
            <span>{order.total} EGP</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 pt-1">
            <span>Payment:</span>
            <span className="uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Footer & Barcode simulation */}
        <div className="text-center space-y-2 pt-2">
          <div className="text-[11px] font-bold">THANK YOU FOR CHOOSING FRANK!</div>
          <div className="text-[9px] text-zinc-500">
            {language === 'ar' ? 'نتمنى لكم وجبة شهية! تابعنا على السوشيال ميديا' : 'Enjoy your meal! Follow us @frankburger'}
          </div>
          {/* Simulated barcode */}
          <div className="font-mono tracking-widest text-base font-black py-1 select-none">
            ||| | | |||| | || ||||| | |||
          </div>
          <div className="text-[9px] text-zinc-400 font-sans">
            Generated by Frank Burger POS
          </div>
        </div>
      </div>
    </div>
  );
};
