import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, ShieldCheck, Utensils } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-start">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 font-heading">
          {language === 'ar' ? 'حكاية فرانك برجر' : 'The Frank Burger Story'}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
          {language === 'ar'
            ? 'بدأنا بهدف بسيط: تقديم تجربة برجر حقيقية لا تُنسى. نختار أجود أنواع لحوم الأنجوس الطازجة، ونخبز خبز البريوش يوميًا بالزبدة الطبيعية.'
            : 'We started with one clear obsession: crafting genuine, unforgettable smash burgers using certified Angus beef and daily artisan brioche.'}
        </p>
      </div>

      {/* Grid of Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-2">
          <Award className="w-5 h-5 text-[#E51E2A]" />
          <h3 className="text-base font-bold text-zinc-900 font-heading">
            {language === 'ar' ? 'لحم أنجوس 100% طازج' : '100% Fresh Angus Beef'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'ar'
              ? 'لا نستخدم أي لحوم مجمدة أو إضافات صناعية. كل قطعة لحم تُفرم يومياً وتُشوى أمام عينيك.'
              : 'Zero frozen meats or artificial fillers. Freshly ground daily and smashed to juicy perfection.'}
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-2">
          <Utensils className="w-5 h-5 text-[#E51E2A]" />
          <h3 className="text-base font-bold text-zinc-900 font-heading">
            {language === 'ar' ? 'خبز بريوش بالزبدة الطبيعية' : 'Artisan Butter Brioche'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'ar'
              ? 'خبز بريوش طازج ومحمص بالزبدة الغنية ليمنحك القوام الذهبي الهش الذي يحمل نكهات الصوص.'
              : 'Pillowy, golden brioche toasted in rich natural butter to balance the crispy crust of our beef.'}
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-2">
          <ShieldCheck className="w-5 h-5 text-[#E51E2A]" />
          <h3 className="text-base font-bold text-zinc-900 font-heading">
            {language === 'ar' ? 'أعلى معايير النظافة' : 'Impeccable Food Hygiene'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'ar'
              ? 'نلتزم بأعلى معايير سلامة الغذاء والتعقيم في كل مراحل التحضير، لضمان وجبة آمنة وشهية.'
              : 'Strict adherence to temperature control, sanitization, and premium ingredient storage.'}
          </p>
        </div>
      </div>

      {/* Quality Pledge Quote */}
      <div className="bg-zinc-50 border-l-2 rtl:border-l-0 rtl:border-r-2 border-[#E51E2A] border-y border-r rtl:border-r-2 rtl:border-l border-y-zinc-200 border-r-zinc-200 rtl:border-l-zinc-200 rounded-xl p-6 space-y-2">
        <h4 className="text-sm font-bold text-zinc-900 font-heading">
          {language === 'ar' ? 'عهد الجودة من فرانك برجر' : 'The Frank Quality Promise'}
        </h4>
        <p className="text-xs text-zinc-600 leading-relaxed">
          "{language === 'ar'
            ? 'نحن لا نقدم وجبات سريعة عادية، بل نقدم تجربة طعام استثنائية مشوية بحب وشغف. إذا لم ينل طعم البرجر رضاك التام، سنقوم باستبداله فوراً بدون أي تردد.'
            : 'We do not make ordinary fast food. We deliver an extraordinary culinary craft made with passion. If your meal is not 100% satisfying, we will remake it immediately.'}"
        </p>
        <div className="text-xs font-semibold text-[#E51E2A] pt-1">
          — {language === 'ar' ? 'فريق إدارة فرانك برجر' : 'Frank Burger Culinary Team'}
        </div>
      </div>
    </div>
  );
};

