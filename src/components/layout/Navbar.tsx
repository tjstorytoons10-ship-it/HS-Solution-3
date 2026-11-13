import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Settings,
  User as UserIcon,
  Truck,
  Menu,
  X,
  ChevronDown,
  ShieldAlert,
  Flame,
  Phone,
  Zap
} from 'lucide-react';
import { Category, Product, StoreSettings } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatPKR } from '../../lib/formatters';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  categories: Category[];
  products: Product[];
  settings?: StoreSettings | null;
  onNavigateHome: () => void;
  onNavigateCategory: (categorySlug: string) => void;
  onSearch: (query: string, categoryId?: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenTrackOrder: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  products,
  settings,
  onNavigateHome,
  onNavigateCategory,
  onSearch,
  onSelectProduct,
  onOpenTrackOrder,
  onOpenAccount,
  onOpenSettings,
  onOpenAdminLogin
}) => {
  const { totalItemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const settingsBadgeCount = totalItemCount + wishlist.length;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick live search suggestions
  const searchSuggestions = searchQuery.trim().length > 1
    ? products
        .filter(p => {
          const q = searchQuery.toLowerCase();
          const matchesText = p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q);
          const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
          return matchesText && matchesCat;
        })
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    onSearch(searchQuery.trim(), selectedCategory === 'all' ? undefined : selectedCategory);
  };

  const handleSuggestionClick = (prod: Product) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    onSelectProduct(prod);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      {/* 1. Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
            <span className="text-cyan-400 font-mono text-[11px] font-bold tracking-wider flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-cyan-400" />
              FLASH DROP
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 truncate font-medium">
              {settings?.announcement || 'Flat Rs. 500 OFF with code AZADI500 • Free Express Delivery over Rs. 2,999 • Cash on Delivery Nationwide'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 shrink-0 text-slate-400 text-xs">
            <button
              onClick={onOpenTrackOrder}
              className="hover:text-cyan-300 transition flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track Parcel</span>
            </button>

            <span className="text-slate-700">·</span>

            <div className="flex items-center gap-1 font-mono text-cyan-400 font-semibold text-[11px]">
              <span>🇵🇰 PKR (Rs.)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none rounded-lg hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo & Brand Identity */}
          <button
            onClick={onNavigateHome}
            className="flex items-center text-left group focus:outline-none shrink-0"
          >
            <BrandLogo variant="navbar" />
          </button>

          {/* Search Bar (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-2xl relative ml-3 mr-0">
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center rounded-xl border border-slate-300 bg-slate-50/90 overflow-hidden shadow-xs focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500/20 transition">
              {/* Category selector in search */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 px-3 border-r border-slate-300 outline-none hover:bg-slate-200 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Tech Gear</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search AirPods, Smartwatches, GaN Fast Chargers, Powerbanks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-cyan-600 text-white px-5 py-2.5 transition flex items-center justify-center shrink-0 font-bold text-sm shadow-xs"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-xs font-mono text-cyan-700 font-bold flex justify-between">
                  <span>SEARCH RESULTS</span>
                  <span className="text-slate-500">{searchSuggestions.length} items found</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {searchSuggestions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition group"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-cyan-700 transition">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-cyan-700 font-mono">
                            {formatPKR(item.salePrice)}
                          </span>
                          {item.originalPrice > item.salePrice && (
                            <span className="text-[11px] line-through text-slate-400 font-mono">
                              {formatPKR(item.originalPrice)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            · {item.brand}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => handleSearchSubmit()}
                    className="text-xs font-semibold text-cyan-700 hover:underline"
                  >
                    View all matching accessories for "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Joined Icon-Only Action Buttons right next to Search Bar: Settings + Account */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Settings Icon-Only Button (Cart, Likes, Change Logo inside) */}
            <button
              onClick={onOpenSettings}
              className="relative w-10 h-10 flex items-center justify-center text-slate-700 hover:text-cyan-700 bg-slate-50 hover:bg-cyan-50 rounded-xl transition border border-slate-200 hover:border-cyan-300 shadow-xs cursor-pointer"
              title="Settings (Cart & Likes)"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
              {settingsBadgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyan-600 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {settingsBadgeCount}
                </span>
              )}
            </button>

            {/* Account / Login Icon-Only Button */}
            <button
              onClick={onOpenAccount}
              className="relative w-10 h-10 flex items-center justify-center text-slate-700 hover:text-cyan-700 bg-slate-50 hover:bg-cyan-50 rounded-xl transition border border-slate-200 hover:border-cyan-300 shadow-xs cursor-pointer"
              title={user ? `Account (${user.name})` : 'Sign In / Account'}
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5" />
              {user && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* Owner / Admin Portal Quick Switch - Only visible if authenticated as Admin */}
            {isAdmin && (
              <button
                onClick={onOpenAdminLogin}
                className="w-10 h-10 rounded-xl transition flex items-center justify-center bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs cursor-pointer"
                title="Go to Admin Dashboard"
                aria-label="Admin Dashboard"
              >
                <ShieldAlert className="w-5 h-5 text-slate-950" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-xl border border-slate-300 bg-slate-50 overflow-hidden shadow-xs focus-within:border-cyan-600 focus-within:bg-white">
            <input
              type="text"
              placeholder="Search AirPods, Smartwatches, GaN Chargers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2 px-3 text-sm text-slate-900 bg-transparent outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-center shrink-0 font-bold"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Secondary Category Bar */}
      <div className="border-t border-slate-200 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 text-xs font-medium text-slate-700 gap-2">
            {/* All Categories Dropdown button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold transition shrink-0 shadow-xs"
              >
                <Menu className="w-3.5 h-3.5 text-cyan-600" />
                <span>All Tech Gear</span>
                <ChevronDown className="w-3 h-3 ml-0.5 text-slate-500" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-3.5 py-1.5 text-[10px] font-mono tracking-wider uppercase text-cyan-700 font-bold border-b border-slate-100">
                    Tech Categories
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setIsCategoryDropdownOpen(false);
                          onNavigateCategory(cat.slug);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-cyan-700 transition flex items-center justify-between font-medium"
                      >
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Category Links */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => onSearch('', undefined)}
                className="px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition shrink-0 flex items-center gap-1.5 font-bold text-cyan-800 border border-cyan-200 bg-cyan-50 shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 text-cyan-700" />
                <span>Hot Tech Drops</span>
              </button>

              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigateCategory(cat.slug)}
                  className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-cyan-700 transition shrink-0 whitespace-nowrap font-medium border border-transparent hover:border-slate-200"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Helpline quick link */}
            <div className="hidden xl:flex items-center gap-2 shrink-0 text-slate-500 pl-4 border-l border-slate-200 text-xs">
              <Phone className="w-3.5 h-3.5 text-cyan-600" />
              <span>Helpline: <strong className="text-slate-900 font-mono">{settings?.contactNumber || '+92 300 1234567'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white border-r border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <BrandLogo variant="navbar" size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigateHome(); }}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Home
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenTrackOrder(); }}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-cyan-700 hover:bg-cyan-50 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4 text-cyan-700" />
                  <span>Track Your Order</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenSettings(); }}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-slate-900 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-cyan-600" />
                  <span>Settings (Cart & Likes)</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAccount(); }}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-slate-900 hover:bg-slate-100 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>{user ? `Account (${user.name})` : 'Sign In / Register'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-cyan-800 font-bold px-3 mb-2">Tech Categories</h4>
                <div className="space-y-1">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigateCategory(c.slug);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-700 rounded-lg flex items-center justify-between font-medium"
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-6 border-t border-slate-200">
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAdminLogin(); }}
                  className="w-full py-2.5 px-3 bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <ShieldAlert className="w-4 h-4 text-slate-950" />
                  <span>Admin Dashboard</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
