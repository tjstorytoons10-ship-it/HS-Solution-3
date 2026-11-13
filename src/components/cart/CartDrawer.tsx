import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Check,
  Truck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPKR } from '../../lib/formatters';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreProducts: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onExploreProducts
}) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    totalItemCount,
    freeDeliveryThreshold,
    remainingForFreeDelivery
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  // Estimated delivery calculation in PKR
  const estimatedDelivery = subtotal >= freeDeliveryThreshold ? 0 : 200;
  const finalTotal = Math.max(0, subtotal - discountAmount + estimatedDelivery);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput.trim()) return;

    try {
      setIsApplying(true);
      const msg = await applyCoupon(couponInput.trim());
      setCouponSuccess(msg);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-700" />
              <h2 className="font-extrabold text-slate-900 text-base font-['Outfit']">
                Your Shopping Cart
              </h2>
              <span className="font-mono text-cyan-800 border border-cyan-200 bg-cyan-50 text-xs font-bold px-2 py-0.5 rounded-sm">
                {totalItemCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-mono text-slate-500 hover:text-rose-600 transition px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Shipping Progress Meter */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-cyan-50/80 border-b border-cyan-100 text-xs font-mono">
              <div className="flex items-center justify-between font-bold text-cyan-900 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-cyan-700" />
                  {remainingForFreeDelivery > 0 ? (
                    <>Add {formatPKR(remainingForFreeDelivery)} for <strong>FREE Delivery</strong></>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <Check className="w-4 h-4" /> Unlocked Free Shipping!
                    </span>
                  )}
                </span>
                <span className="text-cyan-700 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4 font-mono">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Discover trending AirPods, smartwatches, and GaN fast chargers!
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExploreProducts();
                  }}
                  className="bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition"
                >
                  Explore Tech Gear
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex gap-3 p-3 rounded-xl bg-white border border-slate-200 relative group shadow-xs"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Selected Variants */}
                      {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px] text-slate-500 font-mono">
                          {Object.entries(item.selectedAttributes).map(([k, v]) => (
                            <span key={k} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm text-[10px] text-slate-700">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden font-mono shadow-xs">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 px-2 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1 px-2 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 font-mono">
                          {formatPKR(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Coupon, Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-4 font-mono shadow-md">
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-cyan-700" />
                      <span>
                        Coupon <strong>{appliedCoupon.code}</strong> applied (-{formatPKR(appliedCoupon.discountAmount)})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-rose-600 hover:underline font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon (e.g. AZADI500)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 uppercase outline-none focus:border-cyan-600"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponInput.trim()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 border border-slate-300"
                    >
                      {isApplying ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-cyan-700 mt-1">{couponSuccess}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">{formatPKR(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-cyan-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-slate-800">
                    {estimatedDelivery === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      formatPKR(estimatedDelivery)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Final Total</span>
                  <span className="text-slate-900 font-['Outfit'] font-black">{formatPKR(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-cyan-600 text-white font-black text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-slate-500 font-mono">
                Cash on Delivery Nationwide • TCS / Call Courier Dispatch
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
