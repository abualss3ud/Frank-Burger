import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Shield,
  Download,
  Filter,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { AuditLogEntry, AuditAction } from '../types';

export const AuditLogsTab: React.FC = () => {
  const { auditLogs, language, addToast, clearAuditLogs } = useApp();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILURE' | 'WARNING'>('all');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportLogsAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `frank_burger_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast(isAr ? 'تم تصدير سجل الأمان بنجاح' : 'Audit logs exported', 'success');
  };

  const getActionBadge = (action: AuditAction | string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { labelAr: 'تسجيل دخول ناجح', labelEn: 'Login Success', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'LOGIN_FAILED':
        return { labelAr: 'محاولة دخول فاشلة', labelEn: 'Login Failed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'RATE_LIMIT_TRIGGERED':
        return { labelAr: 'حظر مؤقت (Rate Limit)', labelEn: 'Rate Limited', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'MFA_CHALLENGE_PASSED':
        return { labelAr: 'اجتياز 2FA', labelEn: 'MFA Passed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'PASSWORD_RESET_COMPLETED':
        return { labelAr: 'إعادة تعيين كلمة المرور', labelEn: 'Password Reset', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PASSWORD_CHANGE':
        return { labelAr: 'تغيير كلمة المرور', labelEn: 'Password Changed', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'USER_CREATED':
        return { labelAr: 'إنشاء مستخدم جديد', labelEn: 'User Created', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'USER_DELETED':
        return { labelAr: 'حذف مستخدم', labelEn: 'User Deleted', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return { labelAr: 'محاولة وصول غير مصرح', labelEn: 'Unauthorized Access', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { labelAr: action, labelEn: action, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 font-heading">
                {isAr ? 'سجل العمليات والرقابة الأمنية (Audit Logs)' : 'Security Audit & Compliance'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isAr
                  ? 'سجل غير قابل للتعديل يوثق جميع عمليات الدخول، تغيير الصلاحيات، محاولات الاختراق، و2FA'
                  : 'Immutable security log tracking all authentication, RBAC modifications, and security anomalies'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Clear Logs Button with inline confirmation */}
          {isConfirmingClear ? (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={async () => {
                  await clearAuditLogs();
                  setIsConfirmingClear(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {isAr ? 'نعم، مسح الكل' : 'Yes, clear all'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold text-xs transition-all cursor-pointer"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="px-4 py-2.5 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isAr ? 'تفريغ السجل' : 'Clear Audit Logs'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportLogsAsJSON}
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير السجل JSON' : 'Export Logs JSON'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في الأحداث، المستخدمين، التفاصيل...' : 'Search logs by event, user, details...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({auditLogs.length})
          </button>
          <button
            onClick={() => setStatusFilter('SUCCESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'SUCCESS'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isAr ? 'العمليات الناجحة' : 'Success'}
          </button>
          <button
            onClick={() => setStatusFilter('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'WARNING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isAr ? 'تحذيرات' : 'Warnings'}
          </button>
          <button
            onClick={() => setStatusFilter('FAILURE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'FAILURE'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {isAr ? 'عمليات مرفوضة / فاشلة' : 'Failed'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
              <tr>
                <th className="p-4">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                <th className="p-4">{isAr ? 'الحدث' : 'Event / Action'}</th>
                <th className="p-4">{isAr ? 'المستخدم والـ Role' : 'User & Role'}</th>
                <th className="p-4">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-4">{isAr ? 'التفاصيل' : 'Details'}</th>
                <th className="p-4">{isAr ? 'الـ IP والبيئة' : 'IP / Client'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    {isAr ? 'لا توجد سجلات مطابقة للبحث' : 'No audit records match your query'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${badge.color}`}>
                          {isAr ? badge.labelAr : badge.labelEn}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-[10px] text-zinc-700">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block leading-tight">@{log.username}</span>
                            <span className="text-[10px] text-zinc-400 block uppercase font-mono">{log.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {log.status === 'SUCCESS' && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'ناجح' : 'SUCCESS'}</span>
                          </span>
                        )}
                        {log.status === 'WARNING' && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تحذير' : 'WARNING'}</span>
                          </span>
                        )}
                        {log.status === 'FAILURE' && (
                          <span className="flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isAr ? 'فشل' : 'FAILURE'}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 max-w-xs truncate text-zinc-700 text-xs">
                        {log.details || '—'}
                      </td>

                      <td className="p-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                        {log.ip || '127.0.0.1 (Local Browser Session)'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
