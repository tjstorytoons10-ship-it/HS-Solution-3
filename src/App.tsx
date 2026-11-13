/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { LogoProvider, useLogo } from './context/LogoContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { ProductCatalogPage } from './components/catalog/ProductCatalogPage';
import { ProductDetailsModal } from './components/product/ProductDetailsModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { OrderTrackingPage } from './components/orders/OrderTrackingPage';
import { CustomerAccountModal } from './components/account/CustomerAccountModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InvoiceModal } from './components/invoice/InvoiceModal';
import { Category, Product, Order, StoreSettings } from './types';
import { formatPKR } from './lib/formatters';
import { api } from './lib/api';
import { CheckCircle2, FileText, Truck, ArrowRight, MessageCircle } from 'lucide-react';

function MainApp() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { syncServerLogo } = useLogo();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'checkout' | 'track'>('home');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogQuery, setCatalogQuery] = useState<string>('');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cats, prods, sets] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getSettings()
      ]);
      setCategories(cats);
      setProducts(prods);
      setSettings(sets);
      syncServerLogo(sets?.logo);
    } catch (err) {
      console.error('Failed to load store data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // Check for secret URL parameter or hash e.g. ?admin or #admin
    if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
      if (isAdmin) {
        setIsAdminLoginOpen(false);
        setIsAdminDashboardOpen(true);
      } else {
        setIsAdminDashboardOpen(false);
        setIsAdminLoginOpen(true);
      }
    }

    if (!isAdmin) {
      setIsAdminDashboardOpen(false);
    }

    // Keyboard shortcut for Owner/Admin access: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdmin) {
          setIsAdminDashboardOpen(prev => !prev);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, authLoading]);

  // Save recently viewed products to localStorage
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    try {
      const savedIds = JSON.parse(localStorage.getItem('storetech_recent_views') || '[]');
      const updated = [product.id, ...savedIds.filter((id: string) => id !== product.id)].slice(0, 10);
      localStorage.setItem('storetech_recent_views', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCategory = (slug: string) => {
    setCatalogCategory(slug);
    setCatalogQuery('');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string, categoryId?: string) => {
    setCatalogQuery(query);
    setCatalogCategory(categoryId || 'all');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentView('home');
    loadData();
  };

  const whatsappConfirmedMessage = confirmedOrder
    ? encodeURIComponent(
        `Assalam-o-Alaikum! I have placed Order #${confirmedOrder.id} for ${formatPKR(confirmedOrder.total)} on HS Solution. Please confirm dispatch details.`
      )
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-cyan-500 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* If logged in as Admin, show a discrete top status bar */}
      {isAdmin && (
        <div className="bg-amber-400 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
            <span className="font-mono">Owner Mode Active (Logged in as Administrator)</span>
          </div>
          <button
            onClick={() => setIsAdminDashboardOpen(true)}
            className="bg-slate-950 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-slate-800 transition"
          >
            Open Admin Dashboard
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        categories={categories}
        products={products}
        settings={settings}
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleNavigateCategory}
        onSearch={handleSearch}
        onSelectProduct={handleSelectProduct}
        onOpenTrackOrder={() => setCurrentView('track')}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdminLogin={() => {
          if (isAdmin) {
            setIsAdminDashboardOpen(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-600 border-t-transparent animate-spin mx-auto shadow-sm"></div>
            <p className="text-sm font-mono text-cyan-700 font-semibold">Loading HS Solution...</p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomePage
                categories={categories}
                products={products}
                settings={settings}
                onSelectProduct={handleSelectProduct}
                onNavigateCategory={handleNavigateCategory}
                onNavigateCatalog={() => {
                  setCatalogCategory('all');
                  setCatalogQuery('');
                  setCurrentView('catalog');
                }}
              />
            )}

            {currentView === 'catalog' && (
              <ProductCatalogPage
                products={products}
                categories={categories}
                initialCategory={catalogCategory}
                initialQuery={catalogQuery}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'checkout' && (
              <CheckoutPage
                onBackToShopping={handleNavigateHome}
                onOrderSuccess={handleOrderSuccess}
              />
            )}

            {currentView === 'track' && (
              <OrderTrackingPage
                onViewInvoice={(id) => setInvoiceOrderId(id)}
                onExploreProducts={handleNavigateHome}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onNavigateCategory={handleNavigateCategory}
        onOpenTrackOrder={() => {
          setCurrentView('track');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={(prod, qty, attrs, variant) => {
            setSelectedProduct(null);
            setCurrentView('checkout');
          }}
        />
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setCurrentView('checkout')}
        onExploreProducts={handleNavigateHome}
      />

      {/* Settings Hub (Cart & Likes) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSelectProduct={handleSelectProduct}
        onOpenTrackOrder={() => {
          setCurrentView('track');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        onProceedToCheckout={() => setCurrentView('checkout')}
      />

      {/* Customer Account & Saved Addresses Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onSelectProduct={handleSelectProduct}
        onViewInvoice={(id) => setInvoiceOrderId(id)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Store Owner / Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminDashboardOpen(true);
        }}
      />

      {/* Admin Dashboard */}
      {isAdminDashboardOpen && isAdmin && (
        <AdminDashboard
          onClose={() => setIsAdminDashboardOpen(false)}
          onViewInvoice={(id) => setInvoiceOrderId(id)}
          onRefreshPublicData={loadData}
        />
      )}

      {/* Printable Invoice Modal */}
      {invoiceOrderId && (
        <InvoiceModal
          orderId={invoiceOrderId}
          settings={settings}
          onClose={() => setInvoiceOrderId(null)}
        />
      )}

      {/* Post-Checkout Order Confirmation Celebration Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-xs border border-cyan-500/30">
                DISPATCH ORDER BOOKED
              </span>
              <h2 className="text-2xl font-black text-white font-['Outfit'] mt-2">
                Shukriya, {confirmedOrder.customerName}!
              </h2>
              <p className="text-xs text-slate-400">
                Your tech accessories order has been placed. You will receive an SMS and rider call once dispatched.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <strong className="text-cyan-400 text-sm">{confirmedOrder.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <strong className="text-slate-200">{confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.province}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <strong className="uppercase text-slate-200">{confirmedOrder.paymentMethod}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-black text-sm">
                <span className="text-slate-300">Total:</span>
                <span className="text-cyan-300 font-['Outfit']">{formatPKR(confirmedOrder.total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInvoiceOrderId(confirmedOrder.id);
                    setConfirmedOrder(null);
                  }}
                  className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>View / Print Invoice</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('track');
                    setConfirmedOrder(null);
                  }}
                  className="flex-1 py-3 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Parcel</span>
                </button>
              </div>

              {/* Notify via WhatsApp button */}
              <a
                href={`https://wa.me/923001234567?text=${whatsappConfirmedMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/40 flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Confirm on WhatsApp Support</span>
              </a>

              <button
                onClick={() => setConfirmedOrder(null)}
                className="text-xs text-slate-400 hover:text-cyan-400 underline font-mono block mx-auto pt-1"
              >
                Back to Store Homepage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <CartProvider>
          <WishlistProvider>
            <MainApp />
          </WishlistProvider>
        </CartProvider>
      </LogoProvider>
    </AuthProvider>
  );
}
