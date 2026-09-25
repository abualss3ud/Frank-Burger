import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ExitIntentSnackbar: React.FC = () => {
  const { cart, language, setIsCartOpen } = useApp();
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // If mouse leaves from the top (likely going to address bar to close/navigate away)
      if (e.clientY <= 0 && cart.length > 0 && !hasShown) {
        setShow(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cart.length, hasShown]);

  // Auto-hide after 8 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (show) {
      timeout = setTimeout(() => setShow(false), 8000);
    }
    return () => clearTimeout(timeout);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto max-w-sm"
        >
          <div className="bg-[#18181c] border-2 border-[#E51E2A] p-4 rounded-2xl shadow-[0_10px_40px_rgba(229,30,42,0.15)] flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-[#E51E2A]/10 text-[#E51E2A] flex items-center justify-center relative">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E51E2A] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#18181c]">
                {cart.length}
              </span>
            </div>
            
            <div className="flex-1 text-center sm:text-start">
              <h4 className="text-sm font-bold text-white mb-1">
                {language === 'ar' ? 'مهلاً! نسيت وجبتك؟' : 'Wait! Did you forget something?'}
              </h4>
              <p className="text-xs text-zinc-400">
                {language === 'ar' 
                  ? 'سلة تسوقك لا تزال ممتلئة بوجبات فرانك الشهية. أتمم طلبك الآن!' 
                  : 'Your cart is still full of delicious Frank meals. Complete your order now!'}
              </p>
            </div>
            
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => {
                  setShow(false);
                  setIsCartOpen(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#E51E2A] hover:bg-[#c81520] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
              >
                {language === 'ar' ? 'إتمام الطلب' : 'Checkout'}
              </button>
              <button
                onClick={() => setShow(false)}
                className="p-2 bg-[#202028] hover:bg-[#2a2a35] text-zinc-400 hover:text-white rounded-xl transition-colors flex items-center justify-center"
                title={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
