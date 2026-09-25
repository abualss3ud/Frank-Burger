import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowRight, ArrowLeft, Home, LogOut } from 'lucide-react';

interface ForbiddenViewProps {
  requestedRoute?: string;
}

export const ForbiddenView: React.FC<ForbiddenViewProps> = ({ requestedRoute }) => {
  const { adminUser, setCurrentView, logoutAdmin, language } = useApp();
  const isAr = language === 'ar';

  const handleReturnToDashboard = () => {
    if (!adminUser) {
      setCurrentView('home');
      return;
    }

    setCurrentView('admin');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center bg-white">
      {/* Background soft glow */}
      <div className="absolute w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden text-center">
        {/* Top Danger Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500" />

        {/* Icon & Error Code */}
        <div className="space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="font-mono font-black text-rose-600 text-sm tracking-widest uppercase">
            403 • FORBIDDEN
          </div>
          <h1 className="text-2xl font-black text-zinc-900 font-heading">
            {isAr ? 'تم رفض الوصول (Access Denied)' : 'Access Denied'}
          </h1>
          <p className="text-zinc-600 text-sm leading-relaxed">
            {isAr
              ? 'عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء.'
              : 'You do not have the required permissions to access this page or resource.'}
          </p>
        </div>

        {/* User Context Badge */}
        {adminUser && (
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-500">{isAr ? 'الحساب الحالي:' : 'Active Account:'}</span>
              <span className="font-bold text-zinc-900">{adminUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-500">{isAr ? 'مستوى الصلاحية:' : 'Role Level:'}</span>
              <span className="font-mono px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-800 font-bold text-[11px]">
                {adminUser.role}
              </span>
            </div>
            {requestedRoute && (
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60">
                <span>{isAr ? 'المسار المطلوب:' : 'Attempted Route:'}</span>
                <span className="font-mono text-rose-600">{requestedRoute}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleReturnToDashboard}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-sm shadow-lg shadow-[#E51E2A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'العودة للوحة التحكم المصرح بها' : 'Return to Dashboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isAr ? 'الموقع الرئيسي' : 'Storefront'}</span>
            </button>

            {adminUser && (
              <button
                type="button"
                onClick={logoutAdmin}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
