import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Share2,
  MessageCircle,
  Play,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { formatPKR, PAKISTAN_MAJOR_CITIES } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../lib/api';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number, selectedAttributes: Record<string, string>, variant?: ProductVariant) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onBuyNow
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.attributes && product.attributes.length > 0) {
      product.attributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          initial[attr.name] = attr.options[0];
        }
      });
    }
    return initial;
  });

  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'shipping'>('desc');
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review submission state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCity, setReviewerCity] = useState('Lahore');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewsList, setReviewsList] = useState(product.reviewsList || []);

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  // Find matching variant if any
  const matchedVariant = product.variants?.find(v => {
    return Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val);
  });

  const finalUnitPrice = product.salePrice + (matchedVariant?.priceAdjustment || 0);

  const handleAttributeChange = (attributeName: string, optionValue: string) => {
    setSelectedAttributes(prev => ({ ...prev, [attributeName]: optionValue }));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedAttributes, matchedVariant);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onBuyNow(product, quantity, selectedAttributes, matchedVariant);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) return;

    try {
      setReviewSubmitting(true);
      const newRev = await api.addReview(product.id, {
        userName: reviewerName.trim(),
        userCity: reviewerCity,
        rating: reviewerRating,
        comment: reviewerComment.trim()
      });

      setReviewsList(prev => [newRev, ...prev]);
      setReviewSuccess(true);
      setReviewerComment('');
      setReviewerName('');
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello HS Solution, I want to inquire about: "${product.name}" (SKU: ${product.sku}) listed at ${formatPKR(finalUnitPrice)}.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono truncate">
            <span>HS Solution</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-cyan-700">{product.brand}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px] text-slate-800 font-medium">{product.name}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Gallery & Images */}
            <div className="md:col-span-6 space-y-4">
              {/* Main image / video preview */}
              <div className="relative aspect-square rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center group">
                {showVideo && product.videoUrl ? (
                  <iframe
                    src={product.videoUrl.replace('watch?v=', 'embed/')}
                    title={product.name}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={product.images[selectedImageIndex] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Discount Badge */}
                {product.discountPercentage > 0 && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-cyan-300 text-cyan-800 font-mono font-bold text-xs px-2.5 py-1 rounded-xs uppercase tracking-wider shadow-xs">
                    -{product.discountPercentage}% OFF
                  </div>
                )}

                {/* Video Switch Button */}
                {product.videoUrl && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white border border-slate-300 text-slate-900 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-900" />
                    <span>{showVideo ? 'Photos' : 'Video'}</span>
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImageIndex(i);
                        setShowVideo(false);
                      }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition bg-slate-50 ${
                        selectedImageIndex === i && !showVideo
                          ? 'border-cyan-600 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Features Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center">
                  <Truck className="w-4 h-4 text-cyan-700 mb-1" />
                  <span className="font-bold text-slate-900">COD Available</span>
                  <span className="text-[10px] text-slate-500">Nationwide</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center">
                  <RotateCcw className="w-4 h-4 text-emerald-700 mb-1" />
                  <span className="font-bold text-slate-900">7-Day Warranty</span>
                  <span className="text-[10px] text-slate-500">Fast Replacement</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center">
                  <ShieldCheck className="w-4 h-4 text-cyan-700 mb-1" />
                  <span className="font-bold text-slate-900">100% Genuine</span>
                  <span className="text-[10px] text-slate-500">Tested Quality</span>
                </div>
              </div>
            </div>

            {/* Right: Info, Price, Variants, Buttons */}
            <div className="md:col-span-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
                  <span className="text-cyan-700 uppercase font-bold">
                    {product.brand}
                  </span>
                  <span className="text-slate-400">SKU: {product.sku}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Reviews summary */}
                <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                  <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-500 font-normal">/ 5.0</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-slate-600 hover:text-cyan-700 underline"
                  >
                    {product.reviewCount || reviewsList.length} Customer Reviews
                  </button>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock Dispatch
                  </span>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPKR(finalUnitPrice)}
                  </span>
                  {product.originalPrice > product.salePrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through font-mono">
                      {formatPKR(product.originalPrice)}
                    </span>
                  )}
                  {product.discountPercentage > 0 && (
                    <span className="text-emerald-700 text-xs font-mono font-bold">
                      SAVE {formatPKR(product.originalPrice - product.salePrice)} (-{product.discountPercentage}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  Cash on Delivery nationwide. Free delivery on orders above Rs. 2,999!
                </p>
              </div>

              {/* Dynamic Variant Selectors */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="space-y-4 pt-1">
                  {product.attributes.map(attr => (
                    <div key={attr.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-700 uppercase tracking-wider">
                          Select {attr.name}:
                        </span>
                        <span className="text-cyan-700 font-bold">
                          {selectedAttributes[attr.name]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {attr.options.map(optionVal => {
                          const isSelected = selectedAttributes[attr.name] === optionVal;
                          return (
                            <button
                              key={optionVal}
                              onClick={() => handleAttributeChange(attr.name, optionVal)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-600 hover:text-cyan-700'
                              }`}
                            >
                              {optionVal}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Stock status */}
              <div className="flex items-center gap-6 pt-2 font-mono">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Quantity
                  </span>
                  <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 text-base font-bold transition"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold text-slate-900 text-center min-w-[40px]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 text-base font-bold transition disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Availability
                  </span>
                  {product.stock <= 0 ? (
                    <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-sm">
                      Sold Out
                    </span>
                  ) : product.stock <= 4 ? (
                    <span className="inline-block text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-sm">
                      Only {product.stock} units left!
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-sm">
                      Ready to Ship ({product.stock} units)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-xs ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : justAdded
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-xs'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-5 h-5 text-white" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNowClick}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-xs disabled:opacity-50"
                  >
                    Buy Now (COD)
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-3.5 rounded-xl border transition ${
                      isFavorited
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:text-rose-600 hover:border-rose-300'
                    }`}
                    title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Secondary Actions: WhatsApp & Share */}
                <div className="flex items-center justify-between text-xs pt-1 text-slate-500 font-mono">
                  <a
                    href={`https://wa.me/923001234567?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-700 hover:underline font-semibold"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Inquire on WhatsApp Direct</span>
                  </a>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 hover:text-cyan-700 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Link Copied!' : 'Share Product'}</span>
                  </button>
                </div>
              </div>

              {/* Delivery Estimator for Pakistan Cities */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-cyan-700 font-bold">
                    <MapPin className="w-4 h-4" />
                    Pakistan Courier Coverage:
                  </span>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-900 font-bold px-2 py-1 rounded-md outline-none cursor-pointer text-xs"
                  >
                    {PAKISTAN_MAJOR_CITIES.slice(0, 10).map(c => (
                      <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Transit Time:</span>
                  <strong className="text-slate-900">
                    {selectedCity === 'Lahore' || selectedCity === 'Islamabad' ? '1-2 Working Days (TCS Express)' : '2-4 Working Days'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery Charges:</span>
                  <strong className="text-emerald-700 font-bold">
                    {finalUnitPrice >= 2999 ? 'FREE Delivery' : 'Rs. 180 - 220'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tabs: Description, Specifications, Reviews, Delivery & Returns */}
          <div className="border-t border-slate-200 pt-6 space-y-6">
            <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto text-sm font-mono">
              <button
                onClick={() => setActiveTab('desc')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'desc'
                    ? 'border-cyan-600 text-cyan-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'specs'
                    ? 'border-cyan-600 text-cyan-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tech Specs
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-cyan-600 text-cyan-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Customer Reviews</span>
                <span className="text-xs text-slate-400 font-mono">
                  ({reviewsList.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'shipping'
                    ? 'border-cyan-600 text-cyan-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Warranty & Delivery
              </button>
            </div>

            {/* Tab 1: Description */}
            {activeTab === 'desc' && (
              <div className="text-sm text-slate-700 leading-relaxed space-y-4 max-w-4xl">
                <p className="text-base font-semibold text-slate-900">
                  {product.shortDescription}
                </p>
                <div className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {product.description}
                </div>
              </div>
            )}

            {/* Tab 2: Specifications */}
            {activeTab === 'specs' && (
              <div className="max-w-2xl font-mono text-xs">
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                  <div className="grid grid-cols-3 p-3 bg-slate-50 text-cyan-800 font-bold">
                    <span>Feature</span>
                    <span className="col-span-2">Specification</span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-500">Brand</span>
                    <span className="col-span-2 text-slate-900 font-medium">{product.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-500">SKU</span>
                    <span className="col-span-2 text-cyan-700 font-bold">{product.sku}</span>
                  </div>
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-3 p-3">
                      <span className="text-slate-500">{key}</span>
                      <span className="col-span-2 text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Reviews & Write Review */}
            {activeTab === 'reviews' && (
              <div className="space-y-8 max-w-4xl font-mono">
                {/* Write Review Form */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Write a Customer Review</h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="e.g. Asad Malik"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:border-cyan-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">City in Pakistan</label>
                        <select
                          value={reviewerCity}
                          onChange={(e) => setReviewerCity(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:border-cyan-600"
                        >
                          {PAKISTAN_MAJOR_CITIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewerRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewerRating
                                  ? 'fill-amber-400 stroke-amber-400'
                                  : 'stroke-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-600 ml-2">
                          {reviewerRating} Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Review *</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewerComment}
                        onChange={(e) => setReviewerComment(e.target.value)}
                        placeholder="Share your experience (build quality, audio fidelity, charging speed, courier delivery...)"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:border-cyan-600"
                      />
                    </div>

                    {reviewSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4" /> Thank you! Your review has been added.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>

                {/* Existing Reviews List */}
                <div className="space-y-4">
                  {reviewsList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No reviews yet for this product.</p>
                  ) : (
                    reviewsList.map(rev => (
                      <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rev.userName}</span>
                            {rev.userCity && (
                              <span className="text-slate-500 text-[11px]">({rev.userCity})</span>
                            )}
                            <span className="text-emerald-700 text-[10px] flex items-center gap-0.5 font-bold">
                              <Check className="w-3 h-3" /> Verified Buyer
                            </span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{rev.date}</span>
                        </div>

                        <div className="flex items-center text-amber-500 text-xs">
                          {'★'.repeat(rev.rating)}
                          <span className="text-slate-300">{'★'.repeat(5 - rev.rating)}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Shipping & Returns */}
            {activeTab === 'shipping' && (
              <div className="text-xs text-slate-700 space-y-4 max-w-3xl leading-relaxed font-mono">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Pakistan Nationwide Courier Delivery</h4>
                  <p className="text-slate-600">
                    Dispatched via <strong>TCS, Leopards Courier, and Call Courier</strong> to guarantee safe doorstep delivery across all provinces.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi): 1-2 Working Days</li>
                    <li>Other Urban Centers (Faisalabad, Multan, Peshawar, Sialkot): 2-3 Working Days</li>
                    <li>Cash on Delivery (COD) available for all destinations</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-2">
                  <h4 className="font-bold text-cyan-800 text-sm font-['Outfit']">7 Days Check Warranty & Replacement</h4>
                  <p className="text-slate-600">
                    Test your hardware for 7 days after delivery. In case of any technical defect, our customer center arranges an immediate replacement or full refund.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
