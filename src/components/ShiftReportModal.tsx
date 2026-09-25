import React, { useRef } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  User,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Store,
  CreditCard,
  Banknote,
  FileText,
} from 'lucide-react';
import { CashierShift, Order } from '../types';

interface ShiftReportModalProps {
  shift: CashierShift;
  orders: Order[];
  onClose: () => void;
}

export const ShiftReportModal: React.FC<ShiftReportModalProps> = ({
  shift,
  orders,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Filter orders belonging to this shift
  const shiftOrders = orders.filter(
    (o) =>
      o.status !== 'cancelled' &&
      (o.shiftId === shift.id ||
        (shift.orderIds && shift.orderIds.includes(o.id)) ||
        (!o.shiftId &&
          new Date(o.orderDate).getTime() >= new Date(shift.startTime).getTime() &&
          (!shift.endTime || new Date(o.orderDate).getTime() <= new Date(shift.endTime).getTime())))
  );

  const totalSales = shift.totalSales || shiftOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cashSales = shift.cashSales || shiftOrders.filter((o) => o.paymentMethod === 'cash_on_delivery').reduce((sum, o) => sum + (o.total || 0), 0);
  const instapaySales = shift.instapaySales || shiftOrders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + (o.total || 0), 0);
  const ordersCount = shift.ordersCount || shiftOrders.length;
  const totalExpenses = shift.totalExpenses || (shift.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const expectedCashInDrawer = shift.expectedCashInDrawer || (shift.startingCash + cashSales - totalExpenses);
  const actualCashInDrawer = shift.actualCashInDrawer !== undefined ? shift.actualCashInDrawer : expectedCashInDrawer;
  const difference = shift.difference !== undefined ? shift.difference : (actualCashInDrawer - expectedCashInDrawer);

  const calculateDuration = (start: string, end?: string) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const diffMs = e - s;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة و ${mins} دقيقة`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 text-start font-sans">
      {/* Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E51E2A]/10 text-[#E51E2A] flex items-center justify-center font-black">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-zinc-900">
                  {shift.status === 'closed' ? 'تقرير تقفيل وتسليم الوردية (Z-Report)' : 'تقرير الوردية اللحظي (X-Report)'}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    shift.status === 'closed'
                      ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {shift.status === 'closed' ? 'وردية مغلقة' : 'وردية نشطة حالياً'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono">معرف الوردية: {shift.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإيصال</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Content */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-6 print:p-0 print:m-0 print:text-black">
          {/* Restaurant & Receipt Header */}
          <div className="text-center pb-5 border-b border-dashed border-zinc-200 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-700 mb-1">
              <Store className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span>مطعم فرانك برجر - Frank Burger</span>
            </div>
            <h2 className="text-lg font-black text-zinc-900">
              {shift.status === 'closed' ? 'إيصال تسليم وتقفيل وردية الكاشير' : 'كشف مبيعات الوردية النشطة'}
            </h2>
            <p className="text-xs text-zinc-500">
              {shift.branchNameAr || 'الفرع الرئيسي'} | رقم الوردية: <span className="font-mono font-bold text-zinc-800">{shift.id}</span>
            </p>
          </div>

          {/* Handover & Cashier Info Chain */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-zinc-800 flex items-center gap-2 border-b border-zinc-200 pb-2">
              <ArrowRightLeft className="w-4 h-4 text-[#E51E2A]" />
              <span>سلسلة الاستلام والتسليم (كاشير الوردية)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-zinc-200/80">
                <span className="text-[11px] text-zinc-500 block mb-0.5">استلم الوردية من:</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  {shift.handedOverFromCashierName || 'كاشير الوردية السابقة'}
                </span>
              </div>

              <div className="bg-red-50/50 p-3 rounded-xl border border-red-200/60">
                <span className="text-[11px] text-[#E51E2A] font-bold block mb-0.5">كاشير الوردية الحالي:</span>
                <span className="font-black text-zinc-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E51E2A]" />
                  {shift.cashierName}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-zinc-200/80">
                <span className="text-[11px] text-zinc-500 block mb-0.5">سلّم الوردية إلى:</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  {shift.handedOverToCashierName || (shift.status === 'active' ? 'قيد العمل (لم تُسلّم)' : 'الكاشير المستلم')}
                </span>
              </div>
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>البداية: </span>
                <span className="font-mono font-semibold text-zinc-800">
                  {new Date(shift.startTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>النهاية: </span>
                <span className="font-mono font-semibold text-zinc-800">
                  {shift.endTime
                    ? new Date(shift.endTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                    : 'الآن (مستمرة)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                <span>المدة: </span>
                <span className="font-bold text-zinc-800">{calculateDuration(shift.startTime, shift.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] text-zinc-500 block">عدد الأوردرات</span>
              <span className="text-xl font-black text-zinc-900 font-mono mt-0.5 block">{ordersCount}</span>
              <span className="text-[10px] text-zinc-400">طلب مكتمل</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] text-emerald-700 font-medium block">مبيعات الكاش</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{cashSales}</span>
              <span className="text-[10px] text-emerald-600">جنيه مصري</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] text-blue-700 font-medium block">مبيعات إنستاباي</span>
              <span className="text-xl font-black text-blue-700 font-mono mt-0.5 block">{instapaySales}</span>
              <span className="text-[10px] text-blue-600">جنيه مصري</span>
            </div>

            <div className="bg-zinc-900 text-white rounded-2xl p-3.5 text-center shadow-md">
              <span className="text-[11px] text-zinc-400 block">إجمالي المبيعات</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">{totalSales}</span>
              <span className="text-[10px] text-zinc-400">ج.م بالوردية</span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#E51E2A]" />
                <span>البيان المالي وتسوية الدرج (Cash Drawer Settlement)</span>
              </h4>
            </div>

            <div className="divide-y divide-zinc-100 text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-zinc-400" />
                  <span>الرصيد الافتتاحي (عهدة استلام الدرج)</span>
                </span>
                <span className="font-bold text-zinc-900 font-mono text-sm">+{shift.startingCash} ج.م</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>إجمالي المقبوضات النقدية (مبيعات الكاش)</span>
                </span>
                <span className="font-bold text-emerald-700 font-mono text-sm">+{cashSales} ج.م</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between bg-zinc-50/50">
                <span className="text-zinc-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>مبيعات إنستاباي والدفع الإلكتروني (غير موجودة بالدرج)</span>
                </span>
                <span className="font-bold text-blue-700 font-mono text-sm">{instapaySales} ج.م</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>إجمالي المصروفات والسحوبات من الدرج</span>
                </span>
                <span className="font-bold text-rose-600 font-mono text-sm">-{totalExpenses} ج.م</span>
              </div>

              {/* Expected in Drawer */}
              <div className="px-4 py-3 bg-zinc-100/70 flex items-center justify-between font-bold">
                <span className="text-zinc-800">النقدية المتوقع وجودها بالدرج (العهدة + الكاش - المصروفات)</span>
                <span className="font-mono text-base text-zinc-900 font-black">{expectedCashInDrawer} ج.م</span>
              </div>

              {/* Actual in Drawer */}
              {shift.status === 'closed' && (
                <>
                  <div className="px-4 py-3 bg-white flex items-center justify-between font-bold">
                    <span className="text-zinc-800">النقدية الفعلية المعدودة بالدرج عند التسليم</span>
                    <span className="font-mono text-base text-zinc-900 font-black">{actualCashInDrawer} ج.م</span>
                  </div>

                  {/* Difference Status */}
                  <div
                    className={`px-4 py-3.5 flex items-center justify-between font-black ${
                      difference === 0
                        ? 'bg-emerald-50 text-emerald-800 border-t border-emerald-200'
                        : difference > 0
                        ? 'bg-blue-50 text-blue-800 border-t border-blue-200'
                        : 'bg-rose-50 text-rose-800 border-t border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {difference === 0 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>الدرج مطابق تماماً (لا يوجد عجز أو زيادة)</span>
                        </>
                      ) : difference > 0 ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span>يوجد زيادة في الدرج (فائض نقدي)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                          <span>يوجد عجز في الدرج (نقص نقدي)</span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-lg">
                      {difference > 0 ? `+${difference}` : difference} ج.م
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Expenses List if any */}
          {shift.expenses && shift.expenses.length > 0 && (
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 space-y-2.5">
              <h5 className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>سجل المصروفات والسحوبات أثناء الوردية ({shift.expenses.length})</span>
              </h5>
              <div className="space-y-1.5">
                {shift.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-zinc-200/70"
                  >
                    <div>
                      <span className="font-bold text-zinc-800">{exp.reason}</span>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>بواسطة: {exp.createdBy}</span>
                        <span>•</span>
                        <span>{new Date(exp.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="font-black text-rose-600 font-mono">-{exp.amount} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes if any */}
          {shift.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <span className="font-bold block">ملاحظات الكاشير والتسليم:</span>
              <p className="text-amber-800">{shift.notes}</p>
            </div>
          )}

          {/* Signatures Area for Printing / Archiving */}
          <div className="pt-4 border-t border-dashed border-zinc-200 grid grid-cols-3 gap-4 text-center text-xs text-zinc-600">
            <div className="space-y-6">
              <span className="font-bold block">توقيع الكاشير المسلِّم:</span>
              <div className="border-b border-zinc-300 w-3/4 mx-auto pb-1 text-[11px] text-zinc-400 font-mono">
                {shift.cashierName}
              </div>
            </div>
            <div className="space-y-6">
              <span className="font-bold block">توقيع الكاشير المستلِم:</span>
              <div className="border-b border-zinc-300 w-3/4 mx-auto pb-1 text-[11px] text-zinc-400 font-mono">
                {shift.handedOverToCashierName || '________________'}
              </div>
            </div>
            <div className="space-y-6">
              <span className="font-bold block">اعتماد مدير الصالة:</span>
              <div className="border-b border-zinc-300 w-3/4 mx-auto pb-1 text-[11px] text-zinc-400 font-mono">
                ________________
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#E51E2A] hover:bg-[#c01823] text-white text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#E51E2A]/20"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال الحراري</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
