import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Plus, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  featuredLayout?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, featuredLayout = false }) => {
  const { language, t, addToCart, setActiveProductModal, toggleFavorite, isFavorite } = useApp();

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const isFav = isFavorite(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    if ((product.availableSizes && product.availableSizes.length > 1) || (product.allowedAddonIds && product.allowedAddonIds.length > 0)) {
      setActiveProductModal(product);
    } else {
      const defaultSize = product.availableSizes?.find((s) => s.isDefault) || product.availableSizes?.[0];
      addToCart(product, defaultSize, [], 1);
    }
  };

  return (
    <div
      onClick={() => setActiveProductModal(product)}
      className={`group bg-zinc-50 border border-zinc-200 hover:border-[#E51E2A]/50 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md ${
        featuredLayout ? 'md:flex-row md:items-center' : ''
      }`}
    >
      {/* Top Image Container */}
      <div className={`relative overflow-hidden bg-zinc-100 ${featuredLayout ? 'md:w-1/2 aspect-video md:aspect-square' : 'aspect-[4/3] w-full'}`}>
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Minimal Badges */}
        <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 flex flex-col gap-1 z-10">
          {product.isBestSeller && (
            <span className="bg-[#E51E2A] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {t('badgeBestSeller')}
            </span>
          )}
          {product.isNew && (
            <span className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-zinc-700">
              {t('badgeNew')}
            </span>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="bg-white/90 text-[#E51E2A] text-[10px] font-bold px-2 py-0.5 rounded border border-[#E51E2A]/40">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 p-2 rounded-lg bg-white/80 hover:bg-white text-zinc-900 border border-zinc-200 transition-colors z-10 cursor-pointer"
          title="Add to Favorites"
          aria-label="Add to Favorites"
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-[#E51E2A] fill-[#E51E2A]' : 'text-zinc-500'}`} />
        </button>

        {/* Calories */}
        {product.calories && (
          <div className="absolute bottom-2 left-2.5 rtl:left-auto rtl:right-2.5 bg-white/90 text-[10px] font-medium text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
            {product.calories} {t('calories')}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 font-semibold px-3 py-1 rounded text-xs uppercase">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`p-4 flex flex-col justify-between flex-grow ${featuredLayout ? 'md:w-1/2' : ''}`}>
        <div>
          <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#E51E2A] transition-colors line-clamp-1 font-heading mb-1">
            {name}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs text-zinc-700 font-bold ml-1 rtl:mr-1">
              {product.rating ? product.rating.toFixed(1) : '5.0'}
            </span>
            <span className="text-[10px] text-zinc-500">
              ({product.reviewsCount || Math.floor(Math.random() * 50) + 10} {language === 'ar' ? 'تقييم' : 'reviews'})
            </span>
          </div>

          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4">
            {description}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-zinc-900 font-mono">
              {product.price} <span className="text-xs font-bold text-[#E51E2A]">{t('currency')}</span>
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-zinc-400 line-through font-mono">
                {product.originalPrice}
              </span>
            )}
          </div>

          {product.isAvailable ? (
            <button
              onClick={handleQuickAdd}
              className="px-3 py-1.5 rounded-lg bg-[#E51E2A] hover:bg-[#c81520] text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addToCart')}</span>
            </button>
          ) : (
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-400 font-medium text-xs cursor-not-allowed"
            >
              {t('outOfStock')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

