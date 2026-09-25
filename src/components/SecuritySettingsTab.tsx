import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Laptop,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Shield,
  Trash2,
} from 'lucide-react';
import { evaluatePasswordStrength, generateTOTPSecret } from '../utils/security';
import { MFAModal } from './MFAModal';

export const SecuritySettingsTab: React.FC = () => {
  const {
    adminUser,
    adminAccounts,
    updateAdminAccount,
    changePassword,
    revokeAllSessions,
    revokeSingleSession,
    enableMFA,
    disableMFA,
    language,
    addToast,
  } = useApp();

  const isAr = language === 'ar';

  const currentAccount = adminAccounts.find((a) => a.username === adminUser?.username);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // MFA Modal state
  const [isMFAModalOpen, setIsMFAModalOpen] = useState(false);
  const [mfaSecretPending, setMfaSecretPending] = useState<string>('');

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword.trim()) {
      setPasswordError(isAr ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError(isAr ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    if (!passwordStrength.isStrong) {
      setPasswordError(isAr ? passwordStrength.feedbackAr : passwordStrength.feedbackEn);
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      setIsChangingPass(false);

      if (res.success) {
        addToast(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message);
      }
    } catch (err: any) {
      setIsChangingPass(false);
      setPasswordError(err?.message || (isAr ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Failed to update password'));
    }
  };

  const handleStartMFASetup = () => {
    const newSecret = generateTOTPSecret();
    setMfaSecretPending(newSecret);
    setIsMFAModalOpen(true);
  };

  const handleMFAVerifiedSuccess = async () => {
    setIsMFAModalOpen(false);
    addToast(isAr ? 'تم تفعيل المصادقة الثنائية (2FA) بنجاح على حسابك' : '2FA activated successfully', 'success');
  };

  const handleDisableMFA = async () => {
    const enteredPass = window.prompt(
      isAr ? 'يرجى إدخال كلمة المرور الحالية لتعطيل المصادقة الثنائية:' : 'Enter current password to disable MFA:'
    );
    if (!enteredPass) return;

    const res = await disableMFA(enteredPass);
    if (res.success) {
      addToast(isAr ? 'تم تعطيل المصادقة الثنائية' : '2FA disabled', 'success');
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من إنهاء كافة الجلسات الأخرى المسجلة؟' : 'Terminate all other active sessions?')) {
      const res = await revokeAllSessions();
      if (res.success) {
        addToast(isAr ? 'تم إنهاء جميع الجلسات الأخرى بنجاح' : 'All other sessions terminated', 'success');
      } else {
        addToast(res.message, 'error');
      }
    }
  };

  const activeSessions = currentAccount?.activeSessions || [
    {
      id: 'sess-current',
      device: 'المتصفح الحالي (Current Session)',
      ip: '127.0.0.1',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 font-heading">
                {isAr ? 'الأمان، الجلسات، والمصادقة الثنائية' : 'Security, Sessions & 2FA'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isAr
                  ? 'إدارة كلمة المرور، التحقق بخطوتين (TOTP)، ومراقبة الأجهزة المسجلة لحسابك'
                  : 'Manage password, TOTP 2-Factor Authentication, and active devices'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs">
          <span className="text-zinc-500">{isAr ? 'المستخدم:' : 'User:'}</span>
          <span className="font-bold text-zinc-900">@{adminUser?.username}</span>
          <span className="text-[10px] bg-rose-50 text-[#E51E2A] px-2 py-0.5 rounded-full font-bold uppercase">
            {adminUser?.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Change Password */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E51E2A] flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900">
                {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {isAr ? 'تشفير PBKDF2-SHA256 مع فحص إلزامي لقوة الرمز' : 'PBKDF2-SHA256 encrypted with strength validation'}
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
            {/* Old Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password@2026!#"
                  className="w-full p-3 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{isAr ? 'قوة كلمة المرور:' : 'Strength:'}</span>
                    <span className="font-bold" style={{ color: passwordStrength.score >= 4 ? '#10b981' : passwordStrength.score >= 3 ? '#f59e0b' : '#ef4444' }}>
                      {isAr ? passwordStrength.feedbackAr : passwordStrength.feedbackEn}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? 'bg-yellow-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-[#E51E2A] outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full py-3 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isChangingPass ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Section 2: 2FA & Active Sessions */}
        <div className="space-y-6">
          {/* 2FA Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900">
                  {isAr ? 'المصادقة الثنائية (TOTP 2FA)' : 'Two-Factor Authentication'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {isAr ? 'حماية إضافية متوافقة مع Google Authenticator' : 'Extra layer via Google Authenticator / Authy'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-900 block">
                  {isAr ? 'حالة المصادقة الثنائية' : '2FA Status'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {currentAccount?.mfaEnabled
                    ? isAr ? 'المصادقة مفعلة ومؤمنة بحسابك' : '2FA is active on your account'
                    : isAr ? 'غير مفعلة (يوصى بتفعيلها للمدراء)' : 'Disabled (Recommended for Admin/Manager)'}
                </span>
              </div>

              {currentAccount?.mfaEnabled ? (
                <button
                  type="button"
                  onClick={handleDisableMFA}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isAr ? 'تعطيل 2FA' : 'Disable'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartMFASetup}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {isAr ? 'تفعيل الآن' : 'Enable Now'}
                </button>
              )}
            </div>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    {isAr ? 'الجلسات والأجهزة النشطة' : 'Active Sessions'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {isAr ? 'مراقبة الجلسات المفتوحة لحسابك' : 'Manage devices logged into your account'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRevokeAllOtherSessions}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إنهاء الجلسات الأخرى' : 'Revoke Others'}
              </button>
            </div>

            <div className="space-y-2">
              {activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            {isAr ? 'الجلسة الحالية' : 'Current'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono block">IP: {sess.ip}</span>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revokeSingleSession(sess.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="إنهاء هذه الجلسة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MFA Modal */}
      {isMFAModalOpen && (
        <MFAModal
          isOpen={isMFAModalOpen}
          mode="setup"
          secret={mfaSecretPending}
          username={adminUser?.username || 'admin'}
          onClose={() => setIsMFAModalOpen(false)}
          onSuccess={handleMFAVerifiedSuccess}
        />
      )}
    </div>
  );
};
