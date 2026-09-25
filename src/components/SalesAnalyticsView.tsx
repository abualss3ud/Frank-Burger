import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order } from '../types';
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Flame,
  Award,
  AlertTriangle,
  X,
  Search,
  Filter,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  Truck,
  Percent,
} from 'lucide-react';

export type DatePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

export interface ProductStats {
  product: Product;
  quantitySold: number;
  ordersCount: number;
  totalRevenue: number; // pure product revenue
  orderPercentage: number;
  addonCounts: Record<string, number>;
  sizeCounts: Record<string, number>;
  recentOrders: { orderId: string; date: string; customerName: string; quantity: number; itemTotal: number }[];
}

export function SalesAnalyticsView() {
  const { orders, products, categories, getOrderProductsTotal, language, addToast } = useApp();
  const isAr = language === 'ar';

  // Date range state
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Product Ranking filters
  const [rankingSort, setRankingSort] = useState<'most_ordered' | 'least_ordered' | 'highest_revenue' | 'zero_orders'>('most_ordered');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');

  // Drill-down detailed report modal
  const [selectedProductForReport, setSelectedProductForReport] = useState<Product | null>(null);

  // Calculate start & end Date objects based on preset
  const { dateRangeStart, dateRangeEnd, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    let label = '';

    switch (datePreset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        label = isAr ? 'اليوم' : 'Today';
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        label = isAr ? 'أمس' : 'Yesterday';
        break;
      case 'last7':
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        label = isAr ? 'آخر 7 أيام' : 'Last 7 Days';
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        label = isAr ? 'هذا الشهر' : 'This Month';
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = isAr ? 'الشهر السابق' : 'Last Month';
        break;
      case 'custom':
        if (customStartDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(2020, 0, 1);
        }
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        } else {
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
        }
        label = isAr ? 'فترة مخصصة' : 'Custom Period';
        break;
      case 'all':
      default:
        start = new Date(2020, 0, 1);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = isAr ? 'كافة الفترات' : 'All Time';
        break;
    }

    return { dateRangeStart: start, dateRangeEnd: end, dateRangeLabel: label };
  }, [datePreset, customStartDate, customEndDate, isAr]);

  // Filter orders by date range and exclude cancelled orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.orderDate);
      return orderDate >= dateRangeStart && orderDate <= dateRangeEnd;
    });
  }, [orders, dateRangeStart, dateRangeEnd]);

  // All valid orders (including outside range, for baseline comparisons)
  const allValidOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders]);

  // Aggregate Sales Metrics (EXCLUDING DELIVERY FEES)
  const salesMetrics = useMemo(() => {
    let totalNetProductsSales = 0; // Pure products sales (WITHOUT delivery fees)
    let totalDeliveryFees = 0;
    let totalGrossRevenue = 0; // Products + delivery
    let totalDiscounts = 0;
    let deliveryOrdersCount = 0;
    let pickupOrdersCount = 0;

    filteredOrders.forEach((order) => {
      const netProduct = getOrderProductsTotal(order);
      const deliveryFee = order.deliveryFee || 0;
      const gross = order.total || (netProduct + deliveryFee);
      const discount = order.couponDiscount || 0;

      totalNetProductsSales += netProduct;
      totalDeliveryFees += deliveryFee;
      totalGrossRevenue += gross;
      totalDiscounts += discount;

      if (order.orderType === 'delivery') {
        deliveryOrdersCount++;
      } else {
        pickupOrdersCount++;
      }
    });

    const ordersCount = filteredOrders.length;
    const avgBasketWithoutDelivery = ordersCount > 0 ? Math.round(totalNetProductsSales / ordersCount) : 0;
    const avgDeliveryFee = deliveryOrdersCount > 0 ? Math.round(totalDeliveryFees / deliveryOrdersCount) : 0;

    return {
      ordersCount,
      totalNetProductsSales,
      totalDeliveryFees,
      totalGrossRevenue,
      totalDiscounts,
      avgBasketWithoutDelivery,
      avgDeliveryFee,
      deliveryOrdersCount,
      pickupOrdersCount,
    };
  }, [filteredOrders, getOrderProductsTotal]);

  // Daily Breakdown inside selected period
  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { dateStr: string; netSales: number; deliveryFees: number; ordersCount: number }>();

    filteredOrders.forEach((order) => {
      const d = new Date(order.orderDate);
      const key = d.toISOString().split('T')[0];
      const net = getOrderProductsTotal(order);
      const fee = order.deliveryFee || 0;

      const existing = map.get(key) || { dateStr: key, netSales: 0, deliveryFees: 0, ordersCount: 0 };
      existing.netSales += net;
      existing.deliveryFees += fee;
      existing.ordersCount += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredOrders, getOrderProductsTotal]);

  // Aggregate Product Performance inside selected period
  const productStatsMap = useMemo<Map<string, ProductStats>>(() => {
    const stats = new Map<string, ProductStats>();

    // Initialize with all menu products (even 0 sales)
    products.forEach((p) => {
      stats.set(p.id, {
        product: p,
        quantitySold: 0,
        ordersCount: 0,
        totalRevenue: 0,
        orderPercentage: 0,
        addonCounts: {},
        sizeCounts: {},
        recentOrders: [],
      });
    });

    const totalPeriodOrders = Math.max(1, filteredOrders.length);

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const pId = item.product.id;
        let entry = stats.get(pId);
        if (!entry) {
          // If product was archived or deleted, initialize placeholder
          entry = {
            product: item.product,
            quantitySold: 0,
            ordersCount: 0,
            totalRevenue: 0,
            orderPercentage: 0,
            addonCounts: {},
            sizeCounts: {},
            recentOrders: [],
          };
          stats.set(pId, entry);
        }

        const qty = item.quantity || 1;
        const revenue = item.itemTotal || (item.product.price * qty);

        entry.quantitySold += qty;
        entry.ordersCount += 1;
        entry.totalRevenue += revenue;

        // Size tracking
        if (item.size?.nameAr) {
          const sName = item.size.nameAr;
          entry.sizeCounts[sName] = (entry.sizeCounts[sName] || 0) + qty;
        }

        // Addons tracking
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach((ad) => {
            const adName = ad.nameAr || ad.nameEn;
            entry!.addonCounts[adName] = (entry!.addonCounts[adName] || 0) + (ad.quantity || 1) * qty;
          });
        }

        // Track in recent orders
        if (entry.recentOrders.length < 8) {
          entry.recentOrders.push({
            orderId: order.id,
            date: order.orderDate,
            customerName: order.customer?.name || (isAr ? 'زبون' : 'Customer'),
            quantity: qty,
            itemTotal: revenue,
          });
        }
      });
    });

    // Compute percentages
    stats.forEach((st) => {
      st.orderPercentage = Math.round((st.ordersCount / totalPeriodOrders) * 100);
    });

    return stats;
  }, [products, filteredOrders, isAr]);

  // Ranked Products List according to current filters & sorting
  const rankedProducts = useMemo<ProductStats[]>(() => {
    let list: ProductStats[] = Array.from(productStatsMap.values());

    // Category filter
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((st) => st.product.categoryId === selectedCategoryFilter);
    }

    // Search filter
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter(
        (st) =>
          st.product.nameAr.toLowerCase().includes(q) ||
          st.product.nameEn.toLowerCase().includes(q)
      );
    }

    // Sort order
    switch (rankingSort) {
      case 'most_ordered':
        list.sort((a, b) => b.quantitySold - a.quantitySold || b.totalRevenue - a.totalRevenue);
        break;
      case 'least_ordered':
        list.sort((a, b) => a.quantitySold - b.quantitySold || a.totalRevenue - b.totalRevenue);
        break;
      case 'highest_revenue':
        list.sort((a, b) => b.totalRevenue - a.totalRevenue || b.quantitySold - a.quantitySold);
        break;
      case 'zero_orders':
        list = list.filter((st) => st.quantitySold === 0);
        break;
    }

    return list;
  }, [productStatsMap, selectedCategoryFilter, productSearch, rankingSort]);

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      addToast(isAr ? 'لا توجد بيانات للفترة المحددة لتصديرها' : 'No data in selected range to export', 'error');
      return;
    }

    const headers = isAr
      ? ['رقم الطلب', 'التاريخ والوقت', 'اسم العميل', 'الهاتف', 'نوع الطلب', 'مبيعات المنتجات الصافية', 'رسوم التوصيل', 'الإجمالي الكلي', 'الخصم']
      : ['Order ID', 'Date/Time', 'Customer', 'Phone', 'Type', 'Net Products Sales', 'Delivery Fee', 'Total', 'Discount'];

    const rows = filteredOrders.map((o) => {
      const net = getOrderProductsTotal(o);
      const fee = o.deliveryFee || 0;
      const tot = o.total || (net + fee);
      const disc = o.couponDiscount || 0;
      return [
        o.id,
        new Date(o.orderDate).toLocaleString(isAr ? 'ar-EG' : 'en-US'),
        o.customer?.name || '',
        o.customer?.phone || '',
        o.orderType === 'delivery' ? (isAr ? 'توصيل' : 'Delivery') : (isAr ? 'استلام' : 'Pickup'),
        net,
        fee,
        tot,
        disc,
      ];
    });

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(isAr ? 'تم تصدير تقرير المبيعات بنجاح' : 'Sales report exported successfully', 'success');
  };

  // Selected product report details
  const selectedProductStats = useMemo(() => {
    if (!selectedProductForReport) return null;
    return productStatsMap.get(selectedProductForReport.id) || null;
  }, [selectedProductForReport, productStatsMap]);

  return (
    <div className="space-y-6">
      {/* Header and Date Filter Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E51E2A] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'التقرير المالي وتحليلات الأصناف' : 'Financial & Product Analytics'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              <span>{isAr ? 'إجمالي المبيعات وترتيب المنتجات' : 'Sales & Product Popularity'}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {isAr
                ? 'احتساب دقيق لصافي مبيعات الطعام والوجبات بدون رسوم التوصيل، مع تقرير تفصيلي لترتيب الأصناف الأكثر والأقل طلباً.'
                : 'Accurate net sales tracking excluding delivery fees, with deep popularity rankings for all products.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start lg:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير التقرير المالي CSV' : 'Export Sales CSV'}</span>
          </button>
        </div>

        {/* Date Presets Selector */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 ml-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isAr ? 'الفترة الزمنية:' : 'Time Period:'}</span>
          </span>

          {[
            { id: 'today', ar: 'اليوم', en: 'Today' },
            { id: 'yesterday', ar: 'أمس', en: 'Yesterday' },
            { id: 'last7', ar: 'آخر 7 أيام', en: 'Last 7 Days' },
            { id: 'thisMonth', ar: 'هذا الشهر', en: 'This Month' },
            { id: 'lastMonth', ar: 'الشهر الماضي', en: 'Last Month' },
            { id: 'all', ar: 'كل الأوقات', en: 'All Time' },
            { id: 'custom', ar: 'فترة مخصصة 📅', en: 'Custom Date 📅' },
          ].map((preset) => {
            const isActive = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id as DatePreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E51E2A] text-white shadow-sm'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {isAr ? preset.ar : preset.en}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {datePreset === 'custom' && (
          <div className="pt-3 flex flex-wrap items-center gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-600">{isAr ? 'من تاريخ:' : 'From:'}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-600">{isAr ? 'إلى تاريخ:' : 'To:'}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A] cursor-pointer"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-[#E51E2A] hover:underline font-bold px-2 py-1"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Primary Financial KPI Cards (NET PRODUCT SALES vs DELIVERY FEES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Products Sales (EXCLUDING DELIVERY) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white border-2 border-emerald-500/30 p-5 rounded-3xl space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-emerald-800 text-xs font-bold">
            <span>{isAr ? 'صافي مبيعات المنتجات (بدون توصيل)' : 'Net Product Sales (No Delivery)'}</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-900 font-mono flex items-baseline gap-1.5 pt-1">
            <span>{salesMetrics.totalNetProductsSales.toLocaleString()}</span>
            <span className="text-xs text-emerald-700 font-sans font-bold">{isAr ? 'جنيه' : 'EGP'}</span>
          </div>
          <div className="text-[11px] text-emerald-700/90 font-medium flex items-center gap-1 pt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'قيمة الطعام والوجبات المباعة فقط' : 'Food & product sales only'}</span>
          </div>
        </div>

        {/* Delivery Fees Collected */}
        <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold">
            <span>{isAr ? 'رسوم التوصيل المحصلة' : 'Delivery Fees Collected'}</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5 pt-1">
            <span>{salesMetrics.totalDeliveryFees.toLocaleString()}</span>
            <span className="text-xs text-amber-600 font-sans font-bold">{isAr ? 'جنيه' : 'EGP'}</span>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 pt-1">
            <span>{salesMetrics.deliveryOrdersCount} {isAr ? 'طلب دليفري' : 'delivery orders'}</span>
            <span>•</span>
            <span>{isAr ? 'متوسط' : 'Avg'} {salesMetrics.avgDeliveryFee} {isAr ? 'ج' : 'EGP'}</span>
          </div>
        </div>

        {/* Orders Count in Period */}
        <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold">
            <span>{isAr ? 'عدد الطلبات في الفترة' : 'Completed Orders'}</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5 pt-1">
            <span>{salesMetrics.ordersCount}</span>
            <span className="text-xs text-zinc-500 font-sans font-medium">{isAr ? 'طلب' : 'orders'}</span>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <span className="text-blue-600 font-bold">{salesMetrics.deliveryOrdersCount} {isAr ? 'توصيل' : 'Delivery'}</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{salesMetrics.pickupOrdersCount} {isAr ? 'استلام فرع' : 'Pickup'}</span>
          </div>
        </div>

        {/* Average Basket Value (Without Delivery) */}
        <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold">
            <span>{isAr ? 'متوسط الفاتورة (بدون توصيل)' : 'Avg Basket (No Delivery)'}</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-zinc-900 font-mono flex items-baseline gap-1.5 pt-1">
            <span>{salesMetrics.avgBasketWithoutDelivery}</span>
            <span className="text-xs text-[#E51E2A] font-sans font-bold">{isAr ? 'جنيه / طلب' : 'EGP / order'}</span>
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            <span>{isAr ? 'الإجمالي الكلي شامل الدليفري:' : 'Gross with delivery:'}</span>{' '}
            <span className="font-bold text-zinc-900 font-mono">{salesMetrics.totalGrossRevenue.toLocaleString()} {isAr ? 'ج' : 'EGP'}</span>
          </div>
        </div>
      </div>

      {/* Product Popularity Ranking Section */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-zinc-900 font-heading tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#E51E2A]" />
              <span>{isAr ? 'ترتيب المنتجات حسب الطلب والمبيعات' : 'Product Popularity Ranking'}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isAr
                ? 'اضغط على أي صنف لعرض تقرير تفصيلي كامل بمبيعاته، الأحجام المطلوبة، الإضافات، وآخر الطلبات.'
                : 'Click any product to view an in-depth sales report with sizes, addons, and order history.'}
            </p>
          </div>

          {/* Ranking Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 p-1.5 rounded-2xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setRankingSort('most_ordered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingSort === 'most_ordered'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'الأكثر طلباً 🔥' : 'Most Ordered'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRankingSort('least_ordered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingSort === 'least_ordered'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{isAr ? 'الأقل طلباً 📉' : 'Least Ordered'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRankingSort('highest_revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingSort === 'highest_revenue'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'الأعلى إيراداً 💰' : 'Highest Revenue'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRankingSort('zero_orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingSort === 'zero_orders'
                  ? 'bg-rose-50 text-rose-700 shadow-sm font-black'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{isAr ? 'لم تُطلب إطلاقاً (0)' : 'Zero Orders'}</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={isAr ? 'ابحث باسم المنتج...' : 'Search product...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {isAr ? 'كافة التصنيفات' : 'All Categories'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[#E51E2A] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {isAr ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table / Cards */}
        {rankedProducts.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-zinc-50 border border-zinc-200">
            <Package className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-600">{isAr ? 'لا توجد منتجات تطابق الفلاتر المحددة' : 'No products match filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-bold">
                  <th className="pb-3 text-start">{isAr ? 'الترتيب' : 'Rank'}</th>
                  <th className="pb-3 text-start">{isAr ? 'المنتج' : 'Product'}</th>
                  <th className="pb-3 text-start">{isAr ? 'السعر الأساسي' : 'Base Price'}</th>
                  <th className="pb-3 text-center">{isAr ? 'الكمية المباعة' : 'Qty Sold'}</th>
                  <th className="pb-3 text-center">{isAr ? 'عدد الطلبات' : 'Orders'}</th>
                  <th className="pb-3 text-center">{isAr ? 'نسبة الظهور' : 'Order Rate'}</th>
                  <th className="pb-3 text-end">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</th>
                  <th className="pb-3 text-end">{isAr ? 'تقرير تفصيلي' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rankedProducts.map((st, index) => {
                  const rankNumber = index + 1;
                  const isTop3 = rankNumber <= 3 && st.quantitySold > 0 && rankingSort === 'most_ordered';
                  const isZero = st.quantitySold === 0;

                  return (
                    <tr
                      key={st.product.id}
                      onClick={() => setSelectedProductForReport(st.product)}
                      className={`hover:bg-rose-50/40 transition-colors cursor-pointer group ${
                        isZero ? 'opacity-70 bg-zinc-50/40' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <td className="py-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isTop3
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/50'
                              : isZero
                              ? 'bg-zinc-100 text-zinc-400'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {rankNumber}
                        </span>
                      </td>

                      {/* Product details */}
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={st.product.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100'}
                            alt={st.product.nameAr}
                            className="w-11 h-11 rounded-xl object-cover border border-zinc-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 group-hover:text-[#E51E2A] transition-colors block text-sm">
                              {isAr ? st.product.nameAr : st.product.nameEn}
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              {categories.find((c) => c.id === st.product.categoryId)?.[isAr ? 'nameAr' : 'nameEn'] || ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 font-mono font-bold text-zinc-700">
                        {st.product.price} {isAr ? 'ج' : 'EGP'}
                      </td>

                      {/* Quantity Sold */}
                      <td className="py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs inline-block ${
                            isZero
                              ? 'bg-zinc-100 text-zinc-400'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {st.quantitySold} {isAr ? 'قطعة' : 'units'}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 text-center font-mono text-zinc-700 font-semibold">
                        {st.ordersCount}
                      </td>

                      {/* Order Rate % */}
                      <td className="py-3 text-center">
                        <span className="font-mono text-zinc-600 font-medium">
                          {st.orderPercentage}%
                        </span>
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3 text-end font-mono font-black text-zinc-900 text-sm">
                        {st.totalRevenue.toLocaleString()} {isAr ? 'ج' : 'EGP'}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductForReport(st.product);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-[#E51E2A] hover:text-white text-zinc-700 text-[11px] font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>{isAr ? 'تقرير الصنف' : 'Report'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Sales Breakdown Table */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900 font-heading tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E51E2A]" />
                <span>{isAr ? 'التوزيع اليومي للمبيعات في الفترة' : 'Daily Sales Breakdown'}</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isAr ? 'مقارنة صافي مبيعات الطعام ورسوم التوصيل لكل يوم على حدة.' : 'Daily net food sales vs delivery fees collected.'}
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-xl">
              {dailyBreakdown.length} {isAr ? 'أيام مبيعات' : 'sales days'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-bold">
                  <th className="pb-2.5 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="pb-2.5 text-center">{isAr ? 'عدد الطلبات' : 'Orders Count'}</th>
                  <th className="pb-2.5 text-center">{isAr ? 'صافي مبيعات الطعام (بدون توصيل)' : 'Net Products Sales'}</th>
                  <th className="pb-2.5 text-center">{isAr ? 'رسوم التوصيل' : 'Delivery Fees'}</th>
                  <th className="pb-2.5 text-end">{isAr ? 'الإجمالي الكلي' : 'Gross Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {dailyBreakdown.map((row) => {
                  const gross = row.netSales + row.deliveryFees;
                  const dateFormatted = new Date(row.dateStr).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={row.dateStr} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-2.5 font-sans font-bold text-zinc-800">{dateFormatted}</td>
                      <td className="py-2.5 text-center font-bold text-zinc-700">{row.ordersCount}</td>
                      <td className="py-2.5 text-center font-black text-emerald-600">
                        {row.netSales.toLocaleString()} {isAr ? 'ج' : 'EGP'}
                      </td>
                      <td className="py-2.5 text-center font-bold text-amber-600">
                        {row.deliveryFees.toLocaleString()} {isAr ? 'ج' : 'EGP'}
                      </td>
                      <td className="py-2.5 text-end font-black text-zinc-900 text-sm">
                        {gross.toLocaleString()} {isAr ? 'ج' : 'EGP'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED PRODUCT REPORT MODAL */}
      {/* ========================================================================= */}
      {selectedProductForReport && selectedProductStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedProductForReport.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'}
                  alt={selectedProductForReport.nameAr}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#E51E2A] text-white text-[10px] font-bold">
                      {categories.find((c) => c.id === selectedProductForReport.categoryId)?.[isAr ? 'nameAr' : 'nameEn'] || ''}
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">
                      {isAr ? 'الفترة:' : 'Period:'} {dateRangeLabel}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-heading leading-tight">
                    {isAr ? selectedProductForReport.nameAr : selectedProductForReport.nameEn}
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono mt-1">
                    {isAr ? 'السعر الأساسي:' : 'Base Price:'} {selectedProductForReport.price} {isAr ? 'جنيه' : 'EGP'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductForReport(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 4 Performance Metric Cards for this item */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold block mb-1">
                    {isAr ? 'الكمية المباعة' : 'Units Sold'}
                  </span>
                  <span className="text-xl font-black text-zinc-900 font-mono">
                    {selectedProductStats.quantitySold}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{isAr ? 'قطعة' : 'units'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] text-emerald-700 font-bold block mb-1">
                    {isAr ? 'إجمالي المبيعات' : 'Total Revenue'}
                  </span>
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    {selectedProductStats.totalRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">{isAr ? 'جنيه' : 'EGP'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                  <span className="text-[10px] text-blue-700 font-bold block mb-1">
                    {isAr ? 'عدد الطلبات' : 'Orders Included'}
                  </span>
                  <span className="text-xl font-black text-blue-800 font-mono">
                    {selectedProductStats.ordersCount}
                  </span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">{isAr ? 'طلب' : 'orders'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-[10px] text-amber-700 font-bold block mb-1">
                    {isAr ? 'نسبة المساهمة' : 'Sales Share'}
                  </span>
                  <span className="text-xl font-black text-amber-800 font-mono">
                    {salesMetrics.totalNetProductsSales > 0
                      ? Math.round((selectedProductStats.totalRevenue / salesMetrics.totalNetProductsSales) * 100)
                      : 0}%
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">{isAr ? 'من إجمالي الطعام' : 'of net sales'}</span>
                </div>
              </div>

              {/* Sizes and Addons Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sizes breakdown */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E51E2A]" />
                    <span>{isAr ? 'الأحجام الأكثر طلباً' : 'Sizes Ordered'}</span>
                  </h4>
                  {Object.keys(selectedProductStats.sizeCounts).length === 0 ? (
                    <p className="text-[11px] text-zinc-400">{isAr ? 'حجم قياسي موحد (Standard)' : 'Standard size only'}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(selectedProductStats.sizeCounts).map(([sizeName, count]) => (
                        <div key={sizeName} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-zinc-200/70">
                          <span className="font-bold text-zinc-800">{sizeName}</span>
                          <span className="font-mono font-bold text-[#E51E2A]">{count} {isAr ? 'مرة' : 'times'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Addons breakdown */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'الإضافات المطلوبة مع الصنف' : 'Addons with this Item'}</span>
                  </h4>
                  {Object.keys(selectedProductStats.addonCounts).length === 0 ? (
                    <p className="text-[11px] text-zinc-400">{isAr ? 'لم تُطلب إضافات خاصة معه' : 'No addons requested'}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(selectedProductStats.addonCounts).map(([addonName, count]) => (
                        <div key={addonName} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-zinc-200/70">
                          <span className="font-bold text-zinc-800">{addonName}</span>
                          <span className="font-mono font-bold text-emerald-600">+{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Containing this Product */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{isAr ? 'آخر الطلبات التي تضمنت هذا الصنف' : 'Recent Orders with this Item'}</span>
                </h4>

                {selectedProductStats.recentOrders.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    {isAr ? 'لا توجد طلبات لهذا الصنف في الفترة المحددة.' : 'No orders for this product in selected period.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedProductStats.recentOrders.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-zinc-200/80"
                      >
                        <div>
                          <span className="font-mono font-bold text-zinc-800">#{rec.orderId.slice(-6)}</span>
                          <span className="text-zinc-400 text-[10px] mx-1.5">•</span>
                          <span className="text-zinc-700 font-medium">{rec.customerName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-zinc-500 text-[11px]">
                            {new Date(rec.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                          <span className="font-mono font-bold bg-rose-50 text-[#E51E2A] px-2 py-0.5 rounded-md">
                            x{rec.quantity} ({rec.itemTotal} {isAr ? 'ج' : 'EGP'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForReport(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق التقرير' : 'Close Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
