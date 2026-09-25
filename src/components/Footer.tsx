import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  ShieldCheck,
  Heart,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { currentView, setCurrentView, setActiveMenuCategory, settings, branches, language, t } = useApp();

  return (
    <footer className="bg-zinc-100 border-t border-zinc-200 text-zinc-600 text-xs text-start">
      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Col 1: Brand & Slogan */}
          <div className="space-y-4">
            <div
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img 
                src="https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696964/Artboard_2_9x.png" 
                alt="Frank Burger Logo" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {language === 'ar' ? settings.sloganAr : settings.sloganEn}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings?.socialInstagram || 'https://instagram.com/frankburger'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-zinc-200 hover:bg-[#E51E2A] text-zinc-600 hover:text-white flex items-center justify-center transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialFacebook || 'https://facebook.com/frankburger'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-zinc-200 hover:bg-[#E51E2A] text-zinc-600 hover:text-white flex items-center justify-center transition-all"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${(settings?.whatsapp || '+201001234567').replace(/\+/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-zinc-200 hover:bg-emerald-600 text-zinc-600 hover:text-white flex items-center justify-center transition-all"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-black font-bold text-sm font-heading uppercase tracking-wider">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#E51E2A] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'الرئيسية' : 'Home'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveMenuCategory('all'); setCurrentView('menu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#E51E2A] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'المنيو' : 'Menu'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('tracking');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#E51E2A] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'تتبع طلبك' : 'Track Order'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('branches');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#E51E2A] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#E51E2A] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'عنا' : 'About Us'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Restaurant Location */}
          <div className="space-y-3">
            <h4 className="text-black font-bold text-sm font-heading uppercase tracking-wider">
              {language === 'ar' ? 'عنوان المطعم' : 'Restaurant Location'}
            </h4>
            <div className="space-y-1.5 text-xs text-start">
              <span className="text-xs text-zinc-700 block leading-relaxed font-medium">
                {language === 'ar' ? 'أسيوط - فريال، أمام مستشفى العقاد' : 'Asyut - Ferial, in front of El-Akkad Hospital'}
              </span>
            </div>
          </div>

          {/* Col 4: Hotline & Customer Care */}
          <div className="space-y-3 text-start">
            <h4 className="text-black font-bold text-sm font-heading uppercase tracking-wider">
              {language === 'ar' ? 'خدمة العملاء والطلب الفوري' : 'Hotline & Support'}
            </h4>
            <div className="space-y-2">
              <a
                href={`tel:${(settings.phone || '01091266737').replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-2 text-zinc-700 hover:text-[#E51E2A] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#E51E2A] shrink-0" />
                <span dir="ltr" className="font-mono font-bold text-sm inline-block">
                  {settings.phone || '01091266737'}
                </span>
              </a>

              <a
                href={`https://wa.me/20${(settings.whatsapp || '01091266737').replace(/[^0-9]/g, '').replace(/^0+/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span dir="ltr" className="font-mono font-bold text-sm inline-block">
                  {settings.whatsapp || '01091266737'}
                </span>
              </a>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{language === 'ar' ? 'يوميًا: 11:00 ص - 03:30 ص' : 'Daily: 11 AM - 3:30 AM'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-zinc-200 bg-white py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 text-center">
          <div>
            © {new Date().getFullYear()} FRANK BURGER. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>{language === 'ar' ? 'تطوير بواسطة' : 'Developed by'}</span>
            <a
              href="https://bytera-tech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-zinc-700 hover:text-[#E51E2A] transition-colors"
            >
              Bytera
            </a>
          </div>
        </div>
      </div>
    </footer>
  );

};
