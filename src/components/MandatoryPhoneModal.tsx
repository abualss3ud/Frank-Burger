import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Smartphone, Check, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const MandatoryPhoneModal: React.FC = () => {
  const { user } = useAuth();
  const { customerProfile, updateCustomerProfile, language, addToast } = useApp();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAr = language === 'ar';

  // Modal triggers only if the user is authenticated but has no phone number in their profile
  const isMissingPhone = user && !customerProfile?.phone?.trim();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast(isAr ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.trim();

    // Standard phone validation
    if (!cleanPhone) {
      setError(isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required');
      return;
    }

    // Check Egyptian phone number format (starts with 01 and has 11 digits)
    const egPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egPhoneRegex.test(cleanPhone)) {
      setError(
        isAr
          ? 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً ويبدأ بـ 01'
          : 'Please enter a valid 11-digit Egyptian phone number starting with 01'
      );
      return;
    }

    setLoading(true);
    try {
      await updateCustomerProfile({ phone: cleanPhone });
      addToast(
        isAr ? 'تم تحديث رقم الهاتف بنجاح!' : 'Phone number updated successfully!',
        'success'
      );
    } catch (err) {
      console.error('Failed to update phone number:', err);
      setError(isAr ? 'حدث خطأ، يرجى المحاولة لاحقاً' : 'An error occurred, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isMissingPhone && (
        <div id="mandatory-phone-modal" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with strong blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white border border-zinc-100 rounded-[28px] p-8 shadow-2xl overflow-hidden"
          >
            {/* Header Graphics */}
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 rounded-3xl bg-[#E51E2A]/10 flex items-center justify-center text-[#E51E2A]">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 font-heading">
                  {isAr ? 'خطوة أخيرة: رقم الهاتف مطلوب' : 'One Last Step: Phone Required'}
                </h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                  {isAr
                    ? 'يرجى إدخال رقم هاتفك لتسهيل التواصل وتوصيل طلباتك بنجاح.'
                    : 'Please enter your phone number to ease communication and ensure successful deliveries.'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-rose-500 text-xs text-center bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-semibold"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="tel"
                  placeholder={isAr ? 'رقم الهاتف (مثال: 01012345678)' : 'Phone (e.g. 01012345678)'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full border border-zinc-200 rounded-xl p-3.5 focus:border-[#E51E2A] outline-none text-center text-lg tracking-wider font-mono font-bold"
                  disabled={loading}
                  maxLength={11}
                  required
                />
              </div>

              {/* Submit and Sign out buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E51E2A] hover:bg-[#c81520] disabled:bg-zinc-300 text-white rounded-xl p-3.5 font-bold shadow-lg shadow-red-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{isAr ? 'تأكيد وحفظ الرقم' : 'Confirm & Save Phone'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-800 p-2 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الخروج والعودة لاحقاً' : 'Log out and return later'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
