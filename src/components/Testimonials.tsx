import React from 'react';
import { useApp } from '../context/AppContext';
import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';

export const Testimonials: React.FC = () => {
  const { reviews, language } = useApp();
  
  // Filter only approved reviews
  const approvedReviews = reviews.filter((r) => r.isApproved);
  
  if (approvedReviews.length === 0) return null;

  return (
    <section className="py-16 bg-[#0a0a0c] border-t border-[#181820]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white font-heading uppercase italic tracking-tight mb-4">
            {language === 'ar' ? 'آراء عملائنا' : 'What Our Customers Say'}
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'نفتخر بثقة عملائنا ونسعى دائماً لتقديم أفضل تجربة طعام ممكنة'
              : 'We are proud of our customers trust and always strive to provide the best dining experience.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedReviews.slice(0, 6).map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#121216] border border-[#24242e] rounded-3xl p-6 relative group hover:border-[#E51E2A]/50 transition-colors"
            >
              <Quote className="absolute top-6 end-6 w-10 h-10 text-zinc-800 group-hover:text-[#E51E2A]/20 transition-colors" />
              
              <div className="flex gap-1 text-[#E51E2A] mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-zinc-700'}`}
                  />
                ))}
              </div>
              
              <p className="text-zinc-300 mb-6 text-sm leading-relaxed relative z-10">
                "{language === 'ar' ? review.commentAr : review.commentEn}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 overflow-hidden">
                  {review.customerAvatar ? (
                    <img src={review.customerAvatar} alt={review.customerName} className="w-full h-full object-cover" />
                  ) : (
                    review.customerName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">
                    {review.customerName}
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    {new Date(review.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
