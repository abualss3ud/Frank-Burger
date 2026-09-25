import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BlacklistEntry, normalizePhone, toEnglishDigits } from '../types';
import {
  ShieldAlert,
  Search,
  UserX,
  Trash2,
  PhoneCall,
  MessageCircle,
  Copy,
  Plus,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

export function BlacklistManager() {
  const { blacklist, addToBlacklist, removeFromBlacklist, language, addToast } = useApp();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unblockConfirmId, setUnblockConfirmId] = useState<string | null>(null);

  // Add form fields
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('طلب وهمي ولم يستلم');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common quick reasons for blocking
  const commonReasons = [
    { ar: 'طلب وهمي ولم يستلم', en: 'Fake order / Never received' },
    { ar: 'رقم وهمي غير صحيح', en: 'Invalid / fake number' },
    { ar: 'إلغاء متكرر بعد تجهيز الطعام', en: 'Repeated cancellation after prep' },
    { ar: 'سلوك غير لائق مع الدليفري', en: 'Inappropriate behavior with rider' },
    { ar: 'طلب تجريبي غير جاد', en: 'Non-serious test order' },
    { ar: 'أخرى (اكتب السبب)', en: 'Other' },
  ];

  // Filter blacklist
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return blacklist;
    const normQ = normalizePhone(searchQuery) || toEnglishDigits(searchQuery).trim();
    return blacklist.filter(
      (entry) =>
        entry.phone.includes(q) ||
        (normQ && entry.phone.includes(normQ)) ||
        entry.normalizedPhone.includes(q) ||
        (normQ && entry.normalizedPhone.includes(normQ)) ||
        (entry.customerName && entry.customerName.toLowerCase().includes(q)) ||
        (entry.reason && entry.reason.toLowerCase().includes(q))
    );
  }, [blacklist, searchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(newPhone) || toEnglishDigits(newPhone).trim();
    if (!cleanPhone) {
      addToast(isAr ? 'يرجى إدخال رقم الهاتف' : 'Please enter phone number', 'error');
      return;
    }

    const finalReason = newReason === 'أخرى (اكتب السبب)' || newReason === 'Other'
      ? customReason.trim() || (isAr ? 'طلب وهمي' : 'Fake order')
      : newReason;

    setIsSubmitting(true);
    try {
      await addToBlacklist(cleanPhone, finalReason, newName);
      setNewPhone('');
      setNewName('');
      setNewReason('طلب وهمي ولم يستلم');
      setCustomReason('');
      setIsAddModalOpen(false);
    } catch {
      addToast(isAr ? 'حدث خطأ أثناء الحظر' : 'Error adding to blacklist', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    addToast(isAr ? 'تم نسخ الرقم للحافظة' : 'Copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>{isAr ? 'الأمان ومكافحة الطلبات الوهمية' : 'Fraud Prevention & Security'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading tracking-tight flex items-center gap-2">
              <UserX className="w-6 h-6 text-rose-600" />
              <span>{isAr ? 'القائمة السوداء (Blacklist)' : 'Blacklist & Blocked Numbers'}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {isAr
                ? 'الأرقام المسجلة هنا لن تتمكن من تأكيد أو إرسال أي طلبات جديدة من الموقع، لمنع الخسائر وحماية المطعم من الأوردرات الفيك.'
                : 'Blocked phone numbers cannot place or submit orders, preventing fake orders and financial loss.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold text-xs shadow-md shadow-[#E51E2A]/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حظر رقم جديد' : 'Block New Phone'}</span>
          </button>
        </div>

        {/* Search and Summary */}
        <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث برقم الهاتف، الاسم، أو سبب الحظر...' : 'Search phone, name, reason...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          <div className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {isAr
              ? `إجمالي الأرقام المحظورة: ${blacklist.length} رقم`
              : `Total Blocked: ${blacklist.length} numbers`}
          </div>
        </div>
      </div>

      {/* Blacklist Items Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm">
          <UserCheck className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">
            {searchQuery
              ? (isAr ? 'لا توجد أرقام تطابق البحث' : 'No numbers match your search')
              : (isAr ? 'لا توجد أرقام في القائمة السوداء حالياً' : 'No phone numbers currently blacklisted')}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? (isAr ? 'جرب البحث برقم آخر أو مسح حقل البحث.' : 'Try a different keyword or clear search.')
              : (isAr ? 'يمكنك حظر أي رقم يرسل طلبات وهمية بالنقر على "حظر رقم جديد" أو مباشرة من بطاقة أي طلب.' : 'You can block any fake order directly from orders or using the button above.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-rose-200/80 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 leading-tight">
                        {entry.customerName || (isAr ? 'زبون غير مسجل' : 'Guest Customer')}
                      </h4>
                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        🚫 {isAr ? 'محظور من الطلب' : 'Blocked from ordering'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUnblockConfirmId(entry.id)}
                    title={isAr ? 'إلغاء الحظر' : 'Unblock'}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Phone & Contact Actions */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">{isAr ? 'رقم الهاتف:' : 'Phone:'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-zinc-900" dir="ltr">
                        {entry.phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyPhone(entry.phone)}
                        title={isAr ? 'نسخ الرقم' : 'Copy'}
                        className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp and Call shortcuts */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60">
                    <a
                      href={`tel:${entry.phone}`}
                      className="flex-1 py-1 px-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-zinc-500" />
                      <span>{isAr ? 'اتصال' : 'Call'}</span>
                    </a>
                    <a
                      href={`https://wa.me/20${entry.phone.replace(/^0+/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Block Reason & Timestamp */}
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[11px]">{isAr ? 'سبب الحظر:' : 'Reason:'}</span>
                      <span className="text-[11px] font-medium leading-relaxed">{entry.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 px-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(entry.blockedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                    <span>{isAr ? 'بواسطة:' : 'By:'} {entry.blockedBy || 'Admin'}</span>
                  </div>
                </div>
              </div>

              {/* Unblock Confirmation Overlay */}
              {unblockConfirmId === entry.id && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900 mb-2">
                    {isAr
                      ? `هل تريد إلغاء الحظر عن الرقم ${entry.phone} والسماح له بالطلب مجدداً؟`
                      : `Unblock ${entry.phone} and allow ordering again?`}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setUnblockConfirmId(null)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
                    >
                      {isAr ? 'تراجع' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeFromBlacklist(entry.id);
                        setUnblockConfirmId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {isAr ? 'تأكيد إلغاء الحظر' : 'Confirm Unblock'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NUMBER TO BLACKLIST MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-900 to-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base font-heading">
                  {isAr ? 'إضافة رقم جديد للقائمة السوداء' : 'Block New Phone Number'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  {isAr ? 'رقم الهاتف المطلوب حظره' : 'Phone Number to Block'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(toEnglishDigits(e.target.value))}
                  placeholder="01012345678"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm text-zinc-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  {isAr ? 'اسم صاحب الرقم (إن وُجد)' : 'Customer Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isAr ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  {isAr ? 'سبب الحظر' : 'Block Reason'}
                </label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 bg-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {commonReasons.map((r, i) => (
                    <option key={i} value={isAr ? r.ar : r.en}>
                      {isAr ? r.ar : r.en}
                    </option>
                  ))}
                </select>
              </div>

              {(newReason === 'أخرى (اكتب السبب)' || newReason === 'Other') && (
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    {isAr ? 'تفاصيل سبب الحظر:' : 'Specify reason:'}
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={isAr ? 'اكتب ملاحظات الحظر...' : 'Notes about this block...'}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'تأثير الحظر المباشر:' : 'Immediate Effect:'}</span>
                </p>
                <span>
                  {isAr
                    ? 'بمجرد الحظر، سيتم منع هذا الرقم فوراً من تأكيد الطلب في صفحة الدفع وتنبيهه بأن رقمه مقيد.'
                    : 'Once blocked, this number will immediately be prevented from placing orders on checkout.'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  <span>{isSubmitting ? (isAr ? 'جاري الحظر...' : 'Blocking...') : (isAr ? 'حظر هذا الرقم الآن' : 'Block Number')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
