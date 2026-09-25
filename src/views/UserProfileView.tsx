import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { AuthView } from './AuthView';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toEnglishDigits, normalizePhone } from '../types';
import {
  History,
  Heart,
  Save,
  RotateCcw,
  Printer,
  ShoppingBag,
  Check,
  Compass,
  Search,
  MapPin,
  Star,
  User,
  Phone,
  Gift,
  Sparkles,
  PackageCheck,
  Building,
  FileText,
  Clock,
  Mail,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { user } = useAuth();
  const {
    customerProfile,
    updateCustomerProfile,
    orders,
    myDeviceOrders,
    favorites,
    products,
    reorderPastOrder,
    setActiveReceiptOrder,
    setActiveTrackingOrderId,
    setCurrentView,
    deliveryZones,
    language,
    t,
    addReview,
    updateProductRating,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'address'>('orders');
  const [lookupQuery, setLookupQuery] = useState('');

  // Form profile state
  const [name, setName] = useState(customerProfile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(customerProfile?.whatsapp || '');
  const [addressStreet, setAddressStreet] = useState(customerProfile?.addressStreet || '');
  const [addressBuilding, setAddressBuilding] = useState(customerProfile?.addressBuilding || '');
  const [addressNotes, setAddressNotes] = useState(customerProfile?.addressNotes || '');
  const [deliveryZoneId, setDeliveryZoneId] = useState(customerProfile?.deliveryZoneId || deliveryZones[0]?.id || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Review state
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  // Determine displayed orders (my device orders or lookup search)
  const displayedOrders = React.useMemo(() => {
    if (!lookupQuery.trim()) {
      return myDeviceOrders.length > 0 ? myDeviceOrders : orders;
    }
    const q = lookupQuery.trim().toLowerCase();
    const normQ = normalizePhone(lookupQuery) || toEnglishDigits(lookupQuery).trim().toLowerCase();
    return orders.filter(
      (ord) =>
        ord.id?.toLowerCase().includes(q) ||
        (normQ && ord.id?.toLowerCase().includes(normQ)) ||
        ord.customer?.phone?.includes(q) ||
        (normQ && ord.customer?.phone?.includes(normQ)) ||
        (normQ && normalizePhone(ord.customer?.phone || '').includes(normQ)) ||
        ord.customer?.name?.toLowerCase().includes(q)
    );
  }, [lookupQuery, myDeviceOrders, orders]);

  if (!user) {
    return <AuthView />;
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const normPhone = normalizePhone(phone) || toEnglishDigits(phone).trim();
    const normWhatsapp = whatsapp ? (normalizePhone(whatsapp) || toEnglishDigits(whatsapp).trim()) : undefined;
    updateCustomerProfile({
      name,
      phone: normPhone,
      whatsapp: normWhatsapp,
      addressStreet,
      addressBuilding,
      addressNotes,
      deliveryZoneId,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSubmitReview = (productId: string, cartItemId: string) => {
    if (!reviewComment.trim()) return;
    addReview({
      customerName: name || customerProfile?.name || 'Customer',
      rating: reviewRating,
      commentAr: reviewComment,
      commentEn: reviewComment,
      isApproved: false,
    });
    updateProductRating(productId, reviewRating);
    addToast(language === 'ar' ? 'شكراً لتقييمك! سيتم مراجعته قريباً.' : 'Thank you for your review! It will be checked soon.', 'success');
    setReviewingItemId(null);
    setReviewComment('');
    setReviewRating(5);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-24 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. ELEGANT PROFILE HEADER / HERO CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Ambient Decorative Blurs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#E51E2A]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User Info Avatar & Name */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#E51E2A] to-red-500 p-1 shadow-lg shadow-[#E51E2A]/30">
                  <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center text-white text-xl sm:text-2xl font-black font-mono">
                    {(user.displayName || name || user.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-white" title="Active">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-heading tracking-tight text-white">
                    {user.displayName || name || (language === 'ar' ? 'عشاق فرانك برجر' : 'Frank Lover')}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E51E2A]/20 text-[#E51E2A] border border-[#E51E2A]/30 text-[10px] font-bold uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    {language === 'ar' ? 'عضو مميز' : 'VIP Member'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{user.email}</span>
                </p>
                {phone && (
                  <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{phone}</span>
                  </p>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={() => signOut(auth)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
              
              {/* Past Orders Count */}
              <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-3.5 text-center flex flex-col justify-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-bold mb-1">
                  <PackageCheck className="w-4 h-4" />
                  <span>{language === 'ar' ? 'الطلبات' : 'Orders'}</span>
                </div>
                <span className="text-xl font-black font-mono text-white">
                  {displayedOrders.length}
                </span>
              </div>

              {/* Favorites Count */}
              <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-3.5 text-center flex flex-col justify-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
                  <Heart className="w-4 h-4" />
                  <span>{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
                </div>
                <span className="text-xl font-black font-mono text-white">
                  {favorites.length}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#E51E2A] text-white shadow-lg shadow-[#E51E2A]/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{language === 'ar' ? 'سجل الطلبات' : 'Order History'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                {displayedOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('address')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'address'
                  ? 'bg-[#E51E2A] text-white shadow-lg shadow-[#E51E2A]/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'bg-[#E51E2A] text-white shadow-lg shadow-[#E51E2A]/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>{t('favoritesTab')}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                {favorites.length}
              </span>
            </button>
          </div>

          {/* Search Filter for Orders */}
          {activeTab === 'orders' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute top-3 right-3 rtl:right-auto rtl:left-3 pointer-events-none" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث برقم الطلب أو الموبايل...' : 'Search order # or phone...'}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 rtl:pl-9 ltr:pr-9 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
              />
            </div>
          )}

        </div>

        {/* TAB CONTENT 1: ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {displayedOrders.length === 0 ? (
              <div className="p-12 text-center bg-white border border-zinc-200/80 rounded-3xl space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#E51E2A] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900 font-heading">
                    {language === 'ar' ? 'لا توجد طلبات سابقة حتى الآن' : 'No past orders yet'}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    {language === 'ar'
                      ? 'استمتع بأشهر وألذ الساندوتشات والوجبات من قائمة الطعام، وتابع حالة طلباتك مباشرة هنا.'
                      : 'Explore our delicious burgers and sides from the menu, and track your orders live right here.'}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('menu')}
                  className="px-6 py-3 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-[#E51E2A]/20"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تصفح قائمة الطعام واطلب الآن' : 'Explore Full Menu'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-3xl p-5 sm:p-6 transition-all shadow-sm hover:shadow-md flex flex-col gap-5"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm sm:text-base font-black text-zinc-900 font-mono bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-xl">
                          #{order.id}
                        </span>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            {new Date(order.orderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(order.orderDate).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.status === 'preparing'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-[#E51E2A] border border-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : order.status === 'preparing' ? 'bg-amber-500' : 'bg-[#E51E2A]'}`} />
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Items & Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      
                      {/* Items Column */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="space-y-2">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex flex-col gap-1.5 bg-zinc-50/70 border border-zinc-100 p-3 rounded-2xl">
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2.5 font-medium text-zinc-900">
                                  <span className="font-bold text-[#E51E2A] font-mono bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg text-xs">
                                    {it.quantity}x
                                  </span>
                                  <span className="font-bold">
                                    {language === 'ar' ? it.product.nameAr : it.product.nameEn}
                                  </span>
                                </div>
                                <span className="font-bold font-mono text-zinc-900">
                                  {it.totalPrice} <span className="text-[10px] text-[#E51E2A]">{t('currency')}</span>
                                </span>
                              </div>

                              {(it.selectedSize || (it.selectedAddons && it.selectedAddons.length > 0)) && (
                                <div className="text-xs text-zinc-500 flex flex-wrap gap-2 pt-0.5">
                                  {it.selectedSize && (
                                    <span className="bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-[10px]">
                                      {language === 'ar' ? it.selectedSize.nameAr : it.selectedSize.nameEn}
                                    </span>
                                  )}
                                  {it.selectedAddons && it.selectedAddons.length > 0 && (
                                    <span className="text-[#E51E2A] bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-[10px]">
                                      +{it.selectedAddons.length} {language === 'ar' ? 'إضافات' : 'addons'}
                                    </span>
                                  )}
                                </div>
                              )}

                              {order.status === 'delivered' && (
                                <div className="pt-1">
                                  <button
                                    onClick={() => setReviewingItemId(reviewingItemId === it.cartItemId ? null : it.cartItemId)}
                                    className="text-[11px] text-[#E51E2A] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>{language === 'ar' ? 'تقييم هذا المنتج' : 'Rate Product'}</span>
                                  </button>

                                  {reviewingItemId === it.cartItemId && (
                                    <div className="mt-2 p-3 bg-white border border-zinc-200 rounded-xl space-y-3">
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="p-1 cursor-pointer transition-transform hover:scale-125"
                                          >
                                            <Star className={`w-5 h-5 ${reviewRating >= star ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`} />
                                          </button>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          placeholder={language === 'ar' ? 'اكتب رأيك باختصار...' : 'Write your review...'}
                                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSubmitReview(it.productId, it.cartItemId)}
                                          className="bg-[#E51E2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#c81520] transition-colors"
                                        >
                                          {language === 'ar' ? 'إرسال' : 'Submit'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Total & Actions Panel */}
                      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            {language === 'ar' ? 'إجمالي الطلب' : 'Total Price'}
                          </span>
                          <span className="text-lg font-black font-mono text-zinc-900">
                            {order.total} <span className="text-xs font-bold text-[#E51E2A]">{t('currency')}</span>
                          </span>
                        </div>

                        <div className="text-xs text-zinc-600 space-y-1">
                          <div className="flex justify-between">
                            <span>{language === 'ar' ? 'نوع الطلب:' : 'Type:'}</span>
                            <span className="font-bold text-zinc-900">
                              {order.orderType === 'delivery' ? t('typeDelivery') : t('typePickup')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                            <span className="font-bold text-zinc-900 capitalize">
                              {order.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200">
                          <button
                            onClick={() => {
                              setActiveTrackingOrderId(order.id);
                              setCurrentView('tracking');
                            }}
                            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-800 border border-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                          >
                            <Compass className="w-4 h-4 text-blue-600" />
                            <span>{t('trackOrderBtn')}</span>
                          </button>

                          <button
                            onClick={() => setActiveReceiptOrder(order)}
                            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-800 border border-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                          >
                            <Printer className="w-4 h-4 text-zinc-500" />
                            <span>{t('printReceiptBtn')}</span>
                          </button>

                          <button
                            onClick={() => reorderPastOrder(order)}
                            className="w-full py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#E51E2A]/20"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>{t('reorderBtn')}</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: ADDRESS MANAGEMENT */}
        {activeTab === 'address' && (
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#E51E2A]" />
                <h2 className="text-lg font-bold text-zinc-900 font-heading">
                  {language === 'ar' ? 'تحديث بيانات التوصيل المباشر' : 'Delivery Address & Contact'}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {language === 'ar'
                  ? 'يتم استخدام هذه البيانات افتراضياً لإكمال طلباتك بسرعة ودون الحاجة لإعادة كتابتها كل مرة.'
                  : 'This address is used by default for rapid checkout on every order.'}
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('fullName')}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('phoneNumber')}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                    placeholder="01012345678"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 font-mono focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('whatsappNumber')}</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(toEnglishDigits(e.target.value))}
                  placeholder="01012345678"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 font-mono focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('selectZone')}</span>
                  </label>
                  <select
                    value={deliveryZoneId}
                    onChange={(e) => setDeliveryZoneId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                  >
                    {deliveryZones.filter((z) => z.isActive !== false).map((z) => (
                      <option key={z.id} value={z.id}>
                        {language === 'ar' ? z.nameAr : z.nameEn} - ({z.fee ?? (z as any).deliveryFee} {t('currency')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t('streetAddress')}</span>
                    </label>
                    <input
                      type="text"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      placeholder="شارع فريال الرئيسي"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t('buildingNumber')}</span>
                    </label>
                    <input
                      type="text"
                      value={addressBuilding}
                      onChange={(e) => setAddressBuilding(e.target.value)}
                      placeholder="عمارة 12 - الدور 3"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('deliveryNotes')}</span>
                  </label>
                  <input
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="ملاحظات توضيحية للكابتن..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] focus:bg-white transition-all"
                  />
                </div>

              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-[#E51E2A]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('saveChanges')}</span>
                </button>

                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    <Check className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</span>
                  </span>
                )}
              </div>

            </form>
          </div>
        )}

        {/* TAB CONTENT 3: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteProducts.length === 0 ? (
              <div className="p-12 text-center bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 font-heading">
                  {language === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'No favorites saved yet'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium leading-relaxed">
                  {language === 'ar'
                    ? 'اضغط على أيقونة القلب في أي وجبة أو ساندوتش في قائمة الطعام لتتمكن من الوصول إليه بسرعة هنا.'
                    : 'Click the heart icon on any burger to save it here for fast re-ordering.'}
                </p>
                <button
                  onClick={() => setCurrentView('menu')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold cursor-pointer hover:bg-black transition-colors"
                >
                  {language === 'ar' ? 'تصفح المنيو الآن' : 'Browse Menu'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
