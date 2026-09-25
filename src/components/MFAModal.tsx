import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  computeTOTPCode,
  verifyTOTPCode,
  buildOTPAuthURL,
  generateTOTPSecret,
} from '../utils/security';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  KeyRound,
  RefreshCw,
  QrCode,
} from 'lucide-react';

interface MFAModalProps {
  mode: 'challenge' | 'setup'; // 'challenge' during login, 'setup' in security settings
  username?: string;
  secretForSetup?: string;
  onSuccess: (verifiedSecret?: string) => void;
  onCancel: () => void;
}

export const MFAModal: React.FC<MFAModalProps> = ({
  mode,
  username = 'admin',
  secretForSetup,
  onSuccess,
  onCancel,
}) => {
  const { language, addToast } = useApp();
  const isAr = language === 'ar';

  const [secret, setSecret] = useState<string>(() => secretForSetup || generateTOTPSecret());
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Computed demo TOTP for easy testing if user doesn't have authenticator app ready
  const [liveTestCode, setLiveTestCode] = useState<string>('');

  useEffect(() => {
    let timer: any;
    const updateCode = async () => {
      if (secret) {
        const c = await computeTOTPCode(secret);
        setLiveTestCode(c);
      }
    };
    updateCode();
    timer = setInterval(updateCode, 5000);
    return () => clearInterval(timer);
  }, [secret]);

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError(isAr ? 'يجب أن يتكون رمز التحقق من 6 أرقام' : 'Code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyTOTPCode(secret, cleanCode);
      setIsLoading(false);

      if (isValid) {
        onSuccess(secret);
      } else {
        setError(isAr ? 'رمز التحقق غير صحيح أو انتهت صلاحيته' : 'Invalid or expired authenticator code');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || (isAr ? 'فشل التحقق من الرمز' : 'Verification failed'));
    }
  };

  const otpUrl = buildOTPAuthURL(username, secret);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 sm:left-5 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 font-heading">
            {mode === 'setup'
              ? isAr ? 'إعداد المصادقة الثنائية (2FA / TOTP)' : 'Setup Two-Factor Authentication'
              : isAr ? 'رمز التحقق بخطوتين (MFA)' : 'Two-Factor Authentication Code'}
          </h3>
          <p className="text-xs text-zinc-600">
            {mode === 'setup'
              ? isAr
                ? 'اربط حسابك بتطبيق المصادقة (Google Authenticator / Microsoft) لحماية أعلى'
                : 'Connect your account to an authenticator app for maximum security'
              : isAr
                ? 'أدخل الرمز المكون من 6 أرقام الظاهر في تطبيق المصادقة الخاص بك'
                : 'Enter the 6-digit verification code from your authenticator app'}
          </p>
        </div>

        {/* Setup Guide (If Setup Mode) */}
        {mode === 'setup' && (
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-700">{isAr ? 'مفتاح الربط اليدوي (Secret):' : 'Secret Key:'}</span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100/60 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              >
                {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSecret ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ المفتاح' : 'Copy')}</span>
              </button>
            </div>

            <div dir="ltr" className="font-mono text-xs font-black bg-white p-2.5 rounded-xl border border-zinc-200 text-center tracking-wider text-zinc-800 break-all select-all">
              {secret}
            </div>

            {/* Simulated instant testing code helper for user convenience */}
            <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-600">
              <span>{isAr ? 'رمز تجريبي للتأكيد السريع:' : 'Current Test Code:'}</span>
              <span
                onClick={() => setCode(liveTestCode)}
                className="font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                title="اضغط للتعبئة التلقائية"
              >
                {liveTestCode || '------'}
              </span>
            </div>
          </div>
        )}

        {/* Challenge Mode testing tip */}
        {mode === 'challenge' && liveTestCode && (
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
            <span>{isAr ? 'رمز تطبيق Authenticator المولد حالياً:' : 'Active TOTP Code:'}</span>
            <button
              type="button"
              onClick={() => setCode(liveTestCode)}
              className="font-mono font-black text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
            >
              {liveTestCode} (تعبئة)
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 block text-center">
              {isAr ? 'رمز التحقق (6 أرقام)' : '6-Digit Verification Code'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full text-center font-mono text-2xl font-black tracking-widest py-3 rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus:bg-white focus:border-[#E51E2A] outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="flex-2 py-3 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === 'setup' ? (isAr ? 'تفعيل 2FA الآن' : 'Enable 2FA') : (isAr ? 'تأكيد ودخول' : 'Verify & Enter')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
