import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Map as MapIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MAIN_BRANCH = {
  nameAr: 'المطعم الرئيسي (فرع فريال)',
  nameEn: 'Main Restaurant (Feryal Branch)',
  addressAr: 'محافظة أسيوط - فريال - خلف مستشفى العقاد',
  addressEn: 'Assiut Governorate - Feryal - Behind El-Akkad Hospital',
  phone: '01091266737',
  hoursAr: '11:00 ص - 02:00 ص',
  hoursEn: '11:00 AM - 02:00 AM',
  mapUrl: 'https://maps.google.com/?q=El-Akkad+Hospital+Assiut',
  image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
};

export const BranchesView: React.FC = () => {
  const { settings, language, setCurrentView } = useApp();

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSubject, setFormSubject] = useState<'order_inquiry' | 'feedback' | 'catering' | 'complaint'>('order_inquiry');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const phoneNumber = settings.phone || MAIN_BRANCH.phone;
  const whatsappNumber = settings.whatsapp || MAIN_BRANCH.phone;
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, '');

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formMessage.trim()) return;

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormName('');
      setFormPhone('');
      setFormMessage('');
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-br from-zinc-50 via-white to-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 text-start relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E51E2A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E51E2A]/10 text-[#E51E2A] border border-[#E51E2A]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'خدمة سريعة وضيافة أصيلة' : 'Direct Support & Orders'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 font-heading tracking-tight">
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            {language === 'ar'
              ? 'تواصل معنا مباشرة لتسجيل طلباتك، الاستفسارات، أو حجز الوجبات والمناسبات، أو شرفنا بزيارتك في مطعمنا.'
              : 'Get in touch directly for instant orders, inquiries, or party reservations, or visit us at our restaurant.'}
          </p>
        </div>
      </div>

      {/* 2. Single Branch Detail */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-[#E51E2A]" />
          <h2 className="text-xl font-bold text-zinc-900 font-heading">
            {language === 'ar' ? 'موقع المطعم' : 'Restaurant Location'}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm max-w-4xl mx-auto">
          <div className="relative h-48 sm:h-64 w-full">
            <img
              src={MAIN_BRANCH.image}
              alt={MAIN_BRANCH.nameEn}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E51E2A] text-white">
                  {language === 'ar' ? 'صالة مكيفة ومجهزة' : 'Dine-in Ready'}
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-zinc-900 font-heading">
                {language === 'ar' ? MAIN_BRANCH.nameAr : MAIN_BRANCH.nameEn}
              </h2>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-start">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-semibold uppercase tracking-wider">{language === 'ar' ? 'العنوان' : 'Address'}</span>
                </div>
                <p className="text-sm text-zinc-900 font-medium">
                  {language === 'ar' ? MAIN_BRANCH.addressAr : MAIN_BRANCH.addressEn}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold uppercase tracking-wider">{language === 'ar' ? 'مواعيد العمل' : 'Hours'}</span>
                </div>
                <p className="text-sm text-zinc-900 font-medium font-mono">
                  {language === 'ar' ? MAIN_BRANCH.hoursAr : MAIN_BRANCH.hoursEn}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <a
                href={MAIN_BRANCH.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 hover:text-[#E51E2A] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>{language === 'ar' ? 'افتح على خرائط جوجل' : 'Open in Google Maps'}</span>
              </a>
              <a
                href={`tel:${phoneNumber}`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>{language === 'ar' ? 'اتصل بالمطعم' : 'Call Restaurant'} ({phoneNumber})</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Social Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp Card */}
        <div className="bg-white border border-zinc-200 hover:border-emerald-500/50 transition-all rounded-2xl p-5 text-start flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-heading">
                {language === 'ar' ? 'محادثة واتساب الفورية' : 'WhatsApp Chat'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {language === 'ar' ? 'أرسل موقعك أو استفسارك مباشرة' : 'Send your location or inquiries'}
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100">
            <a
              href={`https://wa.me/20${cleanWhatsapp.replace(/^0+/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'فتح المحادثة' : 'Chat on WhatsApp'}</span>
            </a>
          </div>
        </div>

        {/* Call Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-start flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#E51E2A]/10 border border-[#E51E2A]/20 text-[#E51E2A] flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-heading">
                {language === 'ar' ? 'رقم الهاتف الموحد' : 'Direct Phone Line'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                {phoneNumber}
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100">
            <a
              href={`tel:${phoneNumber}`}
              className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#E51E2A]" />
              <span>{language === 'ar' ? 'اتصل الآن' : 'Call Now'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Feedback Section */}
      <div className="text-start">
        <form
          onSubmit={handleSubmitMessage}
          className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm max-w-3xl mx-auto"
        >
          <div className="space-y-1 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#E51E2A]" />
              <h3 className="text-lg font-bold text-zinc-900 font-heading">
                {language === 'ar' ? 'أرسل رسالة أو اقتراح للإدارة' : 'Send a Message or Feedback'}
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              {language === 'ar'
                ? 'رأيك يهمنا دائماً لتحسين الخدمة وتقديم أفضل تجربة أكل.'
                : 'Your feedback helps us provide the best dining experience.'}
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2 my-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-zinc-900">
                {language === 'ar' ? 'تم استلام رسالتك بنجاح!' : 'Message Received!'}
              </h4>
              <p className="text-xs text-zinc-600">
                {language === 'ar'
                  ? 'شكراً لتواصلك مع فرانك برجر، سيقوم فريقنا بالرد عليك في أقرب وقت.'
                  : 'Thank you for reaching out to Frank Burger, our team will respond promptly.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'} <span className="text-[#E51E2A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'} <span className="text-[#E51E2A]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 font-mono focus:outline-none focus:border-[#E51E2A]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {language === 'ar' ? 'نوع التواصل' : 'Topic'}
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 focus:outline-none focus:border-[#E51E2A]"
                >
                  <option value="order_inquiry">
                    {language === 'ar' ? 'استفسار عن طلب أو المنيو' : 'Order or Menu Inquiry'}
                  </option>
                  <option value="feedback">
                    {language === 'ar' ? 'رأي أو اقتراح صنف جديد' : 'General Feedback & Suggestion'}
                  </option>
                  <option value="catering">
                    {language === 'ar' ? 'حجز مناسبات أو وجبات عمل' : 'Catering & Event Bookings'}
                  </option>
                  <option value="complaint">
                    {language === 'ar' ? 'شكوى بخصوص طلب سابق' : 'Complaint about previous order'}
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {language === 'ar' ? 'نص الرسالة' : 'Your Message'} <span className="text-[#E51E2A]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب رسالتك أو استفسارك هنا...'
                      : 'Type your message or inquiry here...'
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#E51E2A] resize-none"
                />
              </div>

              <div className="md:col-span-2 pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إرسال الرسالة للإدارة' : 'Submit Message'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

    </div>
  );
};
