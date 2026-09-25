import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Link as LinkIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  Play,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import {
  subscribePixelLogs,
  PixelEventLog,
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  cleanPixelId,
  initMetaPixel,
} from '../lib/pixel';

export const PixelTrackerSettings: React.FC = () => {
  const { settings, updateSettings, language, addToast } = useApp();
  const [logs, setLogs] = useState<PixelEventLog[]>([]);
  const isAr = language === 'ar';

  useEffect(() => {
    const unsubscribe = subscribePixelLogs((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const handleTestEvent = (type: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase') => {
    // Ensure Meta pixel is initialized with current settings
    if (settings.facebookPixelId) {
      initMetaPixel(settings.facebookPixelId, settings.facebookTestEventCode, settings.facebookCapiAccessToken);
    }

    switch (type) {
      case 'PageView':
        trackPageView('Menu');
        addToast(isAr ? 'تم إرسال حدث PageView بنجاح!' : 'PageView event sent!', 'success');
        break;
      case 'ViewContent':
        trackViewContent({
          id: 'prod-test-101',
          nameAr: 'فرانك دبل برجر (تجربة)',
          nameEn: 'Frank Double Burger (Test)',
          price: 185,
          category: 'Burgers',
        });
        addToast(isAr ? 'تم إرسال حدث ViewContent بنجاح!' : 'ViewContent event sent!', 'success');
        break;
      case 'AddToCart':
        trackAddToCart({
          productId: 'prod-test-101',
          nameAr: 'فرانك دبل برجر (تجربة)',
          nameEn: 'Frank Double Burger (Test)',
          price: 185,
          quantity: 2,
          category: 'Burgers',
        });
        addToast(isAr ? 'تم إرسال حدث AddToCart بنجاح!' : 'AddToCart event sent!', 'success');
        break;
      case 'InitiateCheckout':
        trackInitiateCheckout(
          [
            { productId: 'prod-test-101', nameAr: 'فرانك دبل برجر', price: 185, quantity: 2 },
            { productId: 'prod-test-102', nameAr: 'بطاطس مقلية كريسبي', price: 45, quantity: 1 },
          ],
          415
        );
        addToast(isAr ? 'تم إرسال حدث InitiateCheckout بنجاح!' : 'InitiateCheckout event sent!', 'success');
        break;
      case 'Purchase':
        trackPurchase({
          id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
          subtotal: 295,
          products_total: 295,
          deliveryFee: 25,
          total: 320,
          items: [
            { productId: 'prod-test-101', nameAr: 'فرانك دبل برجر', price: 185, quantity: 1 },
            { productId: 'prod-test-102', nameAr: 'وجبة كريسبي بطاطس ومشروب', price: 110, quantity: 1 },
          ],
        });
        addToast(
          isAr
            ? 'تم إرسال حدث Purchase بنجاح (قيمة الطلب في البيكسل: 320 ج)'
            : 'Purchase event sent successfully (Pixel Value: 320 EGP)',
          'success'
        );
        break;
    }
  };

  const isMetaActive = Boolean(cleanPixelId(settings.facebookPixelId));
  const isTiktokActive = Boolean(settings.tiktokPixelId?.trim());

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 font-heading">
              {isAr ? 'إعدادات التتبع والتحليلات (Meta & TikTok Pixels)' : 'Pixel & Analytics Tracking'}
            </h2>
            <p className="text-xs text-zinc-500">
              {isAr
                ? 'ربط وتتبع إعلانات فيسبوك، تيك توك، وتحليلات جوجل بشكل مباشر ولحظي.'
                : 'Connect and track Facebook ads, TikTok ads, and Google Analytics in real-time.'}
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isMetaActive
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isMetaActive ? 'bg-blue-600 animate-pulse' : 'bg-zinc-400'}`} />
            <span>Meta Pixel: {isMetaActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير متصل' : 'Inactive'}</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isTiktokActive
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isTiktokActive ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span>TikTok: {isTiktokActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير متصل' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meta Pixel ID */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1877F2]"></span>
              <span>Facebook (Meta) Pixel ID</span>
            </label>
            {isMetaActive && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                {isAr ? 'تم الحفظ' : 'Saved'}
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="مثال: 1868323817494511"
            value={settings.facebookPixelId || ''}
            onChange={(e) => {
              const cleaned = cleanPixelId(e.target.value);
              updateSettings({ facebookPixelId: cleaned || e.target.value.trim() });
            }}
            className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3 text-zinc-900 font-mono text-xs outline-none focus:border-[#1877F2] transition-colors"
          />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {isAr
              ? 'الرقم التعريفي للبكسل من مدير أحداث فيسبوك (Meta Events Manager).'
              : 'Pixel ID from your Meta Events Manager dashboard.'}
          </p>
        </div>

        {/* Meta Test Event Code */}
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'رمز اختبار الأحداث (Meta Test Event Code)' : 'Meta Test Event Code'}</span>
            </label>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-100/70 px-1.5 py-0.5 rounded">
              {isAr ? 'اختياري للاختبار' : 'Optional'}
            </span>
          </div>
          <input
            type="text"
            placeholder="مثال: TEST45892"
            value={settings.facebookTestEventCode || ''}
            onChange={(e) => updateSettings({ facebookTestEventCode: e.target.value.trim().toUpperCase() })}
            className="w-full bg-white border border-blue-200 rounded-lg py-2.5 px-3 text-zinc-900 font-mono text-xs outline-none focus:border-blue-500 uppercase transition-colors"
          />
          <p className="text-[10px] text-blue-700 leading-relaxed">
            {isAr
              ? 'إذا كنت تستخدم تبويب "Test Events" في فيسبوك، انسخ كود الاختبار وضعه هنا لتظهر الأحداث فوراً في الجدول المباشر.'
              : 'Enter code from Meta "Test Events" tab to view events live in Events Manager.'}
          </p>
        </div>

        {/* Meta Conversions API (CAPI) Access Token - High Priority for iOS / iPhone */}
        <div className="md:col-span-2 p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-purple-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'رمز الوصول لـ Meta Conversions API (CAPI) — حل تتبع أجهزة الآيفون والـ Safari' : 'Meta Conversions API (CAPI) Access Token'}</span>
            </label>

            <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
              {settings.facebookCapiAccessToken ? (isAr ? 'CAPI مفعّل 🟢' : 'CAPI Active 🟢') : (isAr ? 'مستحسن للايفون ⚠️' : 'Recommended for iOS ⚠️')}
            </span>
          </div>

          <textarea
            rows={2}
            placeholder="مثال: EAAGm0PX4ZC0sBAN..."
            value={settings.facebookCapiAccessToken || ''}
            onChange={(e) => updateSettings({ facebookCapiAccessToken: e.target.value.trim() })}
            className="w-full bg-white border border-purple-200 rounded-lg py-2 px-3 text-zinc-900 font-mono text-[11px] outline-none focus:border-purple-500 transition-colors"
          />

          <div className="text-[11px] text-purple-900 leading-relaxed bg-white/80 p-3 rounded-lg border border-purple-100 space-y-1.5">
            <p className="font-bold flex items-center gap-1">
              <span>💡 لماذا نحتاج هذا الكود؟</span>
            </p>
            <p className="text-zinc-600 text-[10px] leading-normal">
              {isAr
                ? 'متصفحات أجهزة الآيفون (Safari) وأدوات منع التتبع تلقائياً تحجب كود البيكسل العادي المقروء من المتصفح. عند وضع كود Access Token هنا، يقوم سيرفر المنصة بإرسال أحداث الزيارات والطلبات مباشرة من السيرفر إلى فيسبوك (Server-to-Server)، مما يضمن لك تتبع 100% من طلبات الآيفون دون أي فقدان للبيانات.'
                : 'Safari on iPhones and Ad Blockers automatically block client-side Meta Pixel scripts. Adding your CAPI Access Token enables direct server-to-server tracking, ensuring 100% accurate conversion data from iPhone users.'}
            </p>
            <p className="text-[10px] text-purple-800 font-semibold pt-0.5">
              {isAr
                ? '📌 كيفية الاستخراج: اذهب لـ Meta Events Manager ⬅️ اختر البكسل ⬅️ Settings ⬅️ Conversions API ⬅️ اضغط "Generate access token" وانسخ الكود هنا.'
                : '📌 How to get it: Meta Events Manager ➡️ Select Pixel ➡️ Settings ➡️ Conversions API ➡️ Click "Generate access token" and paste here.'}
            </p>
          </div>
        </div>

        {/* TikTok Pixel ID */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe]"></span>
            <span>TikTok Pixel ID</span>
          </label>
          <input
            type="text"
            placeholder="مثال: C61ABCD1234..."
            value={settings.tiktokPixelId || ''}
            onChange={(e) => updateSettings({ tiktokPixelId: e.target.value.trim() })}
            className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3 text-zinc-900 font-mono text-xs outline-none focus:border-cyan-500 transition-colors"
          />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {isAr
              ? 'الرقم التعريفي من مدير إعلانات تيك توك (TikTok Ads Manager).'
              : 'TikTok Pixel SDK ID from TikTok Ads Manager.'}
          </p>
        </div>

        {/* Google Analytics ID */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Google Analytics 4 (Measurement ID)</span>
          </label>
          <input
            type="text"
            placeholder="مثال: G-XXXXXXXXXX"
            value={settings.googleAnalyticsId || ''}
            onChange={(e) => updateSettings({ googleAnalyticsId: e.target.value.trim() })}
            className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3 text-zinc-900 font-mono text-xs outline-none focus:border-amber-500 transition-colors"
          />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {isAr
              ? 'معرف القياس من Google Analytics (يبدأ بـ G-).'
              : 'GA4 Measurement ID (starts with G-).'}
          </p>
        </div>
      </div>

      {/* One-Click Interactive Test Action Bar */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'اختبار فوري وإرسال أحداث تجريبية (Test Live Events):' : 'Test Firing Live Events:'}</span>
          </div>
          <span className="text-[11px] text-emerald-700">
            {isAr ? 'اضغط لتجربة إرسال الحدث إلى Pixel والتأكد من وصوله' : 'Click to trigger event instantly to your Pixels'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleTestEvent('PageView')}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold py-2 px-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>PageView</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestEvent('ViewContent')}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold py-2 px-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>ViewContent</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestEvent('AddToCart')}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold py-2 px-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
            <span>AddToCart</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestEvent('InitiateCheckout')}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold py-2 px-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Checkout</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestEvent('Purchase')}
            className="flex items-center justify-center gap-1.5 bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold py-2 px-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer col-span-2 sm:col-span-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Purchase 🎉</span>
          </button>
        </div>
      </div>

      {/* Live Real-time Pixel Events Log Console */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-900 text-zinc-100 shadow-inner">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{isAr ? 'سجل الأحداث المباشر في المتصفح (Live Events Log)' : 'Live Browser Events Log'}</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {logs.length} {isAr ? 'حدث' : 'events'}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <span>🟢 {isAr ? 'المتصفح متصل' : 'Active Connection'}</span>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/60 font-mono text-[11px] p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-zinc-500 text-xs">
              {isAr
                ? 'لم يتم إرسال أي أحداث في هذه الجلسة بعد. قم بالتصفح أو اضغط على أزرار التجربة أعلاه.'
                : 'No events fired yet in this session. Browse the site or click the test buttons above.'}
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 p-2 rounded hover:bg-zinc-800/50">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <div>
                    <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] mr-1.5 ml-1.5">
                      {log.eventName}
                    </span>
                    <span className="text-zinc-400">{JSON.stringify(log.data)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 shrink-0 font-sans">
                  {log.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
