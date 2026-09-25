import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { toEnglishDigits, normalizePhone } from '../types';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t, language } = useApp();

  const getErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/invalid-email':
        return language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email';
      case 'auth/user-disabled':
        return language === 'ar' ? 'تم تعطيل هذا الحساب' : 'Account disabled';
      case 'auth/user-not-found':
        return language === 'ar' ? 'المستخدم غير موجود' : 'User not found';
      case 'auth/wrong-password':
        return language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Wrong password';
      case 'auth/email-already-in-use':
        return language === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use';
      case 'auth/operation-not-allowed':
        return language === 'ar' ? 'تسجيل الدخول غير مفعل حالياً' : 'Sign-in method not enabled';
      case 'auth/weak-password':
        return language === 'ar' ? 'كلمة المرور ضعيفة جداً' : 'Password is too weak';
      default:
        return language === 'ar' ? 'حدث خطأ، يرجى المحاولة لاحقاً' : 'An error occurred, please try again';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const normPhone = normalizePhone(phone) || toEnglishDigits(phone).trim();
        // Save to localStorage as a fallback in case the component unmounts instantly
        localStorage.setItem('pending_signup_profile', JSON.stringify({
          name,
          phone: normPhone,
          email,
          createdAt: new Date().toISOString()
        }));
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          phone: normPhone,
          email,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user exists in "users" collection
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || 'Google User',
          phone: user.phoneNumber || '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          favorites: []
        });
      }
    } catch (err: any) {
      console.error('[AUTH ERROR] Google login failed:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(
          language === 'ar' 
            ? 'تم حظر النافذة المنبثقة من قبل المتصفح! يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة.' 
            : 'Popup blocked by browser! Please allow popups and try again.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          language === 'ar'
            ? 'هذا النطاق (Domain) غير مصرح به في إعدادات Firebase! يرجى إضافة رابط الـ GitHub Pages الخاص بك إلى قائمة "Authorized Domains" في وحدة تحكم Firebase.'
            : 'This domain is not authorized in Firebase settings! Please add your GitHub Pages URL to the "Authorized Domains" list in your Firebase Console.'
        );
      } else if (window.self !== window.top) {
        setError(
          language === 'ar' 
            ? 'بسبب قيود الحماية للمتصفح داخل الإطار (iframe)، يرجى فتح الموقع في علامة تبويب جديدة (علامة ↗ بالزاوية) لتسجيل الدخول بجوجل، أو استخدم البريد الإلكتروني.' 
            : 'Due to browser security constraints inside the iframe, please open the app in a new tab (click ↗ at top right) to sign in with Google, or use email login.'
        );
      } else {
        setError(getErrorMessage(err));
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-zinc-200 rounded-3xl shadow-sm space-y-6">
      <h2 className="text-2xl font-black text-zinc-900 text-center font-heading">
        {isLogin ? (language === 'ar' ? 'تسجيل الدخول' : 'Login') : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')}
      </h2>
      
      {error && <p className="text-rose-500 text-xs text-center bg-rose-50 p-2 rounded-lg">{error}</p>}
      
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder={language === 'ar' ? 'الاسم' : 'Name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl p-3 focus:border-[#E51E2A] outline-none"
              required
            />
            <input
              type="tel"
              placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone'}
              value={phone}
              onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
              className="w-full border border-zinc-200 rounded-xl p-3 focus:border-[#E51E2A] outline-none"
              required
            />
          </>
        )}
        <input
          type="email"
          placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-zinc-200 rounded-xl p-3 focus:border-[#E51E2A] outline-none"
          required
        />
        <input
          type="password"
          placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-zinc-200 rounded-xl p-3 focus:border-[#E51E2A] outline-none"
          required
        />
        <button type="submit" className="w-full bg-[#E51E2A] text-white rounded-xl p-3 font-bold hover:bg-[#c81520] transition-colors cursor-pointer">
          {isLogin ? (language === 'ar' ? 'تسجيل الدخول' : 'Login') : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-zinc-500">{language === 'ar' ? 'أو' : 'Or'}</span>
        </div>
      </div>

      <button 
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-2 border border-zinc-200 rounded-xl p-3 text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {language === 'ar' ? 'تسجيل الدخول باستخدام جوجل' : 'Sign in with Google'}
      </button>
      
      <button 
        onClick={() => setIsLogin(!isLogin)} 
        className="w-full text-xs text-zinc-600 mt-4 underline text-center cursor-pointer"
      >
        {isLogin ? (language === 'ar' ? 'تحتاج إلى حساب؟ أنشئ حساباً' : 'Need an account? Signup') : (language === 'ar' ? 'لديك حساب بالفعل؟ سجل الدخول' : 'Already have an account? Login')}
      </button>
    </div>
  );
};
