import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Percent,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    appliedCoupon,
    couponDiscountAmount,
    cartTotal,
    applyCoupon,
    removeCoupon,
    settings,
    language,
    t,
    setCurrentView,
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const result = applyCoupon(promoInput);
    setPromoMessage({ text: result.message, isError: !result.success });
    if (result.success) {
      setPromoInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const freeDeliveryDiff = Math.max(0, settings.freeDeliveryThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, (cartSubtotal / settings.freeDeliveryThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l rtl:border-l-0 rtl:border-r border-zinc-200 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E51E2A]/10 text-[#E51E2A]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 font-heading">{t('cartTitle')}</h2>
                <p className="text-xs text-zinc-500">
                  {cart.length} {language === 'ar' ? 'أصناف مختلفة' : 'distinct items'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-zinc-500 hover:text-rose-600 transition-colors p-1"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Delivery Bar */}
          {cart.length > 0 && (
            <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-zinc-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {freeDeliveryDiff === 0 ? (
                    <span className="text-emerald-600 font-bold">
                      {language === 'ar' ? 'تهانينا! حصلت على توصيل مجاني 🎉' : 'Congrats! You unlocked FREE delivery 🎉'}
                    </span>
                  ) : (
                    <span>
                      {language === 'ar'
                        ? `أضف بـ ${freeDeliveryDiff} ج.م لتوصيل مجاني!`
                        : `Add ${freeDeliveryDiff} EGP for free delivery!`}
                    </span>
                  )}
                </span>
                <span className="text-zinc-500 font-mono">{Math.round(freeDeliveryProgress)}%</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-[#E51E2A] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List / Empty State */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">{t('emptyCartTitle')}</h3>
                  <p className="text-xs text-zinc-500 max-w-xs">{t('emptyCartDesc')}</p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCurrentView('menu');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold text-xs shadow-lg shadow-[#E51E2A]/20 transition-transform active:scale-95 cursor-pointer"
                >
                  {t('startShopping')}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const name = language === 'ar' ? (item.product?.nameAr || 'منتج') : (item.product?.nameEn || 'Item');
                const sizeName = item.selectedSize ? (language === 'ar' ? item.selectedSize.nameAr : item.selectedSize.nameEn) : null;

                return (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 bg-white border border-zinc-100 rounded-2xl flex gap-3 items-center group hover:border-zinc-300 transition-colors"
                  >
                    {/* Item Image */}
                    <img
                      src={item.product?.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'}
                      alt={name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-zinc-100"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-zinc-900 truncate font-heading">{name}</h4>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Selected Size Badge */}
                      {sizeName && (
                        <span className="inline-block text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md mt-0.5">
                          {sizeName}
                        </span>
                      )}

                      {/* Selected Addons */}
                      {item.selectedAddons.length > 0 && (
                        <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                          +{' '}
                          {item.selectedAddons
                            .map((a) => (language === 'ar' ? a.nameAr : a.nameEn))
                            .join(', ')}
                        </div>
                      )}

                      {/* Special instructions */}
                      {item.specialInstructions && (
                        <div className="text-[10px] text-amber-600/80 italic mt-0.5 truncate">
                          "{item.specialInstructions}"
                        </div>
                      )}

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100">
                        <span className="font-mono font-bold text-xs text-[#E51E2A]">
                          {item.totalPrice} {t('currency')}
                        </span>

                        <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                            className="p-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                            className="p-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Calculations and Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-zinc-200 space-y-4">
              {/* Promo Code Input */}
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Tag className="w-4 h-4" />
                    <div>
                      <span className="font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-[11px] block text-emerald-600/80">
                        {appliedCoupon.discountType === 'percentage'
                          ? `${appliedCoupon.discountValue}% OFF`
                          : `-${appliedCoupon.discountValue} ${t('currency')}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    {language === 'ar' ? 'إلغاء الكود' : 'Remove'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-zinc-400 absolute top-3 left-3 rtl:left-auto rtl:right-3" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={t('promoCodePlaceholder')}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-8 text-xs text-zinc-900 uppercase placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {t('applyPromo')}
                    </button>
                  </div>
                  {promoMessage && (
                    <div
                      className={`text-[11px] font-medium ${
                        promoMessage.isError ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {promoMessage.text}
                    </div>
                  )}
                </form>
              )}

              {/* Cost Breakdown */}
              <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-mono text-zinc-900 font-semibold">
                    {cartSubtotal} {t('currency')}
                  </span>
                </div>

                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>{t('discount')}</span>
                    <span className="font-mono">
                      -{couponDiscountAmount} {t('currency')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-zinc-100">
                  <span className="text-sm font-bold text-zinc-900">{t('total')}</span>
                  <span className="text-xl font-mono font-black text-zinc-900">
                    {cartTotal} <span className="text-xs text-[#E51E2A]">{t('currency')}</span>
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E51E2A]/20 transition-all transform active:scale-98 cursor-pointer"
              >
                <span>{t('proceedToCheckout')}</span>
                {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
