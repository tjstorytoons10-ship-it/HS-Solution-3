import React, { useState, useMemo } from 'react';
import {
  Filter,
  X,
  SlidersHorizontal,
  Star,
  Search,
  RotateCcw,
  Check
} from 'lucide-react';
import { Category, Product } from '../../types';
import { ProductCard } from './ProductCard';
import { formatPKR } from '../../lib/formatters';

interface ProductCatalogPageProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialQuery?: string;
  onSelectProduct: (product: Product) => void;
}

export const ProductCatalogPage: React.FC<ProductCatalogPageProps> = ({
  products,
  categories,
  initialCategory,
  initialQuery = '',
  onSelectProduct
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Extract all unique brands
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach(p => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Max price among products for range
  const highestProductPrice = useMemo(() => {
    return products.reduce((max, p) => (p.salePrice > max ? p.salePrice : max), 10000);
  }, [products]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory || p.slug === selectedCategory);
    }

    // Brands
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price
    result = result.filter(p => p.salePrice >= minPrice && p.salePrice <= maxPrice);

    // Rating
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Availability
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // Discount
    if (onlyDiscounted) {
      result = result.filter(p => p.discountPercentage > 0);
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case 'rating_desc':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'bestseller':
        result.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrands, minPrice, maxPrice, minRating, onlyInStock, onlyDiscounted, sortBy]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(highestProductPrice);
    setMinRating(0);
    setOnlyInStock(false);
    setOnlyDiscounted(false);
    setSortBy('newest');
  };

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    selectedBrands.length +
    (minPrice > 0 || maxPrice < highestProductPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (onlyDiscounted ? 1 : 0);

  const currentCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return 'All Tech Gear';
    const c = categories.find(cat => cat.id === selectedCategory || cat.slug === selectedCategory);
    return c ? c.name : 'Category Products';
  }, [selectedCategory, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900">
      {/* 1. Header Bar: Title, Count, Sort, Mobile Filter Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
            {currentCategoryName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-mono">
            Showing <strong className="text-cyan-700 font-bold">{filteredProducts.length}</strong> tech items available in Pakistan
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Filter className="w-4 h-4 text-cyan-600" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 shadow-xs">
            <span className="text-slate-400 font-semibold">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-cyan-700 outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white text-slate-900">Newest First</option>
              <option value="bestseller" className="bg-white text-slate-900">Top Rated</option>
              <option value="price_asc" className="bg-white text-slate-900">Price: Low to High</option>
              <option value="price_desc" className="bg-white text-slate-900">Price: High to Low</option>
              <option value="rating_desc" className="bg-white text-slate-900">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-slate-500 font-semibold">Active:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-800 font-medium px-2.5 py-1 rounded-sm border border-cyan-200">
              {currentCategoryName}
              <button onClick={() => setSelectedCategory('all')}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-sm border border-slate-200">
              Query: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedBrands.map(b => (
            <span key={b} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-sm border border-slate-200">
              Brand: {b}
              <button onClick={() => handleBrandToggle(b)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {onlyInStock && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-medium px-2.5 py-1 rounded-sm border border-emerald-200">
              In Stock Only
              <button onClick={() => setOnlyInStock(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {onlyDiscounted && (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 font-medium px-2.5 py-1 rounded-sm border border-rose-200">
              Discounted Deals
              <button onClick={() => setOnlyDiscounted(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {minRating > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 font-medium px-2.5 py-1 rounded-sm border border-amber-200">
              {minRating}★ & Above
              <button onClick={() => setMinRating(0)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-cyan-700 hover:text-cyan-800 font-mono underline ml-2 text-xs font-semibold"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 3. Main Catalog Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2 font-mono">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                REFINE GEAR
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-mono text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Categories</h4>
              <div className="space-y-1 max-h-52 overflow-y-auto text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All Tech Gear
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                      selectedCategory === c.id
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter (PKR) */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Price Ceiling (PKR)</h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>{formatPKR(minPrice)}</span>
                  <span className="text-cyan-700 font-black">{formatPKR(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={highestProductPrice}
                  step={200}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Brands Filter */}
            {allBrands.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Hardware Brands</h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
                  {allBrands.map(b => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-950 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => handleBrandToggle(b)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Filter */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Customer Rating</h4>
              <div className="space-y-1.5 text-xs">
                {[4, 3].map(ratingVal => (
                  <button
                    key={ratingVal}
                    onClick={() => setMinRating(minRating === ratingVal ? 0 : ratingVal)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition ${
                      minRating === ratingVal ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">{'★'.repeat(ratingVal)}</span>
                      <span className="text-slate-300">{'★'.repeat(5 - ratingVal)}</span>
                      <span className="ml-1 text-xs font-mono">& Above</span>
                    </div>
                    {minRating === ratingVal && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-mono">In Stock Dispatch Ready</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                <input
                  type="checkbox"
                  checked={onlyDiscounted}
                  onChange={(e) => setOnlyDiscounted(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-mono">Flash Markdown Deals</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">No matching tech accessories</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                We couldn't find items matching your criteria. Try adjusting your search query or reset filters.
              </p>
              <button
                onClick={resetFilters}
                className="bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm font-mono">REFINE FILTERS</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Category</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                      selectedCategory === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-700'
                    }`}
                  >
                    All Tech Gear
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                        selectedCategory === c.id ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Max Price (PKR)</h4>
                <input
                  type="range"
                  min={0}
                  max={highestProductPrice}
                  step={200}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
                <div className="text-xs font-mono font-bold text-cyan-700 text-right mt-1">
                  Up to {formatPKR(maxPrice)}
                </div>
              </div>

              {/* In stock only */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-mono">
                <label className="flex items-center gap-2 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded text-cyan-600 border-slate-300"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={(e) => setOnlyDiscounted(e.target.checked)}
                    className="rounded text-cyan-600 border-slate-300"
                  />
                  <span>On Sale Deals</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
