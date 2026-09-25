import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  KeyRound,
  Shield,
  HelpCircle,
  X,
  BadgeCheck,
  ChefHat,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Smartphone,
  Crown,
  Receipt,
  Building2,
  Clock,
} from 'lucide-react';
import { MFAModal } from './MFAModal';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from '../utils/security';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const {
    loginAdminWithCredentials,
    requestPasswordReset,
    adminAccounts,
    language,
    toggleLanguage,
    setCurrentView,
    settings,
    addToast,
  } = useApp();

  const isAr = language === 'ar';

  // Role Presets
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cashier'>('admin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting State
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // MFA Challenge State
  const [mfaPendingAccount, setMfaPendingAccount] = useState<{
    account: any;
    temporaryToken: string;
  } | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmailOrUser, setForgotEmailOrUser] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);

  // Periodic Rate Limit Lockout countdown
  useEffect(() => {
    const rateCheck = checkRateLimit(`login:${usernameOrEmail.trim().toLowerCase()}`);
    if (rateCheck.isBlocked) {
      setLockoutRemaining(rateCheck.remainingLockoutSeconds);
    } else {
      setLockoutRemaining(0);
    }
  }, [usernameOrEmail]);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Handle Preset Click
  const handleSelectRolePreset = (role: 'admin' | 'cashier') => {
    setSelectedRole(role);
    setUsernameOrEmail(role);
    setPassword('');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = usernameOrEmail.trim();
    if (!cleanUser) {
      setError(isAr ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' : 'Please enter username or email');
      return;
    }
    if (!password) {
      setError(isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    // Rate Limit Check
    const rateCheck = checkRateLimit(`login:${cleanUser.toLowerCase()}`);
    if (rateCheck.isBlocked) {
      setLockoutRemaining(rateCheck.remainingLockoutSeconds);
      setError(isAr ? rateCheck.warningMessageAr! : rateCheck.warningMessageEn!);
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginAdminWithCredentials(cleanUser, password, rememberMe);
      setIsLoading(false);

      if (res.success) {
        // If MFA required, open MFA challenge modal
        if (res.mfaRequired) {
          setMfaPendingAccount({
            account: res.account,
            temporaryToken: res.temporaryToken!,
          });
          return;
        }

        clearRateLimit(`login:${cleanUser.toLowerCase()}`);
        addToast(
          isAr
            ? `مرحباً بك! تم تسجيل الدخول بنجاح بصلاحية (${res.role})`
            : `Welcome! Logged in successfully as (${res.role})`,
          'success'
        );

        if (onSuccess) onSuccess();
      } else {
        const rateAfterFail = recordFailedAttempt(`login:${cleanUser.toLowerCase()}`);
        if (rateAfterFail.isBlocked) {
          setLockoutRemaining(rateAfterFail.remainingLockoutSeconds);
          setError(isAr ? rateAfterFail.warningMessageAr! : rateAfterFail.warningMessageEn!);
        } else {
          setError(
            res.message ||
              (isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password')
          );
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || (isAr ? 'حدث خطأ في المصادقة' : 'Authentication error'));
    }
  };

  // MFA Challenge Success
  const handleMFASuccess = () => {
    if (!mfaPendingAccount) return;
    setMfaPendingAccount(null);
    clearRateLimit(`login:${usernameOrEmail.trim().toLowerCase()}`);
    addToast(
      isAr ? 'تم التحقق من رمز 2FA وتأكيد الدخول بنجاح!' : 'Two-Factor Authentication verified successfully!',
      'success'
    );
    if (onSuccess) onSuccess();
  };

  // Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setGeneratedResetLink(null);

    const cleanInput = forgotEmailOrUser.trim();
    if (!cleanInput) {
      setForgotError(isAr ? 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' : 'Please enter email or username');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await requestPasswordReset(cleanInput);
      setIsForgotLoading(false);

      if (res.success) {
        setForgotMessage(
          isAr
            ? 'إذا كان الحساب مسجلاً بالنظام، فقد تم إنشاء رابط استعادة صالح لمدة 15 دقيقة فقط.'
            : 'If the account exists, a secure reset link valid for 15 minutes has been generated.'
        );
        if (res.resetLink) {
          setGeneratedResetLink(res.resetLink);
        }
      } else {
        setForgotError(res.message);
      }
    } catch (err: any) {
      setIsForgotLoading(false);
      setForgotError(err?.message || (isAr ? 'فشل معالجة الطلب' : 'Failed to process request'));
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative text-start bg-white">
      {/* Soft Background Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E51E2A]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Floating Navigation */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 text-xs">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-2 px-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs hover:bg-zinc-50 font-bold"
        >
          {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{isAr ? 'العودة للمتجر الرئيسي' : 'Back to Storefront'}</span>
        </button>

        <button
          onClick={toggleLanguage}
          className="py-2 px-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer font-bold"
        >
          {isAr ? 'English' : 'عربي'}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#E51E2A] to-rose-600" />

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <img
            src="https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696964/Artboard_2_9x.png"
            alt="Frank Burger"
            className="h-14 w-auto object-contain mx-auto mb-1"
          />
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading tracking-tight">
            {isAr ? 'بوابة إدارة المطعم ونقاط البيع' : 'Frank Burger Management Portal'}
          </h1>
          <p className="text-xs text-zinc-600">
            {isAr
              ? 'تسجيل الدخول المركزي الآمن المحمي بنظام الصلاحيات (RBAC)'
              : 'Secure centralized authentication with Role-Based Access Control'}
          </p>
        </div>

        {/* Role Presets Selection (3 Levels: Admin, Manager, Cashier) */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-600 block">
            {isAr ? 'اختر نوع الحساب أو اكتب البيانات مباشرة:' : 'Select profile or enter credentials:'}
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Super Admin Preset */}
            <button
              type="button"
              onClick={() => handleSelectRolePreset('admin')}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'admin' && usernameOrEmail === 'admin'
                  ? 'bg-rose-50/70 border-[#E51E2A] shadow-xs'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="w-7 h-7 rounded-lg bg-rose-100/80 text-[#E51E2A] flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                {selectedRole === 'admin' && usernameOrEmail === 'admin' && (
                  <Check className="w-3.5 h-3.5 text-[#E51E2A]" />
                )}
              </div>
              <div>
                <h2 className="text-xs font-black text-zinc-900 leading-tight">
                  {isAr ? 'المسؤول الأعلى' : 'Super Admin'}
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isAr ? 'كامل النظام' : 'Full Access'}
                </p>
              </div>
            </button>

            {/* Cashier Preset */}
            <button
              type="button"
              onClick={() => handleSelectRolePreset('cashier')}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'cashier' && usernameOrEmail === 'cashier'
                  ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                {selectedRole === 'cashier' && usernameOrEmail === 'cashier' && (
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <div>
                <h2 className="text-xs font-black text-zinc-900 leading-tight">
                  {isAr ? 'الكاشير' : 'Cashier'}
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isAr ? 'الطلبات والورديات' : 'POS & Shifts'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutRemaining > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold block">
                {isAr ? 'الحساب مقفل مؤقتاً بسبب تكرار المحاولات الخاطئة' : 'Account Temporarily Locked'}
              </span>
              <p className="mt-0.5">
                {isAr
                  ? `يرجى الانتظار (${lockoutRemaining} ثانية) قبل المحاولة التالية.`
                  : `Please wait (${lockoutRemaining}s) before trying again.`}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && lockoutRemaining <= 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Username / Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 block">
              {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  setError(null);
                }}
                placeholder={isAr ? 'admin أو cashier' : 'admin or cashier'}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:bg-white focus:border-[#E51E2A] outline-none transition-all placeholder:text-zinc-400 font-medium"
                required
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmailOrUser(usernameOrEmail);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] font-bold text-[#E51E2A] hover:underline cursor-pointer"
              >
                {isAr ? 'هل نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:bg-white focus:border-[#E51E2A] outline-none transition-all placeholder:text-zinc-400"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#E51E2A] rounded border-zinc-300 focus:ring-[#E51E2A]"
              />
              <span>{isAr ? 'تذكر جلستي على هذا الجهاز' : 'Remember my session on this device'}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-[#E51E2A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lockoutRemaining > 0
                    ? isAr
                      ? `يرجى الانتظار (${lockoutRemaining}s)`
                      : `Please wait (${lockoutRemaining}s)`
                    : isAr
                    ? 'تسجيل الدخول الآمن'
                    : 'Sign In'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* MFA Challenge Modal */}
      {mfaPendingAccount && (
        <MFAModal
          mode="challenge"
          username={mfaPendingAccount.account.username}
          secretForSetup={mfaPendingAccount.account.mfaSecret}
          onSuccess={handleMFASuccess}
          onCancel={() => setMfaPendingAccount(null)}
        />
      )}

      {/* Forgot Password Modal (Anti-Enumeration & Secure 15-min Token) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95 duration-200 text-start">
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage(null);
                setForgotError(null);
                setGeneratedResetLink(null);
              }}
              className="absolute top-4 left-4 sm:left-5 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 font-heading">
                {isAr ? 'استعادة كلمة المرور' : 'Recover Account Password'}
              </h3>
              <p className="text-xs text-zinc-600">
                {isAr
                  ? 'أدخل البريد الإلكتروني أو اسم المستخدم لإنشاء رابط استعادة آمن'
                  : 'Enter email or username to generate a secure 15-minute reset token'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{forgotMessage}</p>
                </div>

                {generatedResetLink && (
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2 mt-2">
                    <span className="font-bold text-[11px] text-zinc-700 block">
                      {isAr ? 'رابط الاستعادة المؤقت (صالح 15 دقيقة):' : 'One-Time 15-Min Reset Link:'}
                    </span>
                    <a
                      href={generatedResetLink}
                      onClick={() => setIsForgotModalOpen(false)}
                      className="text-xs font-mono text-[#E51E2A] underline break-all block hover:text-[#c81520]"
                    >
                      {generatedResetLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            {!forgotMessage && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {isAr ? 'البريد الإلكتروني أو اسم المستخدم' : 'Email or Username'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={forgotEmailOrUser}
                      onChange={(e) => setForgotEmailOrUser(e.target.value)}
                      placeholder={isAr ? 'admin@frankburger.com أو admin' : 'admin@frankburger.com'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-2 py-3 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isForgotLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
