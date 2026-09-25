import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DeliveryZone } from '../types';
import {
  Bike,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Clock,
  DollarSign,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const DeliveryZonesManager: React.FC = () => {
  const {
    deliveryZones,
    addDeliveryZone,
    updateDeliveryZone,
    deleteDeliveryZone,
    resetDeliveryZones,
    addToast,
    settings,
    updateSettings,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  // Form state
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formFee, setFormFee] = useState<number | ''>(15);
  const [formMinOrder, setFormMinOrder] = useState<number | ''>(0);
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState('20-30 دقيقة');
  const [formIsActive, setFormIsActive] = useState(true);

  // Quick inline fee editing state
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditFee, setQuickEditFee] = useState<number | ''>('');

  // Filtered zones
  const filteredZones = deliveryZones.filter((z) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      z.nameAr.toLowerCase().includes(q) ||
      z.nameEn.toLowerCase().includes(q) ||
      z.fee.toString().includes(q)
    );
  });

  // Open modal for new zone
  const handleOpenAdd = () => {
    setEditingZone(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormFee(20);
    setFormMinOrder(0);
    setFormEstimatedMinutes('25-35 دقيقة');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing zone
  const handleOpenEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormNameAr(zone.nameAr);
    setFormNameEn(zone.nameEn);
    setFormFee(zone.fee);
    setFormMinOrder(zone.minOrder || 0);
    setFormEstimatedMinutes(zone.estimatedMinutes || '20-30 دقيقة');
    setFormIsActive(zone.isActive !== false);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAr.trim()) {
      addToast?.('يرجى كتابة اسم المنطقة بالعربية', 'error');
      return;
    }

    const feeNum = Number(formFee) || 0;
    const minOrderNum = Number(formMinOrder) || 0;

    if (editingZone) {
      updateDeliveryZone(editingZone.id, {
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim() || formNameAr.trim(),
        fee: feeNum,
        minOrder: minOrderNum,
        estimatedMinutes: formEstimatedMinutes.trim() || '25-35 دقيقة',
        isActive: formIsActive,
      });
      addToast?.(`تم تحديث منطقة "${formNameAr.trim()}" بنجاح`, 'success');
    } else {
      addDeliveryZone({
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim() || formNameAr.trim(),
        fee: feeNum,
        minOrder: minOrderNum,
        estimatedMinutes: formEstimatedMinutes.trim() || '25-35 دقيقة',
        isActive: formIsActive,
      });
      addToast?.(`تمت إضافة منطقة التوصيل "${formNameAr.trim()}" بسعر ${feeNum} ج.م بنجاح`, 'success');
    }

    setIsModalOpen(false);
  };

  // Quick fee save
  const handleQuickFeeSave = (zoneId: string) => {
    if (quickEditFee === '' || isNaN(Number(quickEditFee))) {
      setQuickEditId(null);
      return;
    }
    const newFee = Math.max(0, Number(quickEditFee));
    updateDeliveryZone(zoneId, { fee: newFee });
    addToast?.(`تم تحديث سعر التوصيل إلى ${newFee} ج.م`, 'success');
    setQuickEditId(null);
  };

  // Toggle active status
  const handleToggleActive = (zone: DeliveryZone) => {
    const newStatus = !(zone.isActive !== false);
    updateDeliveryZone(zone.id, { isActive: newStatus });
    addToast?.(
      newStatus
        ? `تم تفعيل استقبال طلبات التوصيل لمنطقة "${zone.nameAr}"`
        : `تم إيقاف التوصيل مؤقتاً لمنطقة "${zone.nameAr}"`,
      newStatus ? 'success' : 'info'
    );
  };

  // Delete zone
  const handleDelete = (zone: DeliveryZone) => {
    if (deliveryZones.length <= 1) {
      addToast?.('لا يمكن حذف جميع مناطق التوصيل، يجب الإبقاء على منطقة واحدة على الأقل', 'error');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف منطقة "${zone.nameAr}" نهائياً؟`)) {
      deleteDeliveryZone(zone.id);
      addToast?.(`تم حذف منطقة "${zone.nameAr}"`, 'info');
    }
  };

  // Reset to default zones
  const handleResetDefaults = () => {
    if (window.confirm('هل تريد استعادة قائمة مناطق التوصيل والأسعار الافتراضية لمدينة أسيوط؟')) {
      resetDeliveryZones();
      addToast?.('تمت استعادة مناطق التوصيل الافتراضية بنجاح', 'success');
    }
  };

  // Summary stats
  const totalCount = deliveryZones.length;
  const activeCount = deliveryZones.filter((z) => z.isActive !== false).length;
  const feesList = deliveryZones.map((z) => z.fee);
  const minFee = feesList.length > 0 ? Math.min(...feesList) : 0;
  const maxFee = feesList.length > 0 ? Math.max(...feesList) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E51E2A] flex items-center justify-center shadow-inner">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 font-heading flex items-center gap-2">
                <span>إدارة مناطق وأسعار خدمة التوصيل</span>
                <span className="text-[11px] bg-red-100 text-[#E51E2A] font-bold px-2 py-0.5 rounded-full font-mono">
                  {totalCount} مناطق
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                تعديل سعر خدمة التوصيل لكل حي ومنطقة، إضافة أماكن وأحياء جديدة، والتحكم في أوقات التوصيل والحد الأدنى.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-[#E51E2A] hover:bg-[#c41420] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#E51E2A]/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منطقة / حي جديد</span>
            </button>

            <button
              onClick={handleResetDefaults}
              title="استعادة المناطق والأسعار الافتراضية"
              className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">استعادة الافتراضي</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-[10px] text-zinc-500 block font-medium">إجمالي المناطق</span>
            <span className="text-lg font-black text-zinc-900 font-mono">{totalCount}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
            <span className="text-[10px] text-emerald-700 block font-medium">المناطق المتاحة للطلب</span>
            <span className="text-lg font-black text-emerald-700 font-mono">{activeCount}</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3">
            <span className="text-[10px] text-blue-700 block font-medium">أقل سعر توصيل</span>
            <span className="text-lg font-black text-blue-700 font-mono">
              {minFee} <span className="text-xs font-sans font-bold">ج.م</span>
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3">
            <span className="text-[10px] text-amber-800 block font-medium">أعلى سعر توصيل</span>
            <span className="text-lg font-black text-amber-800 font-mono">
              {maxFee} <span className="text-xs font-sans font-bold">ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* Free Delivery Threshold Setting */}
      <div className="bg-gradient-to-r from-red-50/50 via-zinc-50 to-white border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E51E2A]/10 text-[#E51E2A] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900">
              ميزة التوصيل المجاني للطلبات الكبيرة
            </h3>
            <p className="text-[11px] text-zinc-500">
              عند تجاوز الطلب هذا المبلغ، يتم احتساب التوصيل مجاناً للعميل تلقائياً في صفحة الدفع.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-bold text-zinc-700">الحد:</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={settings.freeDeliveryThreshold ?? 0}
              onChange={(e) => updateSettings({ freeDeliveryThreshold: Math.max(0, Number(e.target.value)) })}
              className="w-24 bg-white border border-zinc-200 rounded-xl py-1.5 px-2.5 text-xs text-zinc-900 font-mono font-bold outline-none focus:border-[#E51E2A] text-center"
            />
            <span className="absolute left-2 top-1.5 text-[10px] text-zinc-400 font-bold pointer-events-none">ج</span>
          </div>
        </div>
      </div>

      {/* Search & Zones Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الحي أو المنطقة..."
              className="w-full bg-white border border-zinc-200 rounded-xl py-2 pr-9 pl-3 text-xs text-zinc-900 outline-none focus:border-[#E51E2A] shadow-sm"
            />
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            عرض {filteredZones.length} من {totalCount}
          </span>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredZones.map((zone) => {
            const isActive = zone.isActive !== false;
            const isQuickEditing = quickEditId === zone.id;

            return (
              <div
                key={zone.id}
                className={`bg-white border rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between ${
                  isActive
                    ? 'border-zinc-200 hover:border-zinc-300'
                    : 'border-zinc-200/60 opacity-70 bg-zinc-50/50'
                }`}
              >
                <div>
                  {/* Top row: Name & Active badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-red-50 text-[#E51E2A]'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 font-heading">
                          {zone.nameAr}
                        </h4>
                        {zone.nameEn && (
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            {zone.nameEn}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(zone)}
                      title={isActive ? 'إيقاف المنطقة مؤقتاً' : 'تفعيل المنطقة'}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-200 text-zinc-600 font-bold px-2 py-0.5 rounded-full">
                          معطل
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Highlighted Delivery Fee Box */}
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600 font-bold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#E51E2A]" />
                        <span>سعر خدمة التوصيل:</span>
                      </span>

                      {isQuickEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={quickEditFee}
                            onChange={(e) =>
                              setQuickEditFee(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickFeeSave(zone.id);
                              if (e.key === 'Escape') setQuickEditId(null);
                            }}
                            className="w-16 bg-white border border-[#E51E2A] rounded-lg py-1 px-2 text-xs font-mono font-bold text-center text-zinc-900 outline-none"
                          />
                          <button
                            onClick={() => handleQuickFeeSave(zone.id)}
                            className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="حفظ"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setQuickEditId(null)}
                            className="p-1 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300 cursor-pointer"
                            title="إلغاء"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-[#E51E2A] font-mono">
                            {zone.fee} <span className="text-xs font-sans font-bold">ج.م</span>
                          </span>
                          <button
                            onClick={() => {
                              setQuickEditId(zone.id);
                              setQuickEditFee(zone.fee);
                            }}
                            title="تعديل سريع للسعر"
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info Meta */}
                  <div className="space-y-1.5 text-[11px] text-zinc-500 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>وقت التوصيل التقديري:</span>
                      </span>
                      <span className="font-semibold text-zinc-700">
                        {zone.estimatedMinutes || '20-30 دقيقة'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>الحد الأدنى للطلب:</span>
                      <span className="font-mono font-semibold text-zinc-700">
                        {zone.minOrder && zone.minOrder > 0
                          ? `${zone.minOrder} ج.م`
                          : 'بدون حد أدنى'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-100">
                  <button
                    onClick={() => handleOpenEdit(zone)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDelete(zone)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition-colors cursor-pointer"
                    title="حذف المنطقة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredZones.length === 0 && (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl p-6">
            <Bike className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-700 mb-1">لم يتم العثور على أي منطقة مطابقة</p>
            <p className="text-xs text-zinc-400 mb-4">جرب البحث بكلمة أخرى أو أضف حي / منطقة جديدة</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#E51E2A] text-white text-xs font-bold rounded-xl hover:bg-[#c41420] transition-colors cursor-pointer"
            >
              إضافة منطقة الآن
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DELIVERY ZONE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E51E2A] flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-zinc-900 font-heading">
                  {editingZone ? 'تعديل بيانات منطقة التوصيل' : 'إضافة منطقة / حي جديد للتوصيل'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name Ar */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  اسم المنطقة / الحي بالعربي *
                </label>
                <input
                  type="text"
                  required
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="مثال: حي الوليدية، نزلة عبد اللاه، المعلمين..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A] focus:bg-white"
                />
              </div>

              {/* Name En */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  اسم المنطقة بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="مثال: Walidya, Moalemeen..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono outline-none focus:border-[#E51E2A] focus:bg-white"
                />
              </div>

              {/* Fee & Min Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    سعر خدمة التوصيل (جنيه) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={formFee}
                      onChange={(e) =>
                        setFormFee(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="15"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono font-bold outline-none focus:border-[#E51E2A] focus:bg-white"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">ج.م</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    الحد الأدنى للطلب (جنيه)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formMinOrder}
                      onChange={(e) =>
                        setFormMinOrder(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 font-mono outline-none focus:border-[#E51E2A] focus:bg-white"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Time */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  وقت التوصيل المتوقع
                </label>
                <input
                  type="text"
                  value={formEstimatedMinutes}
                  onChange={(e) => setFormEstimatedMinutes(e.target.value)}
                  placeholder="مثال: 20-30 دقيقة، 30-45 دقيقة"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 outline-none focus:border-[#E51E2A] focus:bg-white"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <div>
                  <span className="font-bold text-zinc-800 block">تفعيل استقبال طلبات التوصيل</span>
                  <span className="text-[10px] text-zinc-500">
                    عند التعطيل، لن تظهر هذه المنطقة في خيارات التوصيل للعملاء.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 accent-[#E51E2A] rounded cursor-pointer"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E51E2A] hover:bg-[#c41420] text-white font-bold rounded-xl transition-all shadow-md shadow-[#E51E2A]/20 cursor-pointer"
                >
                  {editingZone ? 'حفظ التعديلات' : 'إضافة المنطقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
