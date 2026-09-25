import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, toEnglishDigits } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  ChefHat,
  PhoneCall,
  Printer,
  ShoppingBag,
  RotateCcw,
  AlertCircle,
  Star,
  Sparkles,
  Send,
  ThumbsUp,
  Edit3,
  Heart,
} from 'lucide-react';

export const OrderTrackingView: React.FC = () => {
  const {
    orders,
    activeTrackingOrderId,
    setActiveTrackingOrderId,
    trackOrderLookup,
    setActiveReceiptOrder,
    reorderPastOrder,
    addReview,
    updateProductRating,
    addToast,
    customerProfile,
    language,
    t,
    branches,
  } = useApp();

  const [inputOrderNumber, setInputOrderNumber] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState(false);

  // Review & Rating State for Delivered Order
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittedFeedback, setSubmittedFeedback] = useState<{
    rating: number;
    comment: string;
    tags: string[];
    date: string;
  } | null>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState<boolean>(false);

  // Load tracking order from active state or latest order
  useEffect(() => {
    if (activeTrackingOrderId) {
      const found = orders.find((o) => o.id === activeTrackingOrderId);
      if (found) {
        setActiveOrder(found);
        setInputOrderNumber(found.id);
        setInputPhone(found.customer.phone);
        return;
      }
    }

    if (orders.length > 0 && !activeOrder) {
      setActiveOrder(orders[0]);
      setInputOrderNumber(orders[0].id);
      setInputPhone(orders[0].customer.phone);
    }
  }, [activeTrackingOrderId, orders]);

  // Load existing feedback for active order if previously submitted
  useEffect(() => {
    if (!activeOrder) return;
    try {
      const saved = localStorage.getItem('frank_burger_rated_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[activeOrder.id]) {
          setSubmittedFeedback(parsed[activeOrder.id]);
          setRating(parsed[activeOrder.id].rating || 5);
          setComment(parsed[activeOrder.id].comment || '');
          setSelectedTags(parsed[activeOrder.id].tags || []);
          setIsEditingFeedback(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSubmittedFeedback(null);
    setRating(5);
    setComment('');
    setSelectedTags([]);
    setIsEditingFeedback(false);
  }, [activeOrder?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(false);

    if (!inputOrderNumber.trim()) return;

    const match = trackOrderLookup(inputOrderNumber, inputPhone);
    if (match) {
      setActiveOrder(match);
      setActiveTrackingOrderId(match.id);
      setLookupError(false);
    } else {
      setLookupError(true);
    }
  };

  // Feedback tags choices
  const feedbackTags = language === 'ar' ? [
    { id: 't1', label: '🍔 طعام ساخن ولذيذ' },
    { id: 't2', label: '⚡ سرعة فائقة في التوصيل' },
    { id: 't3', label: '🛵 كابتن مهذب ومحترم' },
    { id: 't4', label: '📦 تغليف محكم ونظيف' },
    { id: 't5', label: '🍟 مقرمش وصوصات وافرة' },
    { id: 't6', label: '🥩 جودة اللحم ممتازة' },
  ] : [
    { id: 't1', label: '🍔 Hot & Delicious Food' },
    { id: 't2', label: '⚡ Super Fast Delivery' },
    { id: 't3', label: '🛵 Polite & Courteous Driver' },
    { id: 't4', label: '📦 Clean & Secure Packaging' },
    { id: 't5', label: '🍟 Crispy Fries & Fresh Sauces' },
    { id: 't6', label: '🥩 Fresh Premium Beef' },
  ];

  const toggleTag = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const getRatingLabel = (score: number) => {
    if (language === 'ar') {
      switch (score) {
        case 5:
          return '🌟 ممتاز جداً ولذيذ للغاية!';
        case 4:
          return '👍 جيد جداً وتجربة ممتعة';
        case 3:
          return '👌 جيد وتجربة مقبولة';
        case 2:
          return '⚠️ يحتاج بعض التحسينات';
        case 1:
          return '❌ تجربة لم تكن مرضية';
        default:
          return 'اختر التقييم المناسب';
      }
    } else {
      switch (score) {
        case 5:
          return '🌟 Excellent & Super Delicious!';
        case 4:
          return '👍 Very Good & Enjoyable Experience';
        case 3:
          return '👌 Good & Acceptable';
        case 2:
          return '⚠️ Needs Some Improvements';
        case 1:
          return '❌ Unsatisfactory Experience';
        default:
          return 'Select your rating';
      }
    }
  };

  const handleSubmitFeedback = () => {
    if (!activeOrder) return;
    const tagsSummary = selectedTags.length > 0 ? selectedTags.join(' • ') : '';
    const fullComment = [tagsSummary, comment.trim()].filter(Boolean).join(' | ');

    addReview({
      customerName:
        activeOrder.customer.name ||
        customerProfile?.name ||
        (language === 'ar' ? 'عميل فرانك برجر' : 'Frank Burger Guest'),
      rating,
      commentAr: fullComment || (language === 'ar' ? 'خدمة وجودة ممتازة!' : 'Great food and delivery!'),
      commentEn: fullComment || 'Great food and delivery!',
      isApproved: true,
    });

    // Update rating on each product in the order
    activeOrder.items.forEach((item) => {
      updateProductRating(item.product.id, rating);
    });

    const feedbackData = {
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      date: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem('frank_burger_rated_orders');
      const parsed = existing ? JSON.parse(existing) : {};
      parsed[activeOrder.id] = feedbackData;
      localStorage.setItem('frank_burger_rated_orders', JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }

    setSubmittedFeedback(feedbackData);
    setIsEditingFeedback(false);
    addToast(
      language === 'ar'
        ? 'شكراً جزيلاً لتقييمك! نسعد دائماً بخدمتك وتقديم ألذ برجر لك ❤️'
        : 'Thank you for your rating! We always strive to serve you the best ❤️',
      'success'
    );
  };

  // Timeline steps config
  const steps: { status: OrderStatus; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      status: 'pending',
      labelAr: 'استلام الطلب',
      labelEn: 'Received',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      status: 'confirmed',
      labelAr: 'تأكيد الفرع',
      labelEn: 'Confirmed',
      icon: <Store className="w-4 h-4" />,
    },
    {
      status: 'preparing',
      labelAr: 'التحضير والشوي',
      labelEn: 'Grilling',
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      status: 'out_for_delivery',
      labelAr: 'مع السائق',
      labelEn: 'On the way',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      status: 'delivered',
      labelAr: 'تم التسليم',
      labelEn: 'Delivered',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'preparing') return 2;
    if (status === 'ready' || status === 'out_for_delivery') return 3;
    if (status === 'delivered') return 4;
    return 0;
  };

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0;
  const targetBranch = branches.find((b) => b.id === activeOrder?.branchId) || branches[0] || {
    nameAr: 'المطعم الرئيسي (أسيوط)',
    nameEn: 'Main Branch (Assiut)',
    phone: '01091266737',
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 font-heading">
          {t('trackingPageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">{t('trackLookupDesc')}</p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end text-start shadow-sm"
      >
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-zinc-500 mb-1">{t('orderNumberInput')}</label>
          <input
            type="text"
            value={inputOrderNumber}
            onChange={(e) => setInputOrderNumber(toEnglishDigits(e.target.value).toUpperCase())}
            placeholder="FB-9104"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 uppercase font-mono focus:outline-none focus:border-[#E51E2A]"
          />
        </div>

        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-zinc-500 mb-1">{t('phoneInput')}</label>
          <input
            type="tel"
            value={inputPhone}
            onChange={(e) => setInputPhone(toEnglishDigits(e.target.value))}
            placeholder="01012345678"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 font-mono focus:outline-none focus:border-[#E51E2A]"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{t('trackSearchBtn')}</span>
        </button>
      </form>

      {lookupError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2 text-start">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {language === 'ar'
              ? 'لم يتم العثور على طلب بهذا الرقم. تأكد من صحة رقم الطلب ورقم الهاتف.'
              : 'No order found with these credentials. Please verify order ID and phone.'}
          </span>
        </div>
      )}

      {/* Active Order Card */}
      {activeOrder && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-6 text-start shadow-sm">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-zinc-900 font-mono">
                  #{activeOrder.id}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                    activeOrder.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : activeOrder.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-[#E51E2A]/10 text-[#E51E2A]'
                  }`}
                >
                  {activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{language === 'ar' ? 'العميل:' : 'Customer:'} {activeOrder.customer.name}</span>
                <span>•</span>
                <span dir="ltr" className="font-mono text-zinc-600">
                  {activeOrder.customer.phone}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveReceiptOrder(activeOrder)}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-500" />
                <span>{t('printReceiptBtn')}</span>
              </button>

              <button
                onClick={() => reorderPastOrder(activeOrder)}
                className="px-3 py-1.5 rounded-lg bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('reorderBtn')}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar & Steps */}
          {activeOrder.status === 'cancelled' ? (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl text-center space-y-1 text-rose-700">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <h3 className="text-sm font-bold">{t('statusCancelled')}</h3>
              <p className="text-xs text-zinc-500">
                {language === 'ar'
                  ? 'تم إلغاء هذا الطلب من قبل الإدارة أو العميل.'
                  : 'This order was cancelled.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Progress Line */}
              <div className="relative">
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-100 -translate-y-1/2 z-0">
                  <div
                    className="bg-[#E51E2A] h-full transition-all duration-500"
                    style={{ width: `${(currentStepIdx / 4) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
                  {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const label = language === 'ar' ? step.labelAr : step.labelEn;

                    return (
                      <div
                        key={step.status}
                        className="flex sm:flex-col items-center gap-2.5 sm:text-center"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-[#E51E2A] text-white'
                              : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              isCurrent ? 'text-[#E51E2A] font-bold' : isCompleted ? 'text-zinc-900' : 'text-zinc-400'
                            }`}
                          >
                            {label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated ETA & Driver Box */}
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500">{t('estimatedArrival')}</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono">
                      {activeOrder.estimatedDeliveryTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200">
                  <div>
                    <div className="text-[10px] text-zinc-500">
                      {language === 'ar' ? 'الفرع:' : 'Branch:'}
                    </div>
                    <div className="text-xs font-semibold text-zinc-900">
                      {language === 'ar' ? targetBranch.nameAr : targetBranch.nameEn}
                    </div>
                  </div>
                  <a
                    href={`tel:${targetBranch.phone}`}
                    className="p-2 rounded-lg bg-zinc-100 text-[#E51E2A] hover:bg-zinc-200 transition-colors"
                    title={t('callBranch')}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* AUTOMATIC SERVICE & MEAL EVALUATION CARD UPON ORDER DELIVERY */}
          {/* ========================================================================= */}
          {activeOrder.status === 'delivered' && (
            <div className="bg-gradient-to-br from-amber-500/[0.07] via-rose-500/[0.04] to-zinc-50 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-all duration-300">
              {submittedFeedback && !isEditingFeedback ? (
                /* Submitted State Display */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                        <Heart className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                          <span>{t('ratingSubmittedTitle')}</span>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </h3>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {t('ratingSubmittedSubtitle')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditingFeedback(true)}
                      className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{language === 'ar' ? 'تعديل التقييم' : 'Edit Review'}</span>
                    </button>
                  </div>

                  {/* Summary of User's Feedback */}
                  <div className="bg-white/80 border border-amber-100 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              submittedFeedback.rating >= star
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-zinc-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-zinc-800">
                        {getRatingLabel(submittedFeedback.rating)}
                      </span>
                    </div>

                    {submittedFeedback.tags && submittedFeedback.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {submittedFeedback.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {submittedFeedback.comment && (
                      <p className="text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 italic">
                        "{submittedFeedback.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Interactive Feedback Form */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E51E2A] text-white flex items-center justify-center shadow-md shadow-[#E51E2A]/20 shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-zinc-900 font-heading flex items-center gap-1.5">
                        <span>{t('rateOrderTitle')}</span>
                      </h3>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {t('rateOrderSubtitle')}
                      </p>
                    </div>
                  </div>

                  {/* Star Selection with Live Feedback */}
                  <div className="bg-white/90 border border-amber-200/60 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title={`${star} stars`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                displayRating >= star
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                  : 'text-zinc-300 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="text-xs font-bold text-[#E51E2A] bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                        {getRatingLabel(displayRating)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Highlight Tags */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      {language === 'ar' ? 'ما أكثر شيء نال إعجابك في الطلب؟' : 'What did you like most?'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {feedbackTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.label)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-500 text-zinc-950 shadow-xs border border-amber-600 font-bold scale-[1.02]'
                                : 'bg-white text-zinc-700 border border-zinc-200 hover:border-amber-400 hover:bg-amber-50/50'
                            }`}
                          >
                            {isSelected && <ThumbsUp className="w-3 h-3 text-zinc-950" />}
                            <span>{tag.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Written Comment / Feedback */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      {language === 'ar' ? 'تعليقك أو أي ملاحظات إضافية:' : 'Your comment or extra notes:'}
                    </label>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('ratePlaceholder')}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#E51E2A] focus:ring-1 focus:ring-[#E51E2A] resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {submittedFeedback && (
                      <button
                        type="button"
                        onClick={() => setIsEditingFeedback(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSubmitFeedback}
                      className="px-6 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#E51E2A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('submitRatingBtn')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status History Logs */}
          <div className="space-y-2 pt-4 border-t border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-500">
              {language === 'ar' ? 'سجل تحديثات الطلب:' : 'Order Updates:'}
            </h3>
            <div className="space-y-1.5">
              {activeOrder.statusHistory.map((hist, hIdx) => (
                <div
                  key={hIdx}
                  className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E51E2A]" />
                    <span className="font-medium text-zinc-900 capitalize">
                      {hist.status.replace(/_/g, ' ')}
                    </span>
                    {hist.note && <span className="text-zinc-500">- {hist.note}</span>}
                  </div>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {new Date(hist.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered items review */}
          <div className="space-y-2 pt-4 border-t border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span>{language === 'ar' ? 'الأصناف في هذا الطلب:' : 'Items:'}</span>
            </h3>
            <div className="divide-y divide-zinc-100 bg-zinc-50 border border-zinc-100 rounded-xl p-3 space-y-2">
              {activeOrder.items.map((item, idx) => {
                const name = language === 'ar' ? item.product.nameAr : item.product.nameEn;
                return (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.product.image}
                        alt={name}
                        className="w-8 h-8 rounded object-cover bg-zinc-100"
                      />
                      <div>
                        <div className="font-medium text-zinc-900">
                          {item.quantity}x {name}
                        </div>
                        {item.selectedAddons.length > 0 && (
                          <div className="text-[10px] text-zinc-500">
                            +{' '}
                            {item.selectedAddons
                              .map((a) => (language === 'ar' ? a.nameAr : a.nameEn))
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-zinc-700">
                      {item.totalPrice} {t('currency')}
                    </span>
                  </div>
                );
              })}

              <div className="pt-2 flex justify-between font-bold text-xs text-zinc-900">
                <span>{t('total')}</span>
                <span className="font-mono text-[#E51E2A]">
                  {activeOrder.total} {t('currency')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


