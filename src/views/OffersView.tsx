import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Copy, ShoppingBag } from 'lucide-react';

export const OffersView: React.FC = () => {
  const { offers, coupons, products, addToCart, setIsCartOpen, applyCoupon, language, t } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCoupon(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
          {t('offersTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {language === 'ar'
            ? 'بوكسات التوفير الكبرى وكوبونات الخصم الحصرية للطلب أونلاين'
            : 'Exclusive bundle meals, combo deals, and active coupons.'}
        </p>
      </div>

      {/* 1. Combo Deals Cards */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white font-heading text-start">
          {language === 'ar' ? 'عروض وبوكسات الكومبو' : 'Combo Deals & Boxes'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const title = language === 'ar' ? offer.titleAr : offer.titleEn;
            const desc = language === 'ar' ? offer.descriptionAr : offer.descriptionEn;

            return (
              <div
                key={offer.id}
                className="bg-[#121215] border border-[#24242a] hover:border-[#383842] rounded-xl overflow-hidden flex flex-col justify-between group transition-colors text-start"
              >
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <img
                    src={offer.image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-[#E51E2A] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    {offer.discountPercentage}% OFF
                  </div>
                  {offer.badgeAr && (
                    <div className="absolute bottom-2.5 left-2.5 rtl:left-auto rtl:right-2.5 bg-black/80 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                      {language === 'ar' ? offer.badgeAr : offer.badgeEn}
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#E51E2A] transition-colors font-heading mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{desc}</p>
                  </div>

                  <div className="pt-3 border-t border-[#24242a] flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-white font-mono">
                        {offer.price} <span className="text-xs font-bold text-[#E51E2A]">{t('currency')}</span>
                      </span>
                      <span className="text-xs text-zinc-500 line-through font-mono">
                        {offer.originalPrice}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const targetProd =
                          products.find((p) => p.id === offer.includedProductIds?.[0]) || products[0];
                        addToCart(targetProd, undefined, [], 1, `عرض: ${title}`);
                        setIsCartOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'اطلب الآن' : 'Order Deal'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Promo Coupons section */}
      <div className="space-y-4 pt-6 border-t border-[#24242a]">
        <div className="text-start">
          <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
            {language === 'ar' ? 'كوبونات الخصم' : 'Promo Coupons'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'ar'
              ? 'انسخ الكود وطبّقه مباشرة داخل سلة المشتريات للحصول على الخصم.'
              : 'Copy code and apply in your cart for discount.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="p-4 bg-[#121215] border border-[#24242a] hover:border-[#383842] rounded-xl flex flex-col justify-between space-y-3 transition-colors text-start"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% ${language === 'ar' ? 'خصم' : 'Discount'}`
                      : `${coupon.discountValue} ${t('currency')} ${language === 'ar' ? 'خصم' : 'Off'}`}
                  </span>
                  <div className="text-lg font-mono font-bold text-[#E51E2A]">
                    {coupon.code}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCoupon(coupon.code)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    copiedCode === coupon.code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1e1e24] text-zinc-200 hover:bg-[#282830]'
                  }`}
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 pt-2 border-t border-[#24242a] flex justify-between">
                <span>
                  {language === 'ar'
                    ? `حد أدنى: ${coupon.minOrder} ج.م`
                    : `Min: ${coupon.minOrder} EGP`}
                </span>
                <span>{language === 'ar' ? 'جميع الأصناف' : 'All items'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

