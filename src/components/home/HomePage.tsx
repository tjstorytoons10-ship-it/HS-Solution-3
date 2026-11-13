import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Zap,
  Cpu,
  BatteryCharging,
  Radio,
  Star
} from 'lucide-react';
import { Category, Product, StoreSettings } from '../../types';
import { ProductCard } from '../catalog/ProductCard';

interface HomePageProps {
  categories: Category[];
  products: Product[];
  settings?: StoreSettings | null;
  onSelectProduct: (product: Product) => void;
  onNavigateCategory: (slug: string) => void;
  onNavigateCatalog: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  products,
  settings,
  onSelectProduct,
  onNavigateCategory,
  onNavigateCatalog
}) => {
  // Top Quick Category Filter State (so users can filter products right at the start)
  const [activeTopCategory, setActiveTopCategory] = useState<string>('all');

  // Hero Carousel slide state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Flash Sale Countdown Timer (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const heroSlides = [
    {
      title: "Acoustic Precision. Pure Silence.",
      tagline: "SoundPro Active Noise Cancelling Earbuds",
      desc: "Immerse in studio-grade 24-bit Hi-Fi acoustics with 42dB hybrid active noise cancellation, transparency audio, and 48-hour endurance.",
      badge: "ANC PRO EDITION · GEN-2",
      cta: "Shop Wireless Audio",
      categorySlug: "airpods-earbuds",
      bgGradient: "from-cyan-50 via-white to-slate-50",
      accentColor: "text-cyan-700",
      specs: ["42dB Hybrid ANC", "48H Battery", "Wireless Qi"],
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    },
    {
      title: "Engineered for the Wrist.",
      tagline: "Ultra Series AMOLED Smartwatches",
      desc: "Super-bright 1.96-inch 60Hz Retina AMOLED display, titanium alloy bezel, HD Bluetooth calling, and precision continuous biometrics.",
      badge: "RETINA AMOLED · TITANIUM BEZEL",
      cta: "Explore Smart Watches",
      categorySlug: "smart-watches",
      bgGradient: "from-emerald-50 via-white to-slate-50",
      accentColor: "text-emerald-700",
      specs: ["1.96\" 60Hz AMOLED", "HD Bluetooth Call", "IP68 Waterproof"],
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
    },
    {
      title: "Gallium Nitride Supercharged.",
      tagline: "67W - 120W Rapid GaN Adapters & 100W Cables",
      desc: "Power your iPhone, Samsung Galaxy, and laptops up to 70% in 25 minutes. Built-in intelligent thermal management with Pakistan grid surge protection.",
      badge: "67W GaN III · DUAL TYPE-C",
      cta: "View Power & Chargers",
      categorySlug: "mobile-accessories",
      bgGradient: "from-blue-50 via-white to-slate-50",
      accentColor: "text-blue-700",
      specs: ["67W GaN Tech", "Dual USB-C PD 3.0", "Pakistan Surge Shield"],
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    }
  ];

  // Auto advance slides
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  // Product segmentations
  const flashSaleProducts = products.filter(p => p.onSale && p.discountPercentage >= 35).slice(0, 4);
  const featuredProducts = products.filter(p => p.featured).slice(0, 8);
  const bestSellers = products.filter(p => p.bestSeller).slice(0, 8);
  const newArrivals = products.filter(p => p.newArrival).slice(0, 8);

  // Products filtered for the top start section
  const topDisplayedProducts = activeTopCategory === 'all'
    ? products.slice(0, 8)
    : products.filter(p => p.categoryId === activeTopCategory || p.slug === activeTopCategory).slice(0, 8);

  // Recently viewed products from localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  useEffect(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('storetech_recent_views') || '[]');
      if (Array.isArray(savedIds) && savedIds.length > 0) {
        const matching = products.filter(p => savedIds.includes(p.id));
        setRecentlyViewed(matching.slice(0, 4));
      }
    } catch {
      // ignore
    }
  }, [products]);

  return (
    <div className="space-y-12 pb-20 bg-[#f8fafc] text-slate-900">
      {/* 1. TOP HERO SHOWCASE (White modern aesthetic) */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Carousel Slide */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-cyan-50 text-cyan-800 border border-cyan-300 font-mono text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-sm uppercase">
                  {heroSlides[currentSlide].badge}
                </span>
                <span className="text-slate-400 text-xs font-mono">· HS SOLUTION PAKISTAN</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-['Outfit'] leading-tight">
                {heroSlides[currentSlide].title}
              </h1>

              <p className="text-sm sm:text-base font-semibold text-cyan-800">
                {heroSlides[currentSlide].tagline}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                {heroSlides[currentSlide].desc}
              </p>

              {/* Quick Specs micro-chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {heroSlides[currentSlide].specs.map((spec, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-md border border-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                    {spec}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={() => onNavigateCategory(heroSlides[currentSlide].categorySlug)}
                  className="bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <span>{heroSlides[currentSlide].cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onNavigateCatalog}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition border border-slate-300 shadow-xs"
                >
                  Browse Full Catalog ({products.length} Products)
                </button>
              </div>

              {/* Slider Dots */}
              <div className="flex items-center gap-2 pt-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 transition-all rounded-full ${
                      i === currentSlide ? 'w-8 bg-cyan-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Featured Hardware Visual Card */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md group">
                <div className="aspect-square overflow-hidden bg-slate-50">
                  <img
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-700 font-bold uppercase tracking-wider block">
                      OFFICIAL TECH STOCK
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Cash on Delivery All Over Pakistan
                    </span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-1 rounded-sm">
                    IN STOCK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. IMMEDIATE PRODUCTS AT THE START ("Shuru Ma Products Ka Aana Shuru Ho Jayein") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-100 text-cyan-900 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  INSTANT SHOPPING
                </span>
                <span className="text-xs text-emerald-700 font-bold font-mono">● LIVE IN STOCK</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                <span>Featured Tech Products Available Now</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Earbuds, Smart Watches, GaN Fast Chargers, Power Banks & Accessories with Cash on Delivery
              </p>
            </div>

            {/* View Full Catalog Link */}
            <button
              onClick={onNavigateCatalog}
              className="text-xs sm:text-sm font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition shrink-0"
            >
              <span>View All ({products.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Category Filter Pills (Users can filter right at the start) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveTopCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 whitespace-nowrap border ${
                activeTopCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.categoryId === cat.id || p.slug === cat.slug).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTopCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 whitespace-nowrap border ${
                    activeTopCategory === cat.id
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Instant Products Grid - RIGHT HERE AT THE BEGINNING */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {topDisplayedProducts.map(p => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>

          {/* Quick See More CTA */}
          <div className="text-center pt-2">
            <button
              onClick={onNavigateCatalog}
              className="inline-flex items-center gap-2 text-xs font-bold font-mono text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-5 py-2.5 rounded-xl transition"
            >
              <span>Explore All {products.length} Products in Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. FLASH TECH DROPS COUNTDOWN (White card with clean cyan accents) */}
      {flashSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-slate-900 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 fill-cyan-600 text-cyan-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="border border-cyan-200 bg-cyan-50 text-cyan-800 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm">
                      FLASH TECH DROP
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-slate-900">
                      Limited Time Discounts (Up to 50% OFF)
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Exclusive markdown prices on high-demand accessories. Limited dispatch units.
                  </p>
                </div>
              </div>

              {/* Digital countdown timer on clean card */}
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shrink-0">
                <Clock className="w-4 h-4 text-cyan-700" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-600 mr-1 font-semibold">ENDS IN:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-slate-900">
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded-sm shadow-xs">
                    {String(timeLeft.hours).padStart(2, '0')}h
                  </span>
                  <span>:</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded-sm shadow-xs">
                    {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                  <span>:</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded-sm shadow-xs text-rose-600">
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                </div>
              </div>
            </div>

            {/* Flash products grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashSaleProducts.map(p => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. TECH CATEGORIES HUB (Visual White Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-600" />
              <span>Explore Tech Categories</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Engineered accessories for smartphones, wearables & audio
            </p>
          </div>
          <button
            onClick={onNavigateCatalog}
            className="text-xs sm:text-sm font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onNavigateCategory(cat.slug)}
              className="group flex flex-col items-center p-3.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition text-center shadow-xs"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-slate-50 mb-2 border border-slate-100 group-hover:scale-105 transition duration-300">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-700 line-clamp-1 leading-tight">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">View Products</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. TOP BEST SELLERS IN PAKISTAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
                Top Best Sellers in Pakistan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">Most ordered tech accessories by verified customers</p>
            </div>
          </div>
          <button
            onClick={onNavigateCatalog}
            className="text-xs sm:text-sm font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {bestSellers.map(p => (
            <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
          ))}
        </div>
      </section>

      {/* 6. PROMOTIONAL SPLIT TECH BANNERS (Crisp Light Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1: Smartwatches */}
          <div
            onClick={() => onNavigateCategory('smart-watches')}
            className="group relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-cyan-50 via-white to-slate-50 cursor-pointer border border-cyan-200 shadow-xs hover:shadow-md transition"
          >
            <div className="relative z-10 max-w-xs space-y-2.5">
              <span className="border border-cyan-300 bg-white text-cyan-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase">
                RETINA AMOLED
              </span>
              <h3 className="text-2xl font-black font-['Outfit'] text-slate-900">
                Ultra Smartwatches with Bluetooth HD Calling
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Titanium alloy frame, 100+ sports tracking modes, and dual straps in the box.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-700 group-hover:text-cyan-800">
                  Shop Smartwatches <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80"
              alt="Smartwatch"
              className="absolute right-0 bottom-0 w-44 sm:w-56 h-auto object-cover opacity-85 group-hover:scale-105 transition duration-500"
            />
          </div>

          {/* Banner 2: Fast GaN Charging */}
          <div
            onClick={() => onNavigateCategory('mobile-accessories')}
            className="group relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-white to-slate-50 cursor-pointer border border-emerald-200 shadow-xs hover:shadow-md transition"
          >
            <div className="relative z-10 max-w-xs space-y-2.5">
              <span className="border border-emerald-300 bg-white text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase">
                67W GaN SUPERCHARGE
              </span>
              <h3 className="text-2xl font-black font-['Outfit'] text-slate-900">
                Gallium Nitride Adapters & Braided Cables
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast charging engineered with voltage spike protection for Pakistani grids.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 group-hover:text-emerald-800">
                  Shop GaN Chargers <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"
              alt="Fast Charger"
              className="absolute right-0 bottom-0 w-44 sm:w-56 h-auto object-cover opacity-85 group-hover:scale-105 transition duration-500"
            />
          </div>
        </div>
      </section>

      {/* 7. FRESH NEW TECH DROPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
              Fresh New Tech Drops
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono">Newly released stock added this week</p>
          </div>
          <button
            onClick={onNavigateCatalog}
            className="text-xs sm:text-sm font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {newArrivals.map(p => (
            <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
          ))}
        </div>
      </section>

      {/* 8. TECH PILLARS / VALUE PROPOSITIONS BAR (Clean White Design) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Nationwide Delivery</h4>
              <p className="text-[11px] text-slate-500">All 200+ cities via TCS & Call Courier</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-500">Pay cash upon parcel arrival</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">7-Day Replacement</h4>
              <p className="text-[11px] text-slate-500">Direct check & exchange warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">100% Verified Hardware</h4>
              <p className="text-[11px] text-slate-500">Tested tech before parcel dispatch</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. RECENTLY VIEWED (If customer previously viewed products) */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-mono">Recently Viewed Gear</h3>
              <p className="text-xs text-slate-500">Accessories you checked out recently</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentlyViewed.map(p => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. REAL CUSTOMER REVIEWS SHOWCASE (White cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-slate-900 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-700">
              TRUSTED BY 50,000+ PAKISTANI TECH ENTHUSIASTS
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-slate-900 mt-1">
              Verified Customer Experiences
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real feedback from Lahore, Karachi, Islamabad, and Peshawar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-amber-500 text-sm mb-3">
                ★★★★★
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Ordered the SoundPro ANC Earbuds to Lahore. Delivered next day via TCS with cash on delivery. Sound, deep bass, and ANC are incredible!"
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Hamza Farooq</span>
                <span className="text-cyan-700 font-mono font-semibold">Lahore, Punjab</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-amber-500 text-sm mb-3">
                ★★★★★
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Got the 67W GaN charger for my iPhone 16 Pro and laptop. Stays completely cool while charging at full speed. Super fast COD delivery."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Zeeshan Malik</span>
                <span className="text-cyan-700 font-mono font-semibold">Karachi, Sindh</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-amber-500 text-sm mb-3">
                ★★★★★
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "The Ultra AMOLED smartwatch display is razor sharp even under direct sunlight. Battery lasts 6 full days on a single charge. 10/10 service!"
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Bilal Ahmed</span>
                <span className="text-cyan-700 font-mono font-semibold">Islamabad</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
