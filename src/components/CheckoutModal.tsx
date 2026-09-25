import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderType, PaymentMethod, toEnglishDigits, normalizePhone } from '../types';
import { trackInitiateCheckout } from '../lib/pixel';
import {
  X,
  MapPin,
  Store,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

// Helper to convert and compress image file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    couponDiscountAmount,
    appliedCoupon,
    deliveryZones,
    branches,
    settings,
    createOrder,
    customerProfile,
    updateCustomerProfile,
    isPhoneBlacklisted,
    language,
    addToast,
    t,
  } = useApp();

  // Form State initialized from customer profile
  const [name, setName] = useState(customerProfile?.name || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(customerProfile?.whatsapp || '');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [selectedZoneId, setSelectedZoneId] = useState(
    customerProfile?.deliveryZoneId || deliveryZones.find(z => z.isActive !== false)?.id || deliveryZones[0]?.id || ''
  );

  // Sync selectedZoneId if current zone becomes inactive or changes
  useEffect(() => {
    const activeZones = deliveryZones.filter((z) => z.isActive !== false);
    if (activeZones.length > 0 && !activeZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(activeZones[0].id);
    }
  }, [deliveryZones, selectedZoneId]);
  const [selectedBranchId, setSelectedBranchId] = useState(
    customerProfile?.pickupBranchId || branches[0]?.id || ''
  );
  const [streetAddress, setStreetAddress] = useState(customerProfile?.addressStreet || '');
  const [buildingNumber, setBuildingNumber] = useState(customerProfile?.addressBuilding || '');
  const [deliveryNotes, setDeliveryNotes] = useState(customerProfile?.addressNotes || '');

  // Timing
  const [timingType, setTimingType] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState('اليوم — 09:30 مساءً');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCheckoutOpen && cart.length > 0) {
      trackInitiateCheckout(cart, cartSubtotal);
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const currentZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];
  const isFreeDelivery = cartSubtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : currentZone?.fee || 20) : 0;
  const finalTotal = Math.max(0, cartSubtotal - couponDiscountAmount + deliveryFee);
  const isCurrentPhoneBlacklisted = Boolean(phone.trim() && isPhoneBlacklisted(phone));

  const validate = () => {
    const errs: Record<string, string> = {};
    const normPhone = normalizePhone(phone) || toEnglishDigits(phone).trim();
    if (!name.trim()) errs.name = t('requiredField');
    if (!normPhone || normPhone.length < 8) {
      errs.phone = t('requiredField');
    } else if (isPhoneBlacklisted(normPhone)) {
      errs.phone = language === 'ar'
        ? 'عذراً، هذا الرقم محظور من استقبال الطلبات. يرجى مراجعة إدارة المطعم.'
        : 'Sorry, this phone number is restricted from placing orders.';
    }
    if (orderType === 'delivery' && !streetAddress.trim()) errs.streetAddress = t('requiredField');
    if (paymentMethod === 'instapay' && !paymentProof) {
      errs.payment = language === 'ar' ? 'يرجى إرفاق صورة إيصال تحويل إنستاباي' : 'Please upload InstaPay transfer proof';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const base64 = await fileToBase64(file);
      setPaymentProofPreview(base64);
      setErrors((prev) => ({ ...prev, payment: '' }));
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (isCurrentPhoneBlacklisted) {
      addToast(
        language === 'ar'
          ? 'عذراً، هذا الرقم محظور من إرسال الطلبات بسبب بلاغات أو طلبات غير جادة سابقة.'
          : 'Sorry, this phone number is restricted from placing orders.',
        'error'
      );
      return;
    }

    if (!validate()) {
      addToast(language === 'ar' ? 'يرجى استكمال البيانات المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhone(phone) || toEnglishDigits(phone).trim();
      const normalizedWhatsapp = whatsapp ? (normalizePhone(whatsapp) || toEnglishDigits(whatsapp).trim()) : undefined;

      // Save customer profile for next time
      updateCustomerProfile({
        name,
        phone: normalizedPhone,
        whatsapp: normalizedWhatsapp,
        addressStreet: streetAddress,
        addressBuilding: buildingNumber,
        addressNotes: deliveryNotes,
        deliveryZoneId: selectedZoneId,
        pickupBranchId: selectedBranchId,
      });

      let paymentProofUrl: string | undefined;
      if (paymentMethod === 'instapay' && paymentProof) {
        paymentProofUrl = paymentProofPreview || (await fileToBase64(paymentProof));
      }

      // Submit order
      await createOrder({
        customer: {
          name,
          phone: normalizedPhone,
          whatsapp: normalizedWhatsapp,
          addressStreet: streetAddress,
          addressBuilding: buildingNumber,
          addressNotes: deliveryNotes,
          deliveryZoneId: orderType === 'delivery' ? (selectedZoneId || null) : null,
          pickupBranchId: orderType === 'pickup' ? (selectedBranchId || null) : null,
        },
        items: cart,
        orderType,
        status: 'pending',
        paymentMethod,
        paymentProofUrl,
        paymentStatus: paymentMethod === 'instapay' ? 'pending' : 'pending',
        subtotal: cartSubtotal,
        products_total: Math.max(0, cartSubtotal - couponDiscountAmount),
        discount: couponDiscountAmount,
        deliveryFee,
        tax: 0,
        total: Math.max(0, cartSubtotal - couponDiscountAmount),
        couponCode: appliedCoupon?.code,
        estimatedDeliveryTime:
          timingType === 'now'
            ? orderType === 'delivery'
              ? currentZone?.estimatedMinutes || '30-45 دقيقة'
              : '15-20 دقيقة'
            : scheduledTime,
        scheduledTime: timingType === 'scheduled' ? scheduledTime : undefined,
        branchId: orderType === 'pickup' ? selectedBranchId : branches[0]?.id,
      });

      setIsCheckoutOpen(false);
    } catch (err) {
      console.error('Error placing order:', err);
      addToast(language === 'ar' ? 'حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى' : 'Failed to place order', 'error');
      setErrors({ submit: 'Failed to place order' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={() => setIsCheckoutOpen(false)} />

      {/* Modal Container */}
      <div
        className="relative bg-white border border-zinc-200/80 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl z-10 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-[#E51E2A] border border-red-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 font-heading">{t('checkoutTitle')}</h2>
              <p className="text-xs text-zinc-500 font-medium">
                {language === 'ar' ? 'طلب فوري بدون إنشاء حساب إجباري' : 'Fast guest checkout'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handlePlaceOrder} className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Fulfillment Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-2">
              {t('deliveryTypeSection')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderType === 'delivery'
                    ? 'bg-[#E51E2A] text-white border-[#E51E2A] shadow-md shadow-[#E51E2A]/20'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{t('typeDelivery')}</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderType === 'pickup'
                    ? 'bg-[#E51E2A] text-white border-[#E51E2A] shadow-md shadow-[#E51E2A]/20'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{t('typePickup')}</span>
              </button>
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-2xl space-y-3.5">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              {t('customerInfoSection')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  {t('fullName')} <span className="text-[#E51E2A]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: أحمد محمود' : 'e.g. John Doe'}
                  className={`w-full bg-white border rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A] ${
                    errors.name ? 'border-rose-500' : 'border-zinc-300'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-rose-500 font-medium mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  {t('phoneNumber')} <span className="text-[#E51E2A]">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                  placeholder="01012345678"
                  className={`w-full bg-white border rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 font-mono focus:outline-none focus:border-[#E51E2A] ${
                    isCurrentPhoneBlacklisted
                      ? 'border-rose-500 bg-rose-50/40 text-rose-900 ring-2 ring-rose-500/20'
                      : errors.phone
                      ? 'border-rose-500'
                      : 'border-zinc-300'
                  }`}
                />
                {isCurrentPhoneBlacklisted && (
                  <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] leading-relaxed flex items-start gap-1.5">
                    <span className="font-bold shrink-0">⚠️ محظور:</span>
                    <span>
                      {language === 'ar'
                        ? 'هذا الرقم محظور حالياً من إرسال الطلبات بسبب بلاغات غير جادة سابقة. يرجى التواصل مع إدارة المطعم مباشرة لحل المشكلة.'
                        : 'This phone number is currently blocked from placing orders. Please contact management.'}
                    </span>
                  </div>
                )}
                {!isCurrentPhoneBlacklisted && errors.phone && (
                  <p className="text-[10px] text-rose-500 font-medium mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                {t('whatsappNumber')}
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(toEnglishDigits(e.target.value))}
                placeholder={language === 'ar' ? 'اختياري لتلقي تفاصيل التتبع عبر واتساب' : 'Optional for WhatsApp updates'}
                className="w-full bg-white border border-zinc-300 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 font-mono focus:outline-none focus:border-[#E51E2A]"
              />
            </div>
          </div>

          {/* 3. Address or Branch selection */}
          {orderType === 'delivery' ? (
            <div className="bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E51E2A]" />
                <span>{t('selectZone')}</span>
              </h3>

              {/* Delivery Zone select */}
              <div>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl py-2.5 px-3 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A]"
                >
                  {deliveryZones.filter((z) => z.isActive !== false).map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {language === 'ar' ? zone.nameAr : zone.nameEn} — {zone.fee} {t('currency')} (
                      {zone.estimatedMinutes})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    {t('streetAddress')} <span className="text-[#E51E2A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder={language === 'ar' ? 'الشارع / رقم المنزل / معلم مميز' : 'Street / Landmarks'}
                    className={`w-full bg-white border rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A] ${
                      errors.streetAddress ? 'border-rose-500' : 'border-zinc-300'
                    }`}
                  />
                  {errors.streetAddress && (
                    <p className="text-[10px] text-rose-500 font-medium mt-1">{errors.streetAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    {t('buildingNumber')}
                  </label>
                  <input
                    type="text"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder={language === 'ar' ? 'العمارة 5 - الدور 3 - شقة 12' : 'Bldg 5 - Floor 3 - Apt 12'}
                    className="w-full bg-white border border-zinc-300 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  {t('deliveryNotes')}
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: اترك الطلب عند الباب، لا ترن الجرس...' : 'e.g. Leave at door...'}
                  className="w-full bg-white border border-zinc-300 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A]"
                />
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#E51E2A]" />
                <span>{language === 'ar' ? 'موقع استلام الطلب من المطعم' : 'Pickup Location'}</span>
              </h3>

              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 text-start space-y-2">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-zinc-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E51E2A]" />
                    {language === 'ar' ? settings.addressAr : settings.addressEn}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {language === 'ar' ? 'استلام تيك أواي جاهز' : 'Takeaway Ready'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 font-medium">
                  {language === 'ar'
                    ? 'سيتم تجهيز طلبك طازجاً وساخناً للاستلام فور وصولك للمطعم.'
                    : 'Your meal will be freshly prepared and ready for pickup upon arrival.'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono pt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{language === 'ar' ? settings.openingHoursAr : settings.openingHoursEn}</span>
                  <span>•</span>
                  <span dir="ltr" className="font-bold text-zinc-700">{settings.phone || '01091266737'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Timing Option */}
          <div className="bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span>{t('timingSection')}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTimingType('now')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  timingType === 'now'
                    ? 'bg-red-50 border-[#E51E2A] text-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {t('orderNowTiming')}
              </button>

              <button
                type="button"
                onClick={() => setTimingType('scheduled')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  timingType === 'scheduled'
                    ? 'bg-red-50 border-[#E51E2A] text-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {t('orderScheduledTiming')}
              </button>
            </div>

            {timingType === 'scheduled' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="مثال: اليوم — 10:30 مساءً"
                  className="w-full bg-white border border-zinc-300 rounded-xl py-2 px-3 text-xs text-zinc-900 font-medium focus:outline-none focus:border-[#E51E2A]"
                />
              </div>
            )}
          </div>

          {/* 5. Payment Methods */}
          <div className="bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span>{t('paymentSection')}</span>
            </h3>

            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'bg-red-50/80 border-[#E51E2A] text-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-4 h-4 text-[#E51E2A]" />
                  <span className="text-xs font-bold">{t('payCash')}</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  className="accent-[#E51E2A]"
                />
              </label>

              <label
                onClick={() => setPaymentMethod('instapay')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'instapay'
                    ? 'bg-red-50/80 border-[#E51E2A] text-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-[#E51E2A]" />
                  <span className="text-xs font-bold">{language === 'ar' ? 'انستا باي' : 'InstaPay'}</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'instapay'}
                  onChange={() => setPaymentMethod('instapay')}
                  className="accent-[#E51E2A]"
                />
              </label>

              {paymentMethod === 'instapay' && (
                <div className="mt-3 p-4 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#E51E2A]" />
                      <span>{language === 'ar' ? 'بيانات التحويل عبر إنستاباي:' : 'InstaPay Transfer Details:'}</span>
                    </p>
                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {settings.phone || '01091266737'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    {language === 'ar'
                      ? 'يرجى تحويل المبلغ الإجمالي إلى الحساب/الرقم أعلاه ثم إرفاق لقطة شاشة (Screenshot) لتأكيد الدفع فوراً:'
                      : 'Please transfer the total amount to the number above and attach the payment screenshot below:'}
                  </p>

                  {!paymentProofPreview ? (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 hover:border-[#E51E2A] rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors group">
                      <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[#E51E2A] mb-1.5 transition-colors" />
                      <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">
                        {language === 'ar' ? 'اضغط لرفع صورة إيصال التحويل' : 'Click to upload transfer screenshot'}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG, JPEG</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 p-2 flex items-center gap-3">
                      <img
                        src={paymentProofPreview}
                        alt="Payment Proof"
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {paymentProof?.name || (language === 'ar' ? 'إيصال التحويل' : 'Proof Receipt')}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'ar' ? 'تم تجهيز الصورة للتأكيد' : 'Image ready for verification'}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProof(null);
                          setPaymentProofPreview(null);
                        }}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title={language === 'ar' ? 'حذف الصورة' : 'Remove image'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {errors.payment && (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.payment}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Modal Action Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-zinc-200 flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div>
            <div className="text-[11px] text-zinc-500 font-semibold">
              {language === 'ar' ? 'قيمة الطلب' : 'Order Value'}
            </div>
            <div className="text-xl font-black text-zinc-900 font-mono flex items-baseline gap-1">
              <span>{Math.max(0, cartSubtotal - couponDiscountAmount)}</span>
              <span className="text-xs text-[#E51E2A] font-bold">{t('currency')}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5 flex items-center gap-1">
                <span>{language === 'ar' ? '+ خدمة التوصيل:' : '+ Delivery:'}</span>
                <span className="font-bold text-zinc-800 font-mono">{deliveryFee} {t('currency')}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || isCurrentPhoneBlacklisted}
            className="flex-grow py-3.5 px-5 rounded-xl bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E51E2A]/20 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>{t('submittingOrder')}</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('placeOrderButton')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
