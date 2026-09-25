import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RegisteredCustomer, Order, normalizePhone, toEnglishDigits } from '../types';
import {
  Search,
  Trash2,
  Mail,
  Smartphone,
  Calendar,
  Download,
  ShoppingBag,
  Heart,
  Users,
  Copy,
  ExternalLink,
  ShieldAlert,
  UserX,
  UserCheck,
  Star,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Eye,
  X,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export type CustomerSegmentFilter = 'all' | 'repeat' | 'new' | 'vip' | 'blacklisted';

export interface UnifiedCustomer {
  phone: string;
  name: string;
  email?: string;
  isRegistered: boolean;
  registeredId?: string;
  createdAt: string;
  favoritesCount: number;
  orders: Order[];
  ordersCount: number;
  totalNetSpent: number; // without delivery fee
  firstOrderDate?: string;
  lastOrderDate?: string;
  segment: 'new' | 'repeat' | 'vip';
  isBlacklisted: boolean;
}

export function CustomersManagementTab() {
  const {
    registeredCustomers,
    deleteRegisteredCustomer,
    orders,
    blacklist,
    addToBlacklist,
    removeFromBlacklist,
    isPhoneBlacklisted,
    getOrderProductsTotal,
    language,
    addToast,
  } = useApp();

  const isAr = language === 'ar';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegmentFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Action States
  const [viewOrdersCustomer, setViewOrdersCustomer] = useState<UnifiedCustomer | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [blacklistPromptCustomer, setBlacklistPromptCustomer] = useState<UnifiedCustomer | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('طلب وهمي ولم يستلم');

  // Synthesize Unified Customers from registered users + guest order phones
  const unifiedCustomers = useMemo(() => {
    const map = new Map<string, UnifiedCustomer>();

    // 1. Seed registered customers
    registeredCustomers.forEach((reg) => {
      const cleanPhone = reg.phone.trim();
      if (!cleanPhone) return;
      const normKey = normalizePhone(cleanPhone) || cleanPhone;

      map.set(normKey, {
        phone: normalizePhone(cleanPhone) || cleanPhone,
        name: reg.name || (isAr ? 'عميل مسجل' : 'Registered User'),
        email: reg.email,
        isRegistered: true,
        registeredId: reg.id,
        createdAt: reg.createdAt,
        favoritesCount: reg.favorites ? reg.favorites.length : 0,
        orders: [],
        ordersCount: 0,
        totalNetSpent: 0,
        segment: 'new',
        isBlacklisted: isPhoneBlacklisted(cleanPhone),
      });
    });

    // 2. Aggregate orders
    orders.forEach((order) => {
      const phone = order.customer?.phone?.trim();
      if (!phone) return;
      const normKey = normalizePhone(phone) || phone;

      let entry = map.get(normKey);
      if (!entry) {
        entry = {
          phone: normalizePhone(phone) || phone,
          name: order.customer?.name || (isAr ? 'زبون طلبات' : 'Guest Customer'),
          email: order.customer?.email,
          isRegistered: false,
          createdAt: order.orderDate,
          favoritesCount: 0,
          orders: [],
          ordersCount: 0,
          totalNetSpent: 0,
          segment: 'new',
          isBlacklisted: isPhoneBlacklisted(phone),
        };
        map.set(normKey, entry);
      }

      // Update name if guest order has a newer name and registered has generic
      if (order.customer?.name && entry.name === 'عميل مسجل') {
        entry.name = order.customer.name;
      }

      if (order.status !== 'cancelled') {
        entry.orders.push(order);
        entry.ordersCount += 1;
        entry.totalNetSpent += getOrderProductsTotal(order);

        // Dates tracking
        const orderTime = new Date(order.orderDate).getTime();
        if (!entry.firstOrderDate || orderTime < new Date(entry.firstOrderDate).getTime()) {
          entry.firstOrderDate = order.orderDate;
        }
        if (!entry.lastOrderDate || orderTime > new Date(entry.lastOrderDate).getTime()) {
          entry.lastOrderDate = order.orderDate;
        }
      }
    });

    // 3. Classify segments
    map.forEach((c) => {
      c.isBlacklisted = isPhoneBlacklisted(c.phone);
      if (c.ordersCount >= 5) {
        c.segment = 'vip';
      } else if (c.ordersCount >= 2) {
        c.segment = 'repeat';
      } else {
        c.segment = 'new';
      }
    });

    return Array.from(map.values()).sort((a, b) => b.ordersCount - a.ordersCount || b.totalNetSpent - a.totalNetSpent);
  }, [registeredCustomers, orders, isPhoneBlacklisted, getOrderProductsTotal, isAr]);

  // Retention KPI Metrics
  const retentionStats = useMemo(() => {
    const totalCustomers = unifiedCustomers.length;
    const repeatCount = unifiedCustomers.filter((c) => c.segment === 'repeat' || c.segment === 'vip').length;
    const newCount = unifiedCustomers.filter((c) => c.segment === 'new').length;
    const vipCount = unifiedCustomers.filter((c) => c.segment === 'vip').length;
    const blacklistedCount = unifiedCustomers.filter((c) => c.isBlacklisted).length;

    const customersWithOrders = unifiedCustomers.filter((c) => c.ordersCount > 0).length;
    const repeatRate = customersWithOrders > 0 ? Math.round((repeatCount / customersWithOrders) * 100) : 0;
    const totalNetSales = unifiedCustomers.reduce((acc, c) => acc + c.totalNetSpent, 0);

    return {
      totalCustomers,
      repeatCount,
      newCount,
      vipCount,
      blacklistedCount,
      repeatRate,
      totalNetSales,
    };
  }, [unifiedCustomers]);

  // Filtered List based on Search & Segment
  const filteredCustomers = useMemo(() => {
    return unifiedCustomers.filter((cust) => {
      // Segment filter
      if (segmentFilter === 'repeat' && cust.segment !== 'repeat' && cust.segment !== 'vip') return false;
      if (segmentFilter === 'new' && cust.segment !== 'new') return false;
      if (segmentFilter === 'vip' && cust.segment !== 'vip') return false;
      if (segmentFilter === 'blacklisted' && !cust.isBlacklisted) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      const normQ = normalizePhone(searchQuery) || toEnglishDigits(searchQuery).trim();
      const matchesSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (normQ && cust.phone.includes(normQ)) ||
        (normQ && normalizePhone(cust.phone).includes(normQ)) ||
        (cust.email && cust.email.toLowerCase().includes(q));

      // Date filter
      let matchesDate = true;
      if (startDate || endDate) {
        const createdDate = new Date(cust.createdAt);
        createdDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (createdDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (createdDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [unifiedCustomers, segmentFilter, searchQuery, startDate, endDate]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      addToast(isAr ? 'لا توجد بيانات لتصديرها' : 'No data to export', 'error');
      return;
    }

    const headers = isAr
      ? ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'تصنيف العميل', 'عدد الطلبات', 'إجمالي الإنفاق (بدون توصيل)', 'أول طلب', 'آخر طلب', 'محظور']
      : ['Name', 'Phone', 'Email', 'Segment', 'Orders Count', 'Net Spent', 'First Order', 'Last Order', 'Blacklisted'];

    const rows = filteredCustomers.map((cust) => [
      cust.name,
      cust.phone,
      cust.email || '',
      cust.segment === 'vip' ? 'VIP' : cust.segment === 'repeat' ? (isAr ? 'متكرر' : 'Repeat') : (isAr ? 'جديد' : 'New'),
      cust.ordersCount,
      cust.totalNetSpent,
      cust.firstOrderDate ? new Date(cust.firstOrderDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '',
      cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '',
      cust.isBlacklisted ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
    ]);

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_segmentation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(isAr ? 'تم تصدير ملف العملاء بنجاح' : 'Customers exported successfully', 'success');
  };

  const copyToClipboard = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    addToast(
      isAr
        ? `تم نسخ ${type === 'phone' ? 'رقم الهاتف' : 'البريد'} بنجاح`
        : `Copied ${type === 'phone' ? 'phone' : 'email'} successfully`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#E51E2A] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'إدارة علاقات العملاء والتكرار (CRM)' : 'Customer Intelligence & Retention'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#E51E2A]" />
            <span>{isAr ? 'قاعدة العملاء والزبائن المتكررين' : 'Customers & Repeat Buyers'}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {isAr
              ? 'تمييز دقيق بين العملاء الجدد (أول طلب) والعملاء المتكررين (الزبائن الدائمين)، مع إمكانية مراجعة سجل الطلبات وحظر أي رقم مسيء بنقرة واحدة.'
              : 'Identify new vs repeat customers, view their complete purchase history, and manage blacklist restrictions.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isAr ? 'تصدير تقرير العملاء CSV' : 'Export Customers CSV'}</span>
        </button>
      </div>

      {/* 4 Retention Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Customers */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm space-y-1.5">
          <span className="text-zinc-500 text-[11px] font-bold block">{isAr ? 'إجمالي العملاء والزبائن' : 'Total Customers'}</span>
          <div className="text-2xl font-black text-zinc-900 font-mono flex items-baseline gap-1">
            <span>{retentionStats.totalCustomers}</span>
            <span className="text-xs text-zinc-400 font-sans font-normal">{isAr ? 'عميل' : 'clients'}</span>
          </div>
          <span className="text-[10px] text-zinc-400 block">{isAr ? 'مسجلون وزبائن طلبات هاتفية' : 'Accounts & order numbers'}</span>
        </div>

        {/* Repeat Customers & Rate */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent bg-white border-2 border-amber-400/40 p-4 rounded-2xl shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-amber-800 text-[11px] font-bold">{isAr ? 'العملاء المتكررون 🌟' : 'Repeat Customers 🌟'}</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono">
              {retentionStats.repeatRate}% {isAr ? 'معدل التكرار' : 'rate'}
            </span>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono flex items-baseline gap-1">
            <span>{retentionStats.repeatCount}</span>
            <span className="text-xs text-amber-700 font-sans font-normal">{isAr ? 'زبون دائم' : 'loyal'}</span>
          </div>
          <span className="text-[10px] text-amber-700/80 block">{isAr ? 'اشتروا أكثر من مرة واحدة' : 'Ordered 2 or more times'}</span>
        </div>

        {/* New Customers */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm space-y-1.5">
          <span className="text-emerald-700 text-[11px] font-bold block">{isAr ? 'العملاء الجدد 🌱' : 'New Customers 🌱'}</span>
          <div className="text-2xl font-black text-zinc-900 font-mono flex items-baseline gap-1">
            <span>{retentionStats.newCount}</span>
            <span className="text-xs text-zinc-400 font-sans font-normal">{isAr ? 'أول طلب' : '1st order'}</span>
          </div>
          <span className="text-[10px] text-zinc-400 block">{isAr ? 'فرصة لإعطائهم تجربة تكرار مميزة' : 'First-time buyers'}</span>
        </div>

        {/* Blacklisted Numbers */}
        <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-sm space-y-1.5">
          <span className="text-rose-700 text-[11px] font-bold block">{isAr ? 'أرقام محظورة 🚫' : 'Blacklisted Numbers 🚫'}</span>
          <div className="text-2xl font-black text-rose-600 font-mono flex items-baseline gap-1">
            <span>{blacklist.length}</span>
            <span className="text-xs text-rose-400 font-sans font-normal">{isAr ? 'محظور' : 'blocked'}</span>
          </div>
          <span className="text-[10px] text-zinc-400 block">{isAr ? 'ممنوعون من استقبال الطلبات' : 'Restricted from checkout'}</span>
        </div>
      </div>

      {/* Filter and Segment Selection Bar */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Segmentation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 pb-3">
          {[
            { id: 'all', ar: `جميع العملاء (${retentionStats.totalCustomers})`, en: `All (${retentionStats.totalCustomers})` },
            { id: 'repeat', ar: `عملاء متكررون 🌟 (${retentionStats.repeatCount})`, en: `Repeat 🌟 (${retentionStats.repeatCount})` },
            { id: 'new', ar: `عملاء جدد 🌱 (${retentionStats.newCount})`, en: `New 🌱 (${retentionStats.newCount})` },
            { id: 'vip', ar: `عملاء VIP 👑 (${retentionStats.vipCount})`, en: `VIP 👑 (${retentionStats.vipCount})` },
            { id: 'blacklisted', ar: `المحظورون 🚫 (${retentionStats.blacklistedCount})`, en: `Blacklisted 🚫 (${retentionStats.blacklistedCount})` },
          ].map((tab) => {
            const isActive = segmentFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSegmentFilter(tab.id as CustomerSegmentFilter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E51E2A] text-white shadow-sm'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            );
          })}
        </div>

        {/* Search & Date Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم الزبون، رقم الهاتف، أو البريد...' : 'Search by customer name, phone, email...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-500 font-bold">{isAr ? 'من تاريخ:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-500 font-bold">{isAr ? 'إلى:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#E51E2A] rounded-xl text-[11px] font-bold cursor-pointer"
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-medium">
          {isAr
            ? `يظهر ${filteredCustomers.length} عميل يطابق خيارات البحث والتصفية`
            : `Showing ${filteredCustomers.length} matching customers`}
        </div>
      </div>

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">
            {isAr ? 'لا يوجد عملاء يطابقون خيارات البحث' : 'No customers match filters'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr ? 'جرب تغيير التبويب أو إزالة كلمات البحث.' : 'Try changing segment or clearing search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const isRepeat = cust.segment === 'repeat';
            const isVip = cust.segment === 'vip';
            const isNew = cust.segment === 'new';

            const initials = cust.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={cust.phone}
                className={`bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border ${
                  cust.isBlacklisted
                    ? 'border-rose-300 bg-rose-50/20'
                    : isVip
                    ? 'border-amber-300 ring-1 ring-amber-300/40'
                    : 'border-zinc-200'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner border ${
                          cust.isBlacklisted
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : isVip
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : isRepeat
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {initials || 'CU'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                            {cust.name}
                          </h3>
                        </div>

                        {/* Customer Segment Badge */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {cust.isBlacklisted ? (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                              🚫 {isAr ? 'محظور (Blacklist)' : 'Blocked'}
                            </span>
                          ) : isVip ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              👑 {isAr ? 'عميل VIP متميز' : 'VIP Client'}
                            </span>
                          ) : isRepeat ? (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              🌟 {isAr ? `عميل متكرر (${cust.ordersCount} طلبات)` : `Repeat (${cust.ordersCount} orders)`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              🌱 {isAr ? 'عميل جديد (أول طلب)' : 'New Customer'}
                            </span>
                          )}

                          {cust.isRegistered && (
                            <span className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                              {isAr ? 'حساب مسجل' : 'Registered'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete button (if registered account) */}
                    {cust.isRegistered && cust.registeredId && (
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(cust.registeredId!)}
                        title={isAr ? 'حذف حساب العميل' : 'Delete Account'}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Contact Details Block */}
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-2">
                    {/* Phone */}
                    <div className="flex items-center justify-between text-zinc-600 border-b border-zinc-200/40 pb-1.5">
                      <span className="text-[11px] text-zinc-500 font-bold">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-zinc-900" dir="ltr">{cust.phone}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cust.phone, 'phone')}
                          title={isAr ? 'نسخ الهاتف' : 'Copy Phone'}
                          className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick WhatsApp & Call Bar */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${cust.phone}`}
                        className="flex-1 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3 text-zinc-500" />
                        <span>{isAr ? 'اتصال' : 'Call'}</span>
                      </a>
                      <a
                        href={`https://wa.me/20${cust.phone.replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>

                  {/* Performance Indicators Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                      <span className="text-[10px] text-zinc-500 block mb-0.5">{isAr ? 'عدد الطلبات' : 'Orders Count'}</span>
                      <span className="text-sm font-black text-zinc-900 font-mono">
                        {cust.ordersCount} {isAr ? 'طلب' : ''}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <span className="text-[10px] text-emerald-700 block mb-0.5">{isAr ? 'صافي المشتريات' : 'Net Spent'}</span>
                      <span className="text-sm font-black text-emerald-800 font-mono">
                        {cust.totalNetSpent.toLocaleString()} {isAr ? 'ج' : 'EGP'}
                      </span>
                    </div>
                  </div>

                  {/* Order Dates info */}
                  {cust.ordersCount > 0 && (
                    <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between px-1">
                      <span>{isAr ? 'أول طلب:' : 'First:'} {new Date(cust.firstOrderDate!).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                      <span>{isAr ? 'آخر طلب:' : 'Last:'} {new Date(cust.lastOrderDate!).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 mt-3">
                  {/* View History Button */}
                  <button
                    type="button"
                    onClick={() => setViewOrdersCustomer(cust)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{isAr ? 'سجل الطلبات' : 'Orders History'}</span>
                  </button>

                  {/* Blacklist / Unblock Button */}
                  {cust.isBlacklisted ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await removeFromBlacklist(cust.phone);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إلغاء الحظر' : 'Unblock'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBlacklistPromptCustomer(cust)}
                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حظر الرقم 🚫' : 'Block'}</span>
                    </button>
                  )}
                </div>

                {/* Confirm Delete Registered User */}
                {confirmingDeleteId === cust.registeredId && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs">
                    <p className="font-bold text-red-800 mb-2">
                      {isAr ? 'هل أنت متأكد من حذف حساب الزبون بالكامل؟' : 'Delete this registered customer account?'}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-700 font-bold hover:bg-zinc-50"
                      >
                        {isAr ? 'تراجع' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (cust.registeredId) {
                            await deleteRegisteredCustomer(cust.registeredId);
                          }
                          setConfirmingDeleteId(null);
                        }}
                        className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                      >
                        {isAr ? 'تأكيد الحذف' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER PAST ORDERS HISTORY MODAL */}
      {/* ========================================================================= */}
      {viewOrdersCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-400">
                    {viewOrdersCustomer.segment === 'vip' ? '👑 عميل VIP' : viewOrdersCustomer.segment === 'repeat' ? '🌟 عميل متكرر' : '🌱 عميل جديد'}
                  </span>
                  <span className="text-zinc-400 text-xs">•</span>
                  <span className="text-zinc-300 text-xs font-mono" dir="ltr">{viewOrdersCustomer.phone}</span>
                </div>
                <h3 className="text-lg font-black font-heading leading-tight">
                  {isAr ? `سجل طلبات العميل: ${viewOrdersCustomer.name}` : `Order History: ${viewOrdersCustomer.name}`}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setViewOrdersCustomer(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-center text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</span>
                  <span className="font-bold text-zinc-900 font-mono text-base">{viewOrdersCustomer.ordersCount}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">{isAr ? 'صافي المبيعات (بدون توصيل)' : 'Net Products Total'}</span>
                  <span className="font-bold text-emerald-600 font-mono text-base">{viewOrdersCustomer.totalNetSpent.toLocaleString()} {isAr ? 'ج' : 'EGP'}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-zinc-400 block text-[10px]">{isAr ? 'حالة الحظر' : 'Blacklist Status'}</span>
                  <span className={`font-bold ${viewOrdersCustomer.isBlacklisted ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {viewOrdersCustomer.isBlacklisted ? (isAr ? 'محظور 🚫' : 'Blocked') : (isAr ? 'سليم ونشط ✅' : 'Active')}
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-900 mt-2">
                {isAr ? 'قائمة الطلبات السابقة بالتفصيل:' : 'Past Orders Detailed:'}
              </h4>

              {viewOrdersCustomer.orders.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  {isAr ? 'لا توجد طلبات سابقة مكتملة لهذا العميل حتى الآن.' : 'No orders recorded for this customer.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {viewOrdersCustomer.orders.map((order) => {
                    const netFood = getOrderProductsTotal(order);
                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-900">#{order.id.slice(-6)}</span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                              {order.orderType === 'delivery' ? (isAr ? 'توصيل' : 'Delivery') : (isAr ? 'استلام' : 'Pickup')}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {new Date(order.orderDate).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>

                        {/* Items in this order */}
                        <div className="text-xs space-y-1 py-1">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-zinc-700">
                              <span>
                                {isAr ? it.product.nameAr : it.product.nameEn}
                                {it.size ? ` (${it.size.nameAr})` : ''} x{it.quantity}
                              </span>
                              <span className="font-mono font-semibold">
                                {it.itemTotal || (it.product.price * it.quantity)} {isAr ? 'ج' : 'EGP'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total breakdown */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                          <div className="text-zinc-500 text-[11px]">
                            <span>{isAr ? 'طعام:' : 'Food:'} {netFood} {isAr ? 'ج' : 'EGP'}</span>
                            {order.deliveryFee ? <span> • {isAr ? 'دليفري:' : 'Fee:'} {order.deliveryFee} {isAr ? 'ج' : 'EGP'}</span> : null}
                          </div>
                          <div className="font-mono font-black text-zinc-900 text-sm">
                            {order.total} {isAr ? 'جنيه' : 'EGP'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewOrdersCustomer(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK BLACKLIST PROMPT MODAL */}
      {/* ========================================================================= */}
      {blacklistPromptCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-rose-900 to-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm font-heading">
                  {isAr ? 'حظر هذا العميل (إضافة للبلاك ليست)' : 'Add Customer to Blacklist'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBlacklistPromptCustomer(null)}
                className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                <p className="font-bold text-rose-900">
                  {isAr ? 'بيانات الرقم المطلوب حظره:' : 'Target Phone to Block:'}
                </p>
                <p className="text-zinc-700">
                  {isAr ? 'الاسم:' : 'Name:'} <span className="font-bold">{blacklistPromptCustomer.name}</span>
                </p>
                <p className="font-mono text-zinc-800 font-bold" dir="ltr">
                  {blacklistPromptCustomer.phone}
                </p>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  {isAr ? 'سبب الحظر' : 'Block Reason'}
                </label>
                <select
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 bg-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="طلب وهمي ولم يستلم">{isAr ? 'طلب وهمي ولم يستلم' : 'Fake order / Never received'}</option>
                  <option value="رقم وهمي غير صحيح">{isAr ? 'رقم وهمي غير صحيح' : 'Invalid phone number'}</option>
                  <option value="إلغاء متكرر بعد تجهيز الطعام">{isAr ? 'إلغاء متكرر بعد تجهيز الطعام' : 'Repeated cancellation'}</option>
                  <option value="سلوك غير لائق مع الدليفري">{isAr ? 'سلوك غير لائق مع الدليفري' : 'Inappropriate behavior'}</option>
                  <option value="أخرى">{isAr ? 'أسباب أخرى' : 'Other'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setBlacklistPromptCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await addToBlacklist(
                      blacklistPromptCustomer.phone,
                      blacklistReason,
                      blacklistPromptCustomer.name
                    );
                    setBlacklistPromptCustomer(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد الحظر الآن' : 'Confirm Block'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
