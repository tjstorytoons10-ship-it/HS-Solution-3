import React from 'react';
import { Star, ShoppingCart, Heart, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatPKR } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = React.useState(false);

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Extract a clean primary tech specification if available
  const firstSpecKey = product.specifications ? Object.keys(product.specifications)[0] : null;
  const firstSpecVal = firstSpecKey ? product.specifications[firstSpecKey] : null;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white border border-slate-200/90 hover:border-cyan-500 hover:shadow-xl rounded-xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* 1. Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top left tech status tags (Zero-pill discipline: sharp micro-tags with font-mono) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.discountPercentage > 0 && (
            <span className="bg-white/95 backdrop-blur-md text-cyan-700 border border-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider shadow-xs">
              -{product.discountPercentage}% OFF
            </span>
          )}
          {product.bestSeller && (
            <span className="bg-white/95 backdrop-blur-md text-amber-700 border border-amber-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs uppercase tracking-wider shadow-xs">
              TOP RATED
            </span>
          )}
        </div>

        {/* Wishlist button on top right */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg transition shadow-xs z-10 backdrop-blur-md border ${
            isFavorited
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'bg-white/90 border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Low Stock / Out of Stock Banner */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="bg-rose-600 text-white border border-rose-500 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-md">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-mono font-medium px-2 py-0.5 rounded-xs shadow-xs">
              Only {product.stock} units left
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Brand & Rating (Clean unboxed metadata with typographic separators) */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-mono">
            <span className="font-bold text-cyan-700 uppercase text-[11px] truncate max-w-[130px] tracking-wide">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-medium shrink-0 text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span className="text-slate-800 font-semibold">{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-cyan-600 transition">
            {product.name}
          </h3>

          {/* Tech specification preview */}
          {firstSpecVal ? (
            <p className="text-[11px] font-mono text-slate-500 line-clamp-1 mt-1.5 flex items-center gap-1">
              <span className="text-slate-400">{firstSpecKey}:</span>
              <span className="text-slate-700 font-medium">{firstSpecVal}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 line-clamp-1 mt-1 hidden sm:block">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* 3. Pricing & Add to Cart */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                {formatPKR(product.salePrice)}
              </span>
              {product.originalPrice > product.salePrice && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold font-mono block">
              Cash on Delivery (COD)
            </span>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-lg font-semibold text-xs flex items-center justify-center transition shrink-0 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-xs hover:shadow-md'
            }`}
            title="Add to Cart"
            aria-label="Add to cart"
          >
            {justAdded ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
