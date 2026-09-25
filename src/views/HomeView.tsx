import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import {
  Clock,
  Truck,
  ShieldCheck,
  Award,
  ArrowRight,
  ArrowLeft,
  Flame,
  Star,
  CheckCircle2,
  Utensils,
  ChefHat,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Testimonials } from '../components/Testimonials';
const heroBurgerImg = "https://res.cloudinary.com/fwxyu7hh/image/upload/v1787756297/Imgess.jpg";

let globalHasShownIntro = false;

export const HomeView: React.FC = () => {
  const [showIntro, setShowIntro] = React.useState(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__hasShownFrankIntro || globalHasShownIntro) return false;
      const hasShown = localStorage.getItem('frank_intro_shown');
      if (hasShown) {
        globalHasShownIntro = true;
        (window as any).__hasShownFrankIntro = true;
        return false;
      }
    }
    return true;
  });

  React.useEffect(() => {
    if (showIntro) {
      globalHasShownIntro = true;
      if (typeof window !== 'undefined') {
        (window as any).__hasShownFrankIntro = true;
        localStorage.setItem('frank_intro_shown', 'true');
      }
      const timer = setTimeout(() => setShowIntro(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  const {
    products,
    categories,
    offers,
    setCurrentView,
    setActiveMenuCategory,
    setSearchQuery,
    addToCart,
    language,
    t,
  } = useApp();

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <div className="pb-20 bg-white">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden pointer-events-none select-none"
          >
            {/* Ambient Radial Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#E51E2A]/10 rounded-full blur-3xl" />

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-5 text-center px-4"
            >
              {/* Logo with gentle floating spring animation */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="relative"
              >
                <img
                  src="https://res.cloudinary.com/fwxyu7hh/image/upload/v1787696964/Artboard_2_9x.png"
                  alt="Frank Burger Logo"
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain filter drop-shadow-lg"
                />
              </motion.div>

              {/* Title & Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-1"
              >
                <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-zinc-900 uppercase">
                  FRANK BURGER
                </h2>
                <p className="text-xs font-bold text-[#E51E2A] tracking-widest uppercase">
                  {language === 'ar' ? 'طعم البرجر الأصلي' : 'The Real Burger Experience'}
                </p>
              </motion.div>

              {/* Sleek Progress Track */}
              <div className="w-32 h-1 bg-zinc-100 rounded-full overflow-hidden mt-2">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-[#E51E2A] rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-16 sm:space-y-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {/* 1. IMMERSIVE HERO SECTION - LIGHT THEME */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-zinc-50 py-24 sm:py-32 xl:py-40">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#E51E2A]/10 blur-[120px] rounded-full mix-blend-multiply" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#E51E2A]/5 blur-[100px] rounded-full mix-blend-multiply" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8 text-center lg:text-start"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm backdrop-blur-md">
                  <Flame className="w-4 h-4 text-[#E51E2A]" />
                  <span className="text-xs font-bold tracking-wide text-zinc-800 uppercase">
                    {language === 'ar' ? 'الطعم الأصلي المميّز' : 'The Signature Taste'}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 leading-[1.05] font-heading tracking-tight">
                  {t('heroTitlePart1')} <br/>
                  <span className="text-[#E51E2A] inline-block mt-2 relative">
                    {t('heroTitlePart2')}
                    <div className="absolute -bottom-2 left-0 w-full h-2 bg-[#E51E2A]/20 rounded-full" />
                  </span>
                </h1>
                <p className="text-zinc-600 max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl leading-relaxed font-medium">
                  {t('heroDesc')}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                  <button
                    onClick={() => { setCurrentView('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E51E2A] hover:bg-[#c81520] text-white text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#E51E2A]/20 flex items-center justify-center gap-2"
                  >
                    <span>{t('heroOrderNow')}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setCurrentView('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-bold border border-zinc-200 shadow-sm transition-all backdrop-blur-sm"
                  >
                    {t('heroViewMenu')}
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex justify-center items-center lg:justify-end mt-12 lg:mt-0"
              >
                <div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-gradient-to-tr from-[#E51E2A]/20 to-transparent absolute blur-2xl" />
                <div className="relative group">
                  <img 
                    src={heroBurgerImg} 
                    alt="Delicious Burger" 
                    className="relative z-10 w-[320px] sm:w-[500px] rounded-full object-cover aspect-square shadow-2xl border-[8px] border-white group-hover:scale-[1.02] transition-transform duration-700"
                  />
                  
                  {/* Floating Metric 1 */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute -top-4 -left-4 sm:top-10 sm:-left-10 p-3 sm:p-4 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 flex items-center gap-3 backdrop-blur-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#E51E2A]/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#E51E2A] fill-[#E51E2A]" />
                    </div>
                    <div>
                      <div className="text-zinc-900 text-sm font-bold">4.9/5</div>
                      <div className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
                        {language === 'ar' ? 'تقييم العملاء' : 'Rating'}
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Metric 2 */}
                  <motion.div 
                    animate={{ y: [0, 15, 0] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute -bottom-4 -right-4 sm:bottom-10 sm:-right-10 p-3 sm:p-4 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 flex items-center gap-3 backdrop-blur-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-zinc-900 text-sm font-bold">15-20 {language === 'ar' ? 'د' : 'Min'}</div>
                      <div className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
                        {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </motion.div>

      {/* 2. REFINED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 font-heading tracking-tight">
              {language === 'ar' ? 'قائمة الطعام' : 'Our Menu'}
            </h2>
            <p className="text-sm text-zinc-500 font-medium">
              {language === 'ar' ? 'اكتشف تشكيلتنا الواسعة من أشهى المأكولات' : 'Discover our wide variety of delicious meals'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const catName = language === 'ar' ? cat.nameAr : cat.nameEn;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSearchQuery('');
                  setActiveMenuCategory(cat.id);
                  setCurrentView('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative aspect-square sm:aspect-[4/5] w-full rounded-3xl overflow-hidden bg-zinc-100 cursor-pointer text-start flex flex-col justify-end"
              >
                <img
                  src={cat.image}
                  alt={catName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 p-4 sm:p-5">
                  <h3 className="text-white font-bold text-sm sm:text-base font-heading">
                    {catName}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. BEST SELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#E51E2A]" />
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 font-heading tracking-tight">
                {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers'}
              </h2>
            </div>
            <p className="text-sm text-zinc-500 font-medium">
              {language === 'ar' ? 'الطلبات المفضلة لدى عملائنا' : 'Our customers favorite picks'}
            </p>
          </div>
          <button
            onClick={() => { setActiveMenuCategory('all'); setCurrentView('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-sm font-bold text-zinc-900 transition-colors"
          >
            <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
            {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <button
            onClick={() => { setActiveMenuCategory('all'); setCurrentView('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="mt-6 sm:hidden w-full flex justify-center items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-100 active:bg-zinc-200 text-sm font-bold text-zinc-900 transition-colors"
          >
            <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
            {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
      </section>

      {/* 4. PREMIUM DEALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900 rounded-[2rem] p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E51E2A]/20 blur-[100px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-start max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E51E2A]/20 border border-[#E51E2A]/30 mb-4">
                <Percent className="w-3.5 h-3.5 text-[#E51E2A]" />
                <span className="text-[10px] font-bold text-[#E51E2A] uppercase tracking-wider">
                  {language === 'ar' ? 'عروض التوفير' : 'Saver Deals'}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight mb-4">
                {language === 'ar' ? 'بوكسات وعروض عائلية حصرية' : 'Exclusive Family Deals'}
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {language === 'ar' ? 'استمتع بأفضل قيمة وأكبر توفير مع تشكيلة البوكسات والعروض العائلية المصممة لترضي جميع الأذواق.' : 'Enjoy the best value and biggest savings with our selection of family boxes and combos designed to satisfy every taste.'}
              </p>
            </div>

            <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offers.filter((o) => o.isActive).slice(0, 2).map((offer) => {
                const oTitle = language === 'ar' ? offer.titleAr : offer.titleEn;
                const oDesc = language === 'ar' ? offer.descriptionAr : offer.descriptionEn;
                return (
                  <div
                    key={offer.id}
                    className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700/50 hover:border-zinc-500 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group text-start"
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={offer.image}
                        alt={oTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                      <div className="absolute top-3 left-3 bg-[#E51E2A] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md font-mono tracking-wide">
                        {offer.discountPercentage}% OFF
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between -mt-8 relative z-10">
                      <div>
                        <h3 className="text-lg font-bold text-white font-heading mb-1 drop-shadow-md">
                          {oTitle}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {oDesc}
                        </p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-zinc-700/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-white font-mono leading-none">
                            {offer.price} <span className="text-xs font-bold text-[#E51E2A]">{t('currency')}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 line-through font-mono mt-1">
                            {offer.originalPrice} {t('currency')}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const promoProd = products.find((p) => p.id === offer.includedProductIds?.[0]) || products[0];
                            addToCart(promoProd, undefined, [], 1, `عرض: ${oTitle}`);
                          }}
                          className="w-10 h-10 rounded-full bg-white text-zinc-900 hover:bg-[#E51E2A] hover:text-white flex items-center justify-center transition-colors shadow-sm"
                        >
                          <ArrowLeft className="w-4 h-4 rtl:hidden" />
                          <ArrowRight className="w-4 h-4 ltr:hidden" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE FRANK STANDARD (WHY US) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] font-bold text-[#E51E2A] uppercase tracking-widest">
            {language === 'ar' ? 'معايير الجودة' : 'The Frank Standard'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 font-heading mt-2 mb-3 tracking-tight">
            {t('whyTitle')}
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed font-medium">
            {t('whySubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { icon: Award, title: t('why1Title'), desc: t('why1Desc') },
            { icon: Truck, title: t('why2Title'), desc: t('why2Desc') },
            { icon: ShieldCheck, title: t('why3Title'), desc: t('why3Desc') },
            { icon: Clock, title: t('why4Title'), desc: t('why4Desc') }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 group">
              <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:bg-[#E51E2A] group-hover:border-[#E51E2A] transition-colors duration-300 shadow-sm">
                <item.icon className="w-7 h-7 text-zinc-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-heading mb-1.5">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium px-4">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CUSTOMER REVIEWS SECTION */}
      <Testimonials />

      {/* 7. REFINED BOTTOM CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-[#E51E2A] p-8 sm:p-16 text-center text-white shadow-2xl shadow-[#E51E2A]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-tight leading-tight">
              {t('ctaTitle')}
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-medium">
              {t('ctaDesc')}
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setActiveMenuCategory('all'); setCurrentView('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-white text-[#E51E2A] font-bold text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 shadow-xl inline-flex items-center gap-2"
              >
                <span>{t('ctaButton')}</span>
                {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};
