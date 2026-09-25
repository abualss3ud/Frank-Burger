import React, { useState } from 'react';
import {
  Clock,
  User,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Store,
  CreditCard,
  Banknote,
  FileText,
  Calendar,
  Search,
  Filter,
  Eye,
  Printer,
  Sparkles,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CashierShift } from '../types';
import { ShiftReportModal } from './ShiftReportModal';

export const ShiftManagementView: React.FC = () => {
  const {
    shifts,
    activeShift,
    openShift,
    closeShift,
    addShiftExpense,
    orders,
    adminUser,
    branches,
  } = useApp();

  const isSuperAdmin = adminUser?.role === 'super_admin';

  // Modals state
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [viewingShiftReport, setViewingShiftReport] = useState<CashierShift | null>(null);

  // Search & Filters in Archive
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifference, setFilterDifference] = useState<'all' | 'exact' | 'deficit' | 'surplus'>('all');

  // Form: Open Shift
  const previousClosedShift = shifts.find((s) => s.status === 'closed');
  const [openForm, setOpenForm] = useState({
    cashierName: adminUser?.name || 'كاشير الصالة',
    handedOverFromCashierName: previousClosedShift?.cashierName || 'كاشير الوردية السابقة',
    startingCash: 500,
    branchId: branches[0]?.id || 'branch-1',
    branchNameAr: branches[0]?.nameAr || 'الفرع الرئيسي',
    notes: '',
  });

  // Form: Close Shift
  const [closeForm, setCloseForm] = useState({
    handedOverToCashierName: '',
    actualCashInDrawer: activeShift ? activeShift.expectedCashInDrawer : 0,
    notes: '',
  });

  // Form: Add Expense
  const [expenseForm, setExpenseForm] = useState({
    amount: 50,
    reason: '',
  });

  const handleStartOpenShift = () => {
    setOpenForm({
      cashierName: adminUser?.name || 'كاشير الصالة',
      handedOverFromCashierName: previousClosedShift?.cashierName || 'كاشير الوردية السابقة',
      startingCash: 500,
      branchId: branches[0]?.id || 'branch-1',
      branchNameAr: branches[0]?.nameAr || 'الفرع الرئيسي',
      notes: '',
    });
    setIsOpenShiftModalOpen(true);
  };

  const handleConfirmOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.cashierName.trim()) return;

    openShift({
      cashierName: openForm.cashierName.trim(),
      cashierId: adminUser?.id || 'cashier-1',
      handedOverFromCashierName: openForm.handedOverFromCashierName.trim(),
      startingCash: Number(openForm.startingCash) || 0,
      branchId: openForm.branchId,
      branchNameAr: branches.find((b) => b.id === openForm.branchId)?.nameAr || openForm.branchNameAr,
      notes: openForm.notes.trim(),
    });

    setIsOpenShiftModalOpen(false);
  };

  const handleStartCloseShift = () => {
    if (!activeShift) return;
    setCloseForm({
      handedOverToCashierName: '',
      actualCashInDrawer: activeShift.expectedCashInDrawer,
      notes: '',
    });
    setIsCloseShiftModalOpen(true);
  };

  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const closed = closeShift(activeShift.id, {
      actualCashInDrawer: Number(closeForm.actualCashInDrawer) || 0,
      handedOverToCashierName: closeForm.handedOverToCashierName.trim() || 'الكاشير المستلم',
      notes: closeForm.notes.trim(),
    });

    setIsCloseShiftModalOpen(false);
    if (closed) {
      setViewingShiftReport(closed);
    }
  };

  const handleConfirmAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !expenseForm.reason.trim() || Number(expenseForm.amount) <= 0) return;

    addShiftExpense(activeShift.id, {
      amount: Number(expenseForm.amount),
      reason: expenseForm.reason.trim(),
      createdBy: adminUser?.name || 'الكاشير',
    });

    setExpenseForm({ amount: 50, reason: '' });
    setIsExpenseModalOpen(false);
  };

  // Filtered Archive
  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.handedOverFromCashierName && s.handedOverFromCashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.handedOverToCashierName && s.handedOverToCashierName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterDifference === 'exact') return s.difference === 0;
    if (filterDifference === 'deficit') return (s.difference || 0) < 0;
    if (filterDifference === 'surplus') return (s.difference || 0) > 0;

    return true;
  });

  // Calculate live duration
  const getDurationString = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة و ${mins} دقيقة`;
  };

  return (
    <div dir="rtl" className="space-y-6 text-start font-sans">
      {/* Top Banner / Status Overview */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                activeShift
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {activeShift ? <Unlock className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg text-zinc-900">نظام إدارة الورديات وتسليم الكاشير</h3>
                {activeShift ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>وردية نشطة ومفتوحة</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>لا توجد وردية مفتوحة حالياً</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                تتبع مبيعات الكاش وإنستاباي، الرصيد الافتتاحي بالدرج، المصروفات، وتسوية العجز أو الزيادة عند التسليم
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeShift ? (
              <>
                {!isSuperAdmin && (
                  <>
                    <button
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>سحب مبلغ / مصروف</span>
                    </button>
                    <button
                      onClick={handleStartCloseShift}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>تقفيل الوردية للتسليم</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingShiftReport(activeShift)}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>تقرير الوردية اللحظي</span>
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      {/* Active Shift Dashboard (If Active) */}
      {activeShift ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 space-y-6">
          {/* Active Shift Header details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E51E2A]/10 text-[#E51E2A] border border-[#E51E2A]/20 flex items-center justify-center font-black text-sm shrink-0">
                POS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-bold">كاشير الوردية الحالي:</span>
                  <span className="font-black text-sm text-zinc-900">{activeShift.cashierName}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Store className="w-3 h-3 text-zinc-400" />
                    <span>{activeShift.branchNameAr || 'الفرع الرئيسي'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>مستمرة منذ: {getDurationString(activeShift.startTime)}</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono text-zinc-400">#{activeShift.id}</span>
                </div>
              </div>
            </div>

            {/* Handover Source Pill */}
            <div className="bg-zinc-50 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span className="text-zinc-500">استلم الوردية من:</span>
              <span className="font-bold text-zinc-900">{activeShift.handedOverFromCashierName || 'كاشير سابق'}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Starting Cash (العهدة) */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-xs font-bold">عهدة الاستلام الافتتاحية</span>
                <Banknote className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-black text-zinc-900 font-mono">{activeShift.startingCash} <span className="text-xs font-normal text-zinc-500">ج.م</span></div>
              <span className="text-[10px] text-zinc-400 block mt-1">الرصيد النقدي بالدرج عند البدء</span>
            </div>

            {/* Cash Sales (مبيعات الكاش) */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-bold">مبيعات الكاش بالوردية</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">+{activeShift.cashSales} <span className="text-xs font-normal text-emerald-600">ج.م</span></div>
              <span className="text-[10px] text-emerald-600/90 block mt-1">المقبوضات النقدية داخل الدرج</span>
            </div>

            {/* InstaPay Sales (إنستاباي) */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-xs font-bold">مبيعات إنستاباي</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono">{activeShift.instapaySales} <span className="text-xs font-normal text-blue-600">ج.م</span></div>
              <span className="text-[10px] text-blue-600/90 block mt-1">تحويلات بنكية وإلكترونية</span>
            </div>

            {/* Expenses (المصروفات) */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-xs font-bold">المصروفات والسحوبات</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">-{activeShift.totalExpenses} <span className="text-xs font-normal text-rose-600">ج.م</span></div>
              <span className="text-[10px] text-rose-600/90 block mt-1">{activeShift.expenses?.length || 0} بنود منصرفة من الدرج</span>
            </div>

            {/* Expected Cash in Drawer (المتوقع بالدرج) */}
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-[#E51E2A] mb-1">
                <span className="text-xs font-black">المتوقع تواجده بالدرج</span>
                <Sparkles className="w-4 h-4 text-[#E51E2A]" />
              </div>
              <div className="text-2xl font-black text-[#E51E2A] font-mono">{activeShift.expectedCashInDrawer} <span className="text-xs font-normal text-[#E51E2A]/70">ج.م</span></div>
              <span className="text-[10px] text-[#E51E2A]/80 block mt-1">العهدة + الكاش - المصروفات</span>
            </div>
          </div>

          {/* Recent Shift Expenses quick list */}
          {activeShift.expenses && activeShift.expenses.length > 0 && (
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>المصروفات المسجلة بهذه الوردية:</span>
                </span>
                <span className="text-xs font-mono text-rose-600 font-bold">
                  إجمالي المصروفات: {activeShift.totalExpenses} ج.م
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {activeShift.expenses.map((exp) => (
                  <div key={exp.id} className="bg-white p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-bold text-zinc-800 block">{exp.reason}</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(exp.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {exp.createdBy}
                      </span>
                    </div>
                    <span className="font-mono font-black text-rose-600">-{exp.amount} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State when no shift is open */
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-black text-base text-zinc-900">لم يتم فتح أي وردية كاشير بعد</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              لبدء تسجيل الطلبات وحساب مبيعات اليوم واستلام عهدة الدرج، يرجى فتح وردية جديدة وتحديد اسم الكاشير ومبلغ العهدة.
            </p>
          </div>
          {!isSuperAdmin && (
            <button
              onClick={handleStartOpenShift}
              className="px-6 py-3 rounded-2xl bg-[#E51E2A] hover:bg-[#c01823] text-white text-xs font-black inline-flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#E51E2A]/20"
            >
              <Plus className="w-4 h-4" />
              <span>فتح وردية جديدة الآن</span>
            </button>
          )}
        </div>
      )}

      {/* Shifts History & Archive Section */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
          <div>
            <h4 className="font-black text-base text-zinc-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#E51E2A]" />
              <span>سجل وأرشيف الورديات السابقة ({shifts.length})</span>
            </h4>
            <p className="text-xs text-zinc-500">
              استعراض كافة الورديات المغلقة، تفاصيل التسليم، كشف العجز والزيادة، وإعادة طباعة تقرير الوردية (Z-Report)
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث برقم الوردية أو الكاشير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-8 pe-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#E51E2A]"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterDifference('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterDifference === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterDifference('exact')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterDifference === 'exact' ? 'bg-emerald-500 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                مطابق
              </button>
              <button
                onClick={() => setFilterDifference('deficit')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterDifference === 'deficit' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                يوجد عجز
              </button>
              <button
                onClick={() => setFilterDifference('surplus')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterDifference === 'surplus' ? 'bg-blue-500 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                يوجد زيادة
              </button>
            </div>
          </div>
        </div>

        {/* Shifts Table */}
        {filteredShifts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-bold">
                  <th className="p-3 text-start">رقم الوردية</th>
                  <th className="p-3 text-start">الكاشير المسلِّم</th>
                  <th className="p-3 text-start">استلم من / سلّم إلى</th>
                  <th className="p-3 text-start">وقت الوردية</th>
                  <th className="p-3 text-center">الطلبات</th>
                  <th className="p-3 text-start">إجمالي المبيعات</th>
                  <th className="p-3 text-start">الدرج (المتوقع / الفعلي)</th>
                  <th className="p-3 text-center">حالة التسوية</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredShifts.map((shiftItem) => {
                  const isCurActive = shiftItem.status === 'active';
                  const diff = shiftItem.difference || 0;

                  return (
                    <tr key={shiftItem.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* ID */}
                      <td className="p-3 font-mono font-bold text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isCurActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-300'}`} />
                          <span>{shiftItem.id}</span>
                        </div>
                      </td>

                      {/* Cashier */}
                      <td className="p-3">
                        <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{shiftItem.cashierName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{shiftItem.branchNameAr || 'الفرع الرئيسي'}</span>
                      </td>

                      {/* Handover Chain */}
                      <td className="p-3 text-zinc-600">
                        <div className="text-[11px]">
                          <span className="text-zinc-400">استلم من: </span>
                          <span className="font-semibold text-zinc-800">{shiftItem.handedOverFromCashierName || 'كاشير سابق'}</span>
                        </div>
                        {shiftItem.handedOverToCashierName && (
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            <span className="text-zinc-400">سلّم إلى: </span>
                            <span className="font-semibold text-zinc-800">{shiftItem.handedOverToCashierName}</span>
                          </div>
                        )}
                      </td>

                      {/* Time */}
                      <td className="p-3 text-zinc-600 text-[11px]">
                        <div className="font-mono">
                          {new Date(shiftItem.startTime).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}{' '}
                          {new Date(shiftItem.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {isCurActive ? 'مستمرة حتى الآن' : shiftItem.endTime ? `حتى ${new Date(shiftItem.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="p-3 text-center font-mono font-bold text-zinc-800">
                        <span className="px-2 py-0.5 bg-zinc-100 rounded-md">
                          {shiftItem.ordersCount || 0}
                        </span>
                      </td>

                      {/* Sales */}
                      <td className="p-3">
                        <div className="font-black text-zinc-900 font-mono text-xs">
                          {shiftItem.totalSales || 0} ج.م
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-emerald-600">كاش: {shiftItem.cashSales || 0}</span>
                          <span>•</span>
                          <span className="text-blue-600">إنستا: {shiftItem.instapaySales || 0}</span>
                        </div>
                      </td>

                      {/* Drawer */}
                      <td className="p-3 text-xs font-mono">
                        <div className="text-zinc-600">
                          متوقع: <span className="font-bold text-zinc-800">{shiftItem.expectedCashInDrawer || 0} ج.م</span>
                        </div>
                        {!isCurActive && shiftItem.actualCashInDrawer !== undefined && (
                          <div className="text-[11px] text-zinc-500">
                            فعلي: <span className="font-bold text-zinc-900">{shiftItem.actualCashInDrawer} ج.م</span>
                          </div>
                        )}
                      </td>

                      {/* Settlement Status */}
                      <td className="p-3 text-center">
                        {isCurActive ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black">
                            نشطة حالياً
                          </span>
                        ) : diff === 0 ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مطابق (0)</span>
                          </span>
                        ) : diff > 0 ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>زيادة +{diff} ج.م</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>عجز {diff} ج.م</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingShiftReport(shiftItem)}
                          title="معاينة وطباعة تقرير الوردية"
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#E51E2A] text-zinc-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400 text-xs">
            لا توجد أي سجلات ورديات مطابقة لخيارات البحث الحالية
          </div>
        )}
      </div>

      {/* Modal: Open New Shift */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E51E2A]/10 text-[#E51E2A] flex items-center justify-center font-black">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-900">فتح وردية كاشير جديدة</h3>
                  <p className="text-xs text-zinc-500">تسجيل استلام الوردية ورصيد العهدة الافتتاحي</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmOpenShift} className="p-6 space-y-4 text-xs">
              {/* Cashier Name */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E51E2A]" />
                  <span>اسم الكاشير المستلم للوردية:</span>
                </label>
                <input
                  type="text"
                  required
                  value={openForm.cashierName}
                  onChange={(e) => setOpenForm({ ...openForm, cashierName: e.target.value })}
                  placeholder="أدخل اسم الكاشير..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-zinc-50 font-bold text-zinc-900"
                />
              </div>

              {/* Handed Over From */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-500" />
                  <span>استلمت الوردية والدرج من الكاشير:</span>
                </label>
                <input
                  type="text"
                  required
                  value={openForm.handedOverFromCashierName}
                  onChange={(e) => setOpenForm({ ...openForm, handedOverFromCashierName: e.target.value })}
                  placeholder="اسم الكاشير السابق المسلِّم..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white text-zinc-800"
                />
              </div>

              {/* Starting Cash (عهدة الدرج) */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مبلغ العهدة الافتتاحي بالدرج (ج.م):</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={openForm.startingCash}
                    onChange={(e) => setOpenForm({ ...openForm, startingCash: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white font-mono font-black text-sm text-zinc-900"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">ج.م</span>
                </div>
                <p className="text-[10px] text-zinc-400">المبلغ النقدي الفكة الموجود بالدرج لحظة الاستلام</p>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-zinc-500" />
                  <span>الفرع:</span>
                </label>
                <select
                  value={openForm.branchId}
                  onChange={(e) => {
                    const sel = branches.find((b) => b.id === e.target.value);
                    setOpenForm({
                      ...openForm,
                      branchId: e.target.value,
                      branchNameAr: sel?.nameAr || 'الفرع الرئيسي',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white text-zinc-800 font-semibold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">ملاحظات افتتاحية (اختياري):</label>
                <textarea
                  rows={2}
                  value={openForm.notes}
                  onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                  placeholder="أي ملاحظات حول حالة الدرج أو الفرع..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white text-zinc-800 text-xs"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#E51E2A] hover:bg-[#c01823] text-white font-black text-xs transition-colors cursor-pointer shadow-md shadow-[#E51E2A]/20"
                >
                  تأكيد فتح الوردية واستلام العهدة
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close & Handover Shift */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-900">تقفيل وتسليم وردية الكاشير (Z-Report)</h3>
                  <p className="text-xs text-zinc-500">حساب المبيعات وتسوية عجز/زيادة النقدية بالدرج</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmCloseShift} className="p-6 space-y-4 text-xs">
              {/* Financial Quick Breakdown Summary */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>الرصيد الافتتاحي (العهدة):</span>
                  <span className="font-mono font-bold text-zinc-900">+{activeShift.startingCash} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>إجمالي مبيعات الكاش بالوردية:</span>
                  <span className="font-mono font-bold text-emerald-700">+{activeShift.cashSales} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>مبيعات إنستاباي (إلكتروني):</span>
                  <span className="font-mono font-bold text-blue-700">{activeShift.instapaySales} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>المصروفات والسحوبات من الدرج:</span>
                  <span className="font-mono font-bold text-rose-600">-{activeShift.totalExpenses} ج.م</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between font-black text-sm text-zinc-900">
                  <span>المبلغ النقدي المتوقع بالدرج:</span>
                  <span className="font-mono text-base text-[#E51E2A]">{activeShift.expectedCashInDrawer} ج.م</span>
                </div>
              </div>

              {/* Handed Over To Name */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>اسم الكاشير المستلم الجديد (سلّمت لمين؟):</span>
                </label>
                <input
                  type="text"
                  required
                  value={closeForm.handedOverToCashierName}
                  onChange={(e) => setCloseForm({ ...closeForm, handedOverToCashierName: e.target.value })}
                  placeholder="أدخل اسم الكاشير المستلم..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white font-bold text-zinc-900"
                />
              </div>

              {/* Actual Counted Cash In Drawer */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>المبلغ الفعلي المعدود في الدرج الآن (ج.م):</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={closeForm.actualCashInDrawer}
                    onChange={(e) => setCloseForm({ ...closeForm, actualCashInDrawer: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white font-mono font-black text-base text-zinc-900"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">ج.م</span>
                </div>
              </div>

              {/* Live Difference Calculator */}
              {(() => {
                const diff = Number(closeForm.actualCashInDrawer || 0) - activeShift.expectedCashInDrawer;
                return (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between font-black text-xs ${
                      diff === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : diff > 0
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {diff === 0 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>الدرج مطابق تماماً</span>
                        </>
                      ) : diff > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span>يوجد زيادة في الدرج</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>يوجد عجز في الدرج</span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-sm font-black">
                      {diff > 0 ? `+${diff}` : diff} ج.م
                    </span>
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">ملاحظات التسليم والإغلاق:</label>
                <textarea
                  rows={2}
                  value={closeForm.notes}
                  onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                  placeholder="ملاحظات حول سبب العجز أو الزيادة أو أي تفاصيل خاصة..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white text-zinc-800 text-xs"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-black text-xs transition-colors cursor-pointer shadow-md"
                >
                  تأكيد تقفيل الوردية وطباعة التقرير
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Shift Expense */}
      {isExpenseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-900">تسجيل سحب / مصروف من الدرج</h3>
                  <p className="text-xs text-zinc-500">خصم مبلغ نقدي من الدرج مع ذكر السبب</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmAddExpense} className="p-6 space-y-4 text-xs">
              {/* Amount */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">المبلغ المنصرف من الدرج (ج.م):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white font-mono font-black text-base text-zinc-900"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">ج.م</span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">سبب الصرف / البند:</label>
                <input
                  type="text"
                  required
                  value={expenseForm.reason}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                  placeholder="مثال: شراء طماطم، بونات نظافة، تصليح سريع..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-[#E51E2A] bg-white text-zinc-900 font-semibold"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                >
                  تسجيل وخصم من الدرج
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Report Modal */}
      {viewingShiftReport && (
        <ShiftReportModal
          shift={viewingShiftReport}
          orders={orders}
          onClose={() => setViewingShiftReport(null)}
        />
      )}
    </div>
  );
};
