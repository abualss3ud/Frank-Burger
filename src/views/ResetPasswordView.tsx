import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  evaluatePasswordStrength,
  verifyPassword,
  hashPassword,
} from '../utils/security';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface ResetPasswordViewProps {
  tokenFromUrl?: string;
  onSuccess?: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  tokenFromUrl,
  onSuccess,
}) => {
  const {
    language,
    setCurrentView,
    resetPasswordWithSecureToken,
    validatePasswordResetToken,
    addToast,
  } = useApp();

  const isAr = language === 'ar';

  const [token, setToken] = useState(() => {
    if (tokenFromUrl) return tokenFromUrl;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('token');
      if (queryToken) return queryToken;

      const hash = window.location.hash;
      if (hash.includes('token=')) {
        return hash.split('token=')[1]?.split('&')[0] || '';
      }
    }
    return '';
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenUsername, setTokenUsername] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError(isAr ? 'رمز استعادة كلمة المرور غير متوفر أو الرابط غير صالح' : 'Reset token is missing or invalid');
      return;
    }

    const check = validatePasswordResetToken(token);
    if (check.valid) {
      setIsValidToken(true);
      setTokenUsername(check.username || null);
    } else {
      setIsValidToken(false);
      setError(check.message || (isAr ? 'رابط استعادة كلمة المرور منتهي الصلاحية أو تم استخدامه سابقاً' : 'Token expired or already used'));
    }
  }, [token, isAr]);

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError(isAr ? 'رمز الاستعادة غير صالح' : 'Invalid reset token');
      return;
    }

    if (!strength.isStrong) {
      setError(isAr ? strength.feedbackAr : strength.feedbackEn);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithSecureToken(token, newPassword);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage(
          isAr
            ? 'تم تغيير كلمة المرور بنجاح! تم إنهاء كافة الجلسات السابقة لحمايتك. يرجى تسجيل الدخول مجدداً.'
            : 'Password changed successfully! All previous sessions have been invalidated. Please log in again.'
        );
        addToast(
          isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
          'success'
        );

        setTimeout(() => {
          setCurrentView('admin'); // Navigate to login
          if (onSuccess) onSuccess();
        }, 2200);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || (isAr ? 'حدث خطأ أثناء إعادة تعيين كلمة المرور' : 'Error resetting password'));
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-start bg-white">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-[#E51E2A]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 text-xs">
        <button
          onClick={() => setCurrentView('admin')}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-2 px-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs font-bold"
        >
          {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{isAr ? 'العودة لصفحة تسجيل الدخول' : 'Back to Login'}</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#E51E2A] to-rose-600" />

        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 font-heading">
            {isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Account Password'}
          </h1>
          <p className="text-xs text-zinc-600">
            {tokenUsername ? (
              <span>
                {isAr ? `تحديث كلمة المرور للحساب: ` : `Updating password for: `}
                <strong className="text-zinc-900 font-mono">{tokenUsername}</strong>
              </span>
            ) : (
              isAr
                ? 'أنشئ كلمة مرور جديدة وقوية ومطابقة لمعايير الأمان'
                : 'Create a new strong password meeting security standards'
            )}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div className="space-y-1">
              <span className="font-bold block text-sm">{isAr ? 'تمت العملية بنجاح!' : 'Success!'}</span>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Reset Password Form */}
        {isValidToken && !successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isAr ? '12 حرفاً على الأقل (رموز، أرقام، أحرف)' : 'Min 12 chars (symbols, numbers, cases)'}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
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

            {/* Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-600">{isAr ? 'قوة كلمة المرور:' : 'Password Strength:'}</span>
                  <span
                    className={
                      strength.score >= 4
                        ? 'text-emerald-600'
                        : strength.score >= 3
                        ? 'text-blue-600'
                        : strength.score >= 2
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }
                  >
                    {strength.score >= 4
                      ? isAr ? 'قوية جداً ومثالية' : 'Very Strong'
                      : strength.score >= 3
                      ? isAr ? 'جيدة' : 'Good'
                      : strength.score >= 2
                      ? isAr ? 'متوسطة' : 'Medium'
                      : isAr ? 'ضعيفة' : 'Weak'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div className={`rounded-full ${strength.score >= 1 ? (strength.score >= 4 ? 'bg-emerald-500' : strength.score >= 3 ? 'bg-blue-500' : strength.score >= 2 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-zinc-200'}`} />
                  <div className={`rounded-full ${strength.score >= 2 ? (strength.score >= 4 ? 'bg-emerald-500' : strength.score >= 3 ? 'bg-blue-500' : 'bg-amber-500') : 'bg-zinc-200'}`} />
                  <div className={`rounded-full ${strength.score >= 3 ? (strength.score >= 4 ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-zinc-200'}`} />
                  <div className={`rounded-full ${strength.score >= 4 ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-600 pt-1">
                  <div className="flex items-center gap-1">
                    <span className={strength.hasMinLength ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                      {strength.hasMinLength ? '✓' : '•'}
                    </span>
                    <span>12+ {isAr ? 'حرفاً' : 'chars'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={strength.hasUppercase && strength.hasLowercase ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                      {strength.hasUppercase && strength.hasLowercase ? '✓' : '•'}
                    </span>
                    <span>{isAr ? 'حروف كبيرة وصغيرة (A-z)' : 'A-Z & a-z'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={strength.hasNumber ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                      {strength.hasNumber ? '✓' : '•'}
                    </span>
                    <span>{isAr ? 'أرقام (0-9)' : 'Numbers (0-9)'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={strength.hasSpecial ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                      {strength.hasSpecial ? '✓' : '•'}
                    </span>
                    <span>{isAr ? 'رموز خاصة (!@#)' : 'Symbols (!@#)'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter new password'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
                  required
                />
                <ShieldCheck className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !strength.isStrong || newPassword !== confirmPassword}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-[#E51E2A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>{isAr ? 'جاري التحقق وتحديث الأمان...' : 'Securing Account...'}</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتحديث كلمة المرور' : 'Update & Secure Password'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Invalid or Expired Token State */}
        {isValidToken === false && !successMessage && (
          <div className="text-center py-4 space-y-4">
            <button
              type="button"
              onClick={() => setCurrentView('admin')}
              className="py-3 px-6 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isAr ? 'طلب رابط استعادة جديد من صفحة الدخول' : 'Request New Reset Link'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
