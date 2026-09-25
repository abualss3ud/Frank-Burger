import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  ShoppingBag,
  Globe,
  Menu as MenuIcon,
  X,
  History,
  ShieldCheck,
  Smartphone,
  LogOut,
  LogIn,
  User,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const {
    language,
    toggleLanguage,
    t,
    currentView,
    setCurrentView,
    setActiveMenuCategory,
    cartItemCount,
    setIsCartOpen,
    myDeviceOrders,
    deviceInfo,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Exact requested 5 tabs in Navbar:
  // الرئيسية - المنيو - تتبع طلبك - اتصل بنا - عنا
  const navItems = [
    { view: 'home' as const, label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { view: 'menu' as const, label: language === 'ar' ? 'المنيو' : 'Menu' },
    { view: 'tracking' as const, label: language === 'ar' ? 'تتبع طلبك' : 'Track Order' },
    { view: 'branches' as const, label: language === 'ar' ? 'اتصل بنا' : 'Contact Us' },
    { view: 'about' as const, label: language === 'ar' ? 'عنا' : 'About Us' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-start cursor-pointer group"
          >
            <img 
              src="https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696964/Artboard_2_9x.png" 
              alt="Frank Burger" 
              className="h-7 sm:h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    if (item.view === 'menu') setActiveMenuCategory('all');
                    setCurrentView(item.view);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#E51E2A] bg-zinc-100 shadow-inner font-bold'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="hidden md:flex px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors items-center gap-1 cursor-pointer border border-zinc-200"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Previous Orders Button (Identified by Device IP / MAC) */}
            {/* Profile / Auth Button */}
            <button
              onClick={() => {
                setCurrentView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                currentView === 'profile'
                  ? 'bg-zinc-100 text-[#E51E2A] border-[#E51E2A]/50'
                  : 'bg-zinc-50 text-zinc-600 hover:text-black hover:bg-zinc-100 border-zinc-200'
              }`}
            >
              {user ? <User className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {user ? (language === 'ar' ? 'حسابي' : 'My Account') : (language === 'ar' ? 'تسجيل دخول' : 'Login')}
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-1.5 rounded-lg bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cart')}</span>
              {cartItemCount > 0 && (
                <span className="bg-white text-[#E51E2A] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                if (item.view === 'menu') setActiveMenuCategory('all');
                setCurrentView(item.view);
                setIsMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full text-start px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                currentView === item.view
                  ? 'bg-[#E51E2A] text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-2 border-t border-zinc-200 mt-2 flex flex-col gap-1.5">
            {/* Mobile Language Switch */}
            <button
              onClick={() => {
                toggleLanguage();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-start px-3 py-2.5 rounded-lg text-xs font-semibold bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-black flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E51E2A]" />
                <span>{language === 'ar' ? 'اللغة: العربية' : 'Language: English'}</span>
              </div>
              <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded text-black font-mono">
                {language === 'ar' ? 'EN' : 'عربي'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );

};

