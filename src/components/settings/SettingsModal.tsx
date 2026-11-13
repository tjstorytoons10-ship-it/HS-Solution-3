import React, { useState } from 'react';
import {
  X,
  Settings,
  ShoppingCart,
  Heart,
  Truck,
  User as UserIcon,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { Product, StoreSettings } from '../../types';
import { formatPKR } from '../../lib/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: StoreSettings | null;
  onSelectProduct: (product: Product) => void;
  onOpenTrackOrder: () => void;
  onOpenAccount: () => void;
  onProceedToCheckout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSelectProduct,
  onOpenTrackOrder,
  onOpenAccount,
  onProceedToCheckout
}) => {
  const {
    items,
    totalItemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    addToCart,
    setIsCartOpen
  } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'cart' | 'likes'>('cart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900 font-['Outfit'] leading-tight">
                    Settings & Quick Hub
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Cart, Likes & Store Controls
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2 Tabs inside Settings: Cart | Likes */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                  activeTab === 'cart'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-cyan-600" />
                <span>Cart ({totalItemCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('likes')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                  activeTab === 'likes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Likes ({wishlist.length})</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: CART & QUICK ACTIONS */}
            {activeTab === 'cart' && (
              <div className="space-y-5">
                {/* Shopping Cart Section */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-cyan-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Shopping Cart ({totalItemCount})
                      </h3>
                    </div>
                    <span className="text-xs font-black font-mono text-cyan-700">
                      {formatPKR(subtotal)}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <p className="text-xs text-slate-500">Your shopping cart is empty.</p>
                      <button
                        onClick={onClose}
                        className="text-xs font-bold text-cyan-600 hover:underline"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <div key={`${item.productId}-${idx}`} className="p-3 flex items-center gap-3">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-[11px] font-mono text-cyan-700 font-semibold">
                                {formatPKR(item.unitPrice)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(idx, item.quantity - 1)}
                                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(idx, item.quantity + 1)}
                                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 ml-0.5"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-slate-50 flex gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            setIsCartOpen(true);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition"
                        >
                          Full Cart
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onProceedToCheckout();
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Checkout</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Store Options */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
                    More Options
                  </h4>

                  <button
                    onClick={() => setActiveTab('likes')}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Liked Products (Wishlist)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {wishlist.length} saved items
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenTrackOrder();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/30 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Track Your Order
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Check TCS / Leopards parcel status
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenAccount();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {user ? `Account (${user.name})` : 'Account / Sign In'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {user ? 'View profile & order history' : 'Login or create customer account'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <a
                    href={`https://wa.me/${(settings?.whatsappNumber || '03001234567').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          WhatsApp Support
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {settings?.whatsappNumber || '+923001234567'}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: LIKES (WISHLIST) */}
            {activeTab === 'likes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Saved Likes ({wishlist.length})
                  </h3>
                </div>

                {wishlist.length === 0 ? (
                  <div className="py-14 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mx-auto">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">No Liked Products Yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Tap the heart icon on any product to save it here inside Settings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlist.map(product => (
                      <div
                        key={product.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 hover:border-cyan-300 transition"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          onClick={() => {
                            onClose();
                            onSelectProduct(product);
                          }}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4
                            onClick={() => {
                              onClose();
                              onSelectProduct(product);
                            }}
                            className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-cyan-700"
                          >
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono text-cyan-700">
                              {formatPKR(product.salePrice)}
                            </span>
                            {product.originalPrice > product.salePrice && (
                              <span className="text-[10px] line-through text-slate-400 font-mono">
                                {formatPKR(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => addToCart(product, 1)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-600 text-white text-[11px] font-bold transition"
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={() => removeFromWishlist(product.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Remove from Likes"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
