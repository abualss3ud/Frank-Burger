import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  Printer,
  Compass,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  ShoppingBag,
  X,
} from 'lucide-react';

export const OrderConfirmationModal: React.FC = () => {
  const {
    orderConfirmationOrder: order,
    setOrderConfirmationOrder,
    setActiveReceiptOrder,
    setCurrentView,
    setActiveTrackingOrderId,
    language,
    t,
  } = useApp();

  if (!order) return null;

  const handleTrackOrder = () => {
    setActiveTrackingOrderId(order.id);
    setOrderConfirmationOrder(null);
    setCurrentView('tracking');
  };

  const handlePrintReceipt = () => {
    setActiveReceiptOrder(order);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="fixed inset-0" onClick={() => setOrderConfirmationOrder(null)} />

      <div
        className="relative bg-white border border-zinc-200/80 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl z-10 flex flex-col text-center p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOrderConfirmationOrder(null)}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full text-zinc-500 hover:text-zinc-900 bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Big Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 border border-red-200 text-[#E51E2A] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-sm">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading">
          {t('orderSuccessTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          {t('orderSuccessSubtitle')}{' '}
          <span className="text-[#E51E2A] font-mono font-bold text-base px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
            #{order.id}
          </span>
        </p>

        {/* Estimated Time Card */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 my-5 flex items-center justify-between text-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-zinc-500 font-medium">{t('estimatedTimeLabel')}</div>
              <div className="text-sm font-bold text-zinc-900 font-mono">
                {order.estimatedDeliveryTime}
              </div>
            </div>
          </div>

          <div className="text-end">
            <div className="text-[11px] text-zinc-500 font-medium">{t('total')}</div>
            <div className="text-base font-black text-zinc-900 font-mono">
              {order.total} <span className="text-xs text-[#E51E2A] font-bold">{t('currency')}</span>
            </div>
          </div>
        </div>

        {/* Item mini list preview */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 mb-6 text-start text-xs space-y-2 max-h-36 overflow-y-auto">
          <div className="text-[11px] font-bold text-zinc-600 mb-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#E51E2A]" />
            <span>{language === 'ar' ? 'ملخص الأصناف المطلوبة:' : 'Ordered items summary:'}</span>
          </div>
          {order.items.map((item, i) => {
            const name = language === 'ar' ? (item.product?.nameAr || 'منتج') : (item.product?.nameEn || 'Item');
            return (
              <div key={i} className="flex justify-between text-zinc-700 font-medium">
                <span className="truncate">
                  {item.quantity}x {name}
                </span>
                <span className="font-mono text-zinc-500 font-semibold shrink-0">
                  {item.totalPrice} {t('currency')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleTrackOrder}
            className="w-full py-3.5 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E51E2A]/20 transition-all transform active:scale-98 cursor-pointer"
          >
            <Compass className="w-5 h-5" />
            <span>{t('trackOrderBtn')}</span>
            {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePrintReceipt}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-300 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-600" />
              <span>{t('printReceiptBtn')}</span>
            </button>

            <button
              onClick={() => setOrderConfirmationOrder(null)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-300 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{t('backToHome')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
