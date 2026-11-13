import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Color: Midnight Black, Size: L"
  attributes: Record<string, string>; // e.g. { size: "L", color: "Black", strap: "Silicon" }
  priceAdjustment?: number; // difference from base price
  stock: number;
  sku?: string;
}

export interface ProductAttributeOption {
  name: string; // e.g. "Size", "Color", "Strap Type", "Material"
  options: string[]; // e.g. ["S", "M", "L", "XL"]
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userCity?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  imageUrl?: string;
  approved: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brand: string;
  shortDescription: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  stock: number;
  images: string[];
  videoUrl?: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  onSale: boolean;
  attributes: ProductAttributeOption[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  categoryId?: string;
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  province: string;
  city: string;
  standardFee: number;
  freeDeliveryThreshold: number;
  estimatedDays: string;
  expressAvailable?: boolean;
  expressFee?: number;
}

export interface PaymentMethodConfig {
  id: 'cod' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'card' | (string & {});
  name: string;
  enabled: boolean;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
  iban?: string;
  instructions: string;
  requireProofScreenshot?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  selectedAttributes?: Record<string, string>;
}

export interface Order {
  id: string; // ORD-100001
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    province: string;
    city: string;
    area: string;
    streetAddress: string;
    postalCode?: string;
    instructions?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: 'cod' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'card';
  paymentStatus: 'pending' | 'verified' | 'failed';
  paymentProof?: {
    transactionId?: string;
    screenshotUrl?: string;
    cardLast4?: string;
    cardBrand?: string;
    verifiedAt?: string;
  };
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  tracking?: {
    courierName: string; // TCS, Leopards, Call Courier, Trax
    trackingNumber: string;
    dispatchedDate?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  passwordHash: string;
  savedAddresses?: Array<{
    id: string;
    label: string;
    province: string;
    city: string;
    area: string;
    streetAddress: string;
    postalCode?: string;
    isDefault?: boolean;
  }>;
  isBlocked?: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logo: string;
  contactNumber: string;
  whatsappNumber: string;
  email: string;
  storeAddress: string;
  announcement: string;
  currency: string;
  currencySymbol: string;
  socials: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  paymentMethods: PaymentMethodConfig[];
  orders: Order[];
  users: User[];
  reviews: Review[];
  settings: StoreSettings;
  orderCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_buraq_salt_pk_2026').digest('hex');
}

// Initial default seed data
const initialCategories: Category[] = [
  {
    id: 'cat-airpods',
    name: 'AirPods & Earbuds',
    slug: 'airpods-earbuds',
    description: 'High fidelity wireless sound with active noise cancellation and super bass',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    order: 1
  },
  {
    id: 'cat-smartwatches',
    name: 'Smart Watches',
    slug: 'smart-watches',
    description: 'AMOLED display, Bluetooth calling, heart rate & fitness tracking smartwatches',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
    order: 2
  },
  {
    id: 'cat-normalwatches',
    name: 'Normal Watches',
    slug: 'normal-watches',
    description: 'Classic luxury chronograph, quartz and stainless steel formal timepieces',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
    order: 3
  },
  {
    id: 'cat-mobileaccessories',
    name: 'Mobile Accessories',
    slug: 'mobile-accessories',
    description: 'Fast chargers, magnetic car mounts, powerbanks, braided cables & phone grips',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
    order: 4
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Portable Bluetooth speakers, mini vlogging ring lights, RGB gaming accessories',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    order: 5
  },
  {
    id: 'cat-menclothing',
    name: "Men's Clothing",
    slug: 'mens-clothing',
    description: 'Pakistani designer kurtas, wash & wear shalwar kameez, polos and casual shirts',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
    order: 6
  },
  {
    id: 'cat-womenclothing',
    name: "Women's Clothing",
    slug: 'womens-clothing',
    description: 'Premium embroidered lawn 3-piece suits, luxury pret, chiffon dupattas & kurtis',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    order: 7
  },
  {
    id: 'cat-kidsclothing',
    name: 'Kids Clothing',
    slug: 'kids-clothing',
    description: 'Comfortable cotton casual wear, festive Eid outfits and trendy sets for children',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&auto=format&fit=crop&q=80',
    order: 8
  },
  {
    id: 'cat-shoes',
    name: 'Shoes',
    slug: 'shoes',
    description: 'Handcrafted Peshawari chappals, breathable running sneakers, formal Oxford loafers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    order: 9
  },
  {
    id: 'cat-bags',
    name: 'Bags',
    slug: 'bags',
    description: 'Premium leather backpacks, women tote bags, travel duffels & crossbody bags',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    order: 10
  },
  {
    id: 'cat-fashionacc',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    description: 'UV400 sunglasses, genuine leather belts, cufflinks, wallets and key organizers',
    image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&auto=format&fit=crop&q=80',
    order: 11
  },
  {
    id: 'cat-home',
    name: 'Home & Lifestyle',
    slug: 'home-lifestyle',
    description: 'Aroma diffusers, memory foam pillows, kitchen gadgets & LED ambient lighting',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    order: 12
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Organic beard grooming oils, herbal hair serums, face creams and grooming trimmers',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    order: 13
  },
  {
    id: 'cat-other',
    name: 'Other Products',
    slug: 'other-products',
    description: 'Car care kits, multipurpose tools, stationery and daily essentials',
    image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80',
    order: 14
  }
];

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Buraq SoundPro ANC Wireless Earbuds (2nd Gen)',
    slug: 'buraq-soundpro-anc-wireless-earbuds-2nd-gen',
    sku: 'BQM-EAR-001',
    categoryId: 'cat-airpods',
    brand: 'SoundPro',
    shortDescription: 'True Active Noise Cancellation with Transparency Mode, 36h battery life, and high-definition bass.',
    description: 'Experience crystal-clear audio with the Buraq SoundPro 2nd Gen Earbuds. Engineered for music lovers and professionals, these earbuds feature active noise cancellation up to 35dB, spatial audio with dynamic head tracking, touch sensor controls, and IPX5 sweat resistance. Compatible with all Android and iPhone devices.',
    originalPrice: 4999,
    salePrice: 2899,
    discountPercentage: 42,
    stock: 28,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rating: 4.8,
    reviewCount: 142,
    featured: true,
    bestSeller: true,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Glossy White', 'Matte Black', 'Alpine Green'] },
      { name: 'Model', options: ['ANC Pro Edition', 'Bass Boost Special'] },
      { name: 'Version', options: ['Bluetooth 5.3 + ANC', 'Wireless Charging Ver'] }
    ],
    variants: [
      { id: 'v1', name: 'Glossy White - ANC Pro Edition', attributes: { Color: 'Glossy White', Model: 'ANC Pro Edition', Version: 'Bluetooth 5.3 + ANC' }, stock: 15 },
      { id: 'v2', name: 'Matte Black - ANC Pro Edition', attributes: { Color: 'Matte Black', Model: 'ANC Pro Edition', Version: 'Bluetooth 5.3 + ANC' }, stock: 10 },
      { id: 'v3', name: 'Alpine Green - Wireless Charging Ver', attributes: { Color: 'Alpine Green', Model: 'ANC Pro Edition', Version: 'Wireless Charging Ver' }, priceAdjustment: 300, stock: 3 }
    ],
    specifications: {
      'Bluetooth Version': '5.3 Ultra Low Latency',
      'Battery Life': '6 Hours playtime + 30 Hours case backup',
      'Noise Cancellation': 'Active Hybrid ANC (-35dB)',
      'Water Resistance': 'IPX5 Sweatproof',
      'Warranty': '6 Months Brand Warranty',
      'Charging Port': 'Type-C Fast Charge'
    },
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'prod-002',
    name: 'Ultra Titanium Smartwatch 49mm AMOLED with Calling',
    slug: 'ultra-titanium-smartwatch-49mm-amoled',
    sku: 'BQM-WTC-002',
    categoryId: 'cat-smartwatches',
    brand: 'TitanTech',
    shortDescription: 'Rugged aerospace titanium casing, crystal AMOLED display, Bluetooth calling & 100+ sports modes.',
    description: 'The definitive rugged smartwatch built for Pakistan’s active lifestyle. Includes wireless magnetic charging, dual straps in the box (Ocean Loop + Alpine Loop), Urdu and English notification support, heart rate and SpO2 monitoring, and an IP68 waterproof rating.',
    originalPrice: 8500,
    salePrice: 4650,
    discountPercentage: 45,
    stock: 14,
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 98,
    featured: true,
    bestSeller: true,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Titanium Silver', 'Jet Black', 'Desert Orange'] },
      { name: 'Strap type', options: ['Ocean Silicone Loop', 'Alpine Trail Loop', 'Stainless Steel Mesh'] },
      { name: 'Model', options: ['49mm Ultra Max', '45mm Slim Edition'] }
    ],
    variants: [
      { id: 'v4', name: 'Titanium Silver - Ocean Loop', attributes: { Color: 'Titanium Silver', 'Strap type': 'Ocean Silicone Loop', Model: '49mm Ultra Max' }, stock: 6 },
      { id: 'v5', name: 'Jet Black - Alpine Loop', attributes: { Color: 'Jet Black', 'Strap type': 'Alpine Trail Loop', Model: '49mm Ultra Max' }, stock: 5 },
      { id: 'v6', name: 'Desert Orange - Ocean Loop', attributes: { Color: 'Desert Orange', 'Strap type': 'Ocean Silicone Loop', Model: '49mm Ultra Max' }, stock: 3 }
    ],
    specifications: {
      'Display': '2.02 inch HD AMOLED Curved',
      'Calling': 'Built-in Speaker & Mic HD Calling',
      'Battery': '420mAh (4-6 Days standby)',
      'Waterproof': 'IP68 Certified',
      'Language': 'Urdu & English notifications'
    },
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prod-003',
    name: 'Royale Classic Chronograph Stainless Steel Watch',
    slug: 'royale-classic-chronograph-watch',
    sku: 'BQM-WTC-003',
    categoryId: 'cat-normalwatches',
    brand: 'Royale Genève',
    shortDescription: 'Executive sapphire crystal formal watch with working sub-dials and luminous hands.',
    description: 'Designed for men of distinction, this classic chronograph features an automatic quartz movement, solid 316L stainless steel bracelet, scratch-resistant sapphire coated glass, and 30m water resistance. Perfect for office, weddings, and formal Pakistani gatherings.',
    originalPrice: 6500,
    salePrice: 3890,
    discountPercentage: 40,
    stock: 19,
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewCount: 65,
    featured: false,
    bestSeller: false,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Emerald Green Dial', 'Royal Blue Dial', 'Midnight Black Dial'] },
      { name: 'Strap type', options: ['Stainless Steel Bracelet', 'Genuine Leather Strap'] },
      { name: 'Model', options: ['Chronograph Master', 'Slim Date Edition'] }
    ],
    variants: [
      { id: 'v7', name: 'Emerald Green - Stainless Steel', attributes: { Color: 'Emerald Green Dial', 'Strap type': 'Stainless Steel Bracelet', Model: 'Chronograph Master' }, stock: 8 },
      { id: 'v8', name: 'Royal Blue - Stainless Steel', attributes: { Color: 'Royal Blue Dial', 'Strap type': 'Stainless Steel Bracelet', Model: 'Chronograph Master' }, stock: 7 },
      { id: 'v9', name: 'Midnight Black - Leather', attributes: { Color: 'Midnight Black Dial', 'Strap type': 'Genuine Leather Strap', Model: 'Chronograph Master' }, stock: 4 }
    ],
    specifications: {
      'Movement': 'Japanese Quartz Movement',
      'Case Material': '316L Stainless Steel',
      'Dial Window': 'Hardlex Scratch Resistant Glass',
      'Water Resistance': '3 ATM (30m)'
    },
    createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'prod-004',
    name: '67W GaN Super Fast Charger with Dual Type-C & USB',
    slug: '67w-gan-super-fast-charger',
    sku: 'BQM-ACC-004',
    categoryId: 'cat-mobileaccessories',
    brand: 'VoltCharge',
    shortDescription: 'Gallium Nitride (GaN) high-speed charger for iPhone 15/16, Samsung Galaxy, and Laptops.',
    description: 'Charge your phone to 70% in just 25 minutes! Compact Gallium Nitride tech delivers cool, efficient, ultra-fast charging with overvoltage and surge protection designed specifically for Pakistan’s electrical grid fluctuations.',
    originalPrice: 3200,
    salePrice: 1950,
    discountPercentage: 39,
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622445268047-975317d0799d?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewCount: 112,
    featured: true,
    bestSeller: true,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Matte White', 'Carbon Black'] },
      { name: 'Cable Option', options: ['Adapter Only', 'Includes 100W Braided Cable'] }
    ],
    variants: [
      { id: 'v10', name: 'Matte White - Adapter Only', attributes: { Color: 'Matte White', 'Cable Option': 'Adapter Only' }, stock: 25 },
      { id: 'v11', name: 'Matte White - Includes 100W Cable', attributes: { Color: 'Matte White', 'Cable Option': 'Includes 100W Braided Cable' }, priceAdjustment: 450, stock: 15 },
      { id: 'v12', name: 'Carbon Black - Includes 100W Cable', attributes: { Color: 'Carbon Black', 'Cable Option': 'Includes 100W Braided Cable' }, priceAdjustment: 450, stock: 5 }
    ],
    specifications: {
      'Total Output': '67W Max GaN Technology',
      'Ports': '2x USB-C (PD 3.0), 1x USB-A (QC 4.0)',
      'Safety': 'Surge & Overheat Protection Built-in'
    },
    createdAt: '2026-02-14T10:00:00Z'
  },
  {
    id: 'prod-005',
    name: "Luxury Egyptian Cotton Men's Kurta Shalwar Suit",
    slug: 'luxury-egyptian-cotton-mens-kurta-shalwar',
    sku: 'BQM-CLT-005',
    categoryId: 'cat-menclothing',
    brand: 'Buraq Heritage',
    shortDescription: 'Tailored premium combed cotton suit with subtle embroidery on collar and cuffs.',
    description: 'Crafted from breathable 100% Egyptian combed cotton for all-day comfort in Pakistan’s warm climate. Elegant collar detailing, horn buttons, matching shalwar with pocket, and wrinkle-resistant finish.',
    originalPrice: 5800,
    salePrice: 3490,
    discountPercentage: 40,
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 78,
    featured: true,
    bestSeller: false,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Size', options: ['S (Small)', 'M (Medium)', 'L (Large)', 'XL (Extra Large)'] },
      { name: 'Color', options: ['Navy Blue', 'Off-White Ivory', 'Charcoal Grey', 'Emerald Green'] },
      { name: 'Material', options: ['100% Egyptian Cotton', 'Wash & Wear Premium'] }
    ],
    variants: [
      { id: 'v13', name: 'Medium - Navy Blue', attributes: { Size: 'M (Medium)', Color: 'Navy Blue', Material: '100% Egyptian Cotton' }, stock: 8 },
      { id: 'v14', name: 'Large - Navy Blue', attributes: { Size: 'L (Large)', Color: 'Navy Blue', Material: '100% Egyptian Cotton' }, stock: 6 },
      { id: 'v15', name: 'Medium - Off-White Ivory', attributes: { Size: 'M (Medium)', Color: 'Off-White Ivory', Material: '100% Egyptian Cotton' }, stock: 5 },
      { id: 'v16', name: 'Large - Charcoal Grey', attributes: { Size: 'L (Large)', Color: 'Charcoal Grey', Material: '100% Egyptian Cotton' }, stock: 3 }
    ],
    specifications: {
      'Fabric': '100% Egyptian Combed Cotton',
      'Fit': 'Regular Comfort Fit',
      'Care': 'Machine wash cold or gentle hand wash',
      'Includes': 'Kurta + Matching Shalwar'
    },
    createdAt: '2026-02-18T10:00:00Z'
  },
  {
    id: 'prod-006',
    name: 'Festive Luxury Embroidered Lawn 3-Piece Unstitched Suit',
    slug: 'festive-embroidered-lawn-3pc-suit',
    sku: 'BQM-CLT-006',
    categoryId: 'cat-womenclothing',
    brand: 'Zeenat Pret',
    shortDescription: 'Digital printed jacquard lawn shirt with heavy organza embroidered neckline & chiffon dupatta.',
    description: 'Celebrate elegance with this premier 3-piece lawn ensemble. Features finely printed breathable lawn shirt fabric (3.0m), dyed cambric trousers (2.5m), and a delicate digital printed pure silk-chiffon dupatta (2.5m). Includes embroidered patches for daman and sleeves.',
    originalPrice: 6999,
    salePrice: 4250,
    discountPercentage: 39,
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 94,
    featured: true,
    bestSeller: true,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Pistachio & Pastel Floral', 'Royal Plum & Gold', 'Dusty Rose & Peach'] },
      { name: 'Fabric Type', options: ['Premium Lawn with Chiffon Dupatta', 'Organza Luxury Edit'] }
    ],
    variants: [
      { id: 'v17', name: 'Pistachio Floral - Lawn & Chiffon', attributes: { Color: 'Pistachio & Pastel Floral', 'Fabric Type': 'Premium Lawn with Chiffon Dupatta' }, stock: 8 },
      { id: 'v18', name: 'Royal Plum - Lawn & Chiffon', attributes: { Color: 'Royal Plum & Gold', 'Fabric Type': 'Premium Lawn with Chiffon Dupatta' }, stock: 6 },
      { id: 'v19', name: 'Dusty Rose - Organza Luxury', attributes: { Color: 'Dusty Rose & Peach', 'Fabric Type': 'Organza Luxury Edit' }, priceAdjustment: 500, stock: 4 }
    ],
    specifications: {
      'Shirt': 'Digital Printed Lawn 3.0 Meters',
      'Trouser': 'Dyed Cambric Cotton 2.5 Meters',
      'Dupatta': 'Digital Printed Silk Chiffon 2.5 Meters',
      'Embellishments': 'Organza Embroidered Neckline + Daman'
    },
    createdAt: '2026-02-20T10:00:00Z'
  },
  {
    id: 'prod-007',
    name: 'Handcrafted Charsadda Peshawari Chappal (Pure Cow Leather)',
    slug: 'handcrafted-charsadda-peshawari-chappal',
    sku: 'BQM-SHO-007',
    categoryId: 'cat-shoes',
    brand: 'Khyber Craft',
    shortDescription: 'Master artisan crafted traditional chappal with tyre sole and genuine full-grain leather.',
    description: 'Authentic Charsadda design made from 100% genuine top-grain Pakistani leather with comfortable arch cushioning and lightweight durable recycled tyre sole. Perfect companion for Eid, weddings, and traditional Shalwar Kameez.',
    originalPrice: 4500,
    salePrice: 2890,
    discountPercentage: 36,
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewCount: 88,
    featured: true,
    bestSeller: true,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Size', options: ['39 (6 UK)', '40 (7 UK)', '41 (8 UK)', '42 (9 UK)', '43 (10 UK)', '44 (11 UK)'] },
      { name: 'Color', options: ['Mustard Camel Tan', 'Jet Black', 'Mahogany Dark Brown'] }
    ],
    variants: [
      { id: 'v20', name: 'Size 41 - Mustard Tan', attributes: { Size: '41 (8 UK)', Color: 'Mustard Camel Tan' }, stock: 8 },
      { id: 'v21', name: 'Size 42 - Mustard Tan', attributes: { Size: '42 (9 UK)', Color: 'Mustard Camel Tan' }, stock: 7 },
      { id: 'v22', name: 'Size 41 - Jet Black', attributes: { Size: '41 (8 UK)', Color: 'Jet Black' }, stock: 6 },
      { id: 'v23', name: 'Size 42 - Mahogany Brown', attributes: { Size: '42 (9 UK)', Color: 'Mahogany Dark Brown' }, stock: 4 }
    ],
    specifications: {
      'Upper': '100% Genuine Full-grain Cow Leather',
      'Sole': 'Lightweight Tyre Rubber Sole',
      'Insole': 'Orthopedic Foam Cushioned',
      'Origin': 'Handcrafted in Khyber Pakhtunkhwa'
    },
    createdAt: '2026-02-25T10:00:00Z'
  },
  {
    id: 'prod-008',
    name: 'AirFlow Ultra Lightweight Running Sports Sneakers',
    slug: 'airflow-ultra-lightweight-running-sneakers',
    sku: 'BQM-SHO-008',
    categoryId: 'cat-shoes',
    brand: 'AeroStep',
    shortDescription: 'Breathable flyknit mesh with responsive EVA shock-absorbing sole for gym and casual wear.',
    description: 'Step into unmatched comfort. The AirFlow sneakers feature a breathable stretch knit upper that hugs your foot like a sock, coupled with an ultra-plush bounce insole. Weighs under 280 grams for effortless daily movement.',
    originalPrice: 4200,
    salePrice: 2450,
    discountPercentage: 42,
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewCount: 52,
    featured: false,
    bestSeller: false,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Size', options: ['40 (7 UK)', '41 (8 UK)', '42 (9 UK)', '43 (10 UK)', '44 (11 UK)'] },
      { name: 'Color', options: ['Triple All-Black', 'Glacier Grey', 'Navy White Sport'] }
    ],
    variants: [
      { id: 'v24', name: 'Size 42 - Triple All-Black', attributes: { Size: '42 (9 UK)', Color: 'Triple All-Black' }, stock: 10 },
      { id: 'v25', name: 'Size 41 - Glacier Grey', attributes: { Size: '41 (8 UK)', Color: 'Glacier Grey' }, stock: 8 },
      { id: 'v26', name: 'Size 43 - Navy White Sport', attributes: { Size: '43 (10 UK)', Color: 'Navy White Sport' }, stock: 7 }
    ],
    specifications: {
      'Upper': 'Engineered Flyknit Mesh',
      'Sole': 'High-rebound EVA Memory Foam',
      'Weight': '270g per shoe'
    },
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'prod-009',
    name: 'Anti-Theft Laptop Backpack with USB Charging Port',
    slug: 'anti-theft-laptop-backpack-usb-charging',
    sku: 'BQM-BAG-009',
    categoryId: 'cat-bags',
    brand: 'UrbanGuard',
    shortDescription: 'Water-resistant Oxford fabric, TSA hidden zippers, fits up to 15.6 inch laptops.',
    description: 'The ultimate commuter and university bag for Pakistan. Features hidden security zippers, waterproof coating against unexpected rain, dedicated padded sleeve for 15.6" laptop and iPad, integrated external USB pass-through port, and ergonomic honeycomb back support.',
    originalPrice: 3800,
    salePrice: 2290,
    discountPercentage: 40,
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewCount: 67,
    featured: false,
    bestSeller: true,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Charcoal Black', 'Navy Blue', 'Silver Heather Grey'] }
    ],
    variants: [
      { id: 'v27', name: 'Charcoal Black', attributes: { Color: 'Charcoal Black' }, stock: 10 },
      { id: 'v28', name: 'Navy Blue', attributes: { Color: 'Navy Blue' }, stock: 6 },
      { id: 'v29', name: 'Silver Heather Grey', attributes: { Color: 'Silver Heather Grey' }, stock: 4 }
    ],
    specifications: {
      'Capacity': '25 Liters',
      'Laptop Size': 'Up to 15.6 inches',
      'Fabric': 'High-density Water-repellent Oxford',
      'Features': 'Hidden Anti-theft Pocket, Luggage Strap'
    },
    createdAt: '2026-03-03T10:00:00Z'
  },
  {
    id: 'prod-010',
    name: 'RGB BassBoom Portable Wireless Bluetooth Speaker',
    slug: 'rgb-bassboom-portable-bluetooth-speaker',
    sku: 'BQM-ELC-010',
    categoryId: 'cat-electronics',
    brand: 'BassBoom',
    shortDescription: '20W stereo punchy sound, dynamic RGB rhythmic light show, 12-hour battery life.',
    description: 'Take the party everywhere! Built with dual passive radiators for deep punchy bass, vivid RGB lights that pulse to the rhythm of the music, FM radio receiver, TF card and USB flash drive support, and IPX6 splash resistance.',
    originalPrice: 3999,
    salePrice: 2350,
    discountPercentage: 41,
    stock: 16,
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewCount: 43,
    featured: false,
    bestSeller: false,
    newArrival: true,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Camo Military', 'Midnight Black', 'Ruby Red'] }
    ],
    variants: [
      { id: 'v30', name: 'Midnight Black', attributes: { Color: 'Midnight Black' }, stock: 8 },
      { id: 'v31', name: 'Camo Military', attributes: { Color: 'Camo Military' }, stock: 5 },
      { id: 'v32', name: 'Ruby Red', attributes: { Color: 'Ruby Red' }, stock: 3 }
    ],
    specifications: {
      'Power Output': '20W Peak Stereo',
      'Playtime': 'Up to 12 Hours (50% volume)',
      'Waterproof': 'IPX6 Splash & Rain Proof',
      'Inputs': 'Bluetooth 5.2, AUX 3.5mm, USB Flash, MicroSD'
    },
    createdAt: '2026-03-05T10:00:00Z'
  },
  {
    id: 'prod-011',
    name: 'Ultrasonic Ceramic Aroma Diffuser & Flame Humidifier',
    slug: 'ultrasonic-ceramic-aroma-diffuser-flame',
    sku: 'BQM-HOM-011',
    categoryId: 'cat-home',
    brand: 'ZenLiving',
    shortDescription: 'Realistic amber flame effect, 7 LED colors, quiet whisper ultrasonic mist with timer.',
    description: 'Transform your bedroom or drawing room into a calming sanctuary. Combines soothing aromatherapy with a mesmerizing simulated flame lighting effect. Auto-shuts off when water runs out. Includes sample Pakistani rose and lavender essential oils.',
    originalPrice: 3400,
    salePrice: 1990,
    discountPercentage: 41,
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 56,
    featured: true,
    bestSeller: false,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Color', options: ['Minimalist Matte White', 'Ebony Black'] },
      { name: 'Essential Oil Set', options: ['Standard Pack', 'With 3x Natural Oils (Rose, Oud, Lavender)'] }
    ],
    variants: [
      { id: 'v33', name: 'Matte White - Standard', attributes: { Color: 'Minimalist Matte White', 'Essential Oil Set': 'Standard Pack' }, stock: 12 },
      { id: 'v34', name: 'Matte White - With 3x Natural Oils', attributes: { Color: 'Minimalist Matte White', 'Essential Oil Set': 'With 3x Natural Oils (Rose, Oud, Lavender)' }, priceAdjustment: 400, stock: 6 },
      { id: 'v35', name: 'Ebony Black - Standard', attributes: { Color: 'Ebony Black', 'Essential Oil Set': 'Standard Pack' }, stock: 4 }
    ],
    specifications: {
      'Capacity': '250ml Water Tank',
      'Lighting': 'Simulated Warm Flame + 7 Mood Colors',
      'Timer': '1h / 3h / 5h auto shut-off',
      'Noise': '< 20dB whisper quiet'
    },
    createdAt: '2026-03-08T10:00:00Z'
  },
  {
    id: 'prod-012',
    name: 'Pro Precision Cordless Beard & Hair Trimmer T-Blade',
    slug: 'pro-precision-cordless-beard-hair-trimmer',
    sku: 'BQM-BEA-012',
    categoryId: 'cat-beauty',
    brand: 'BarberTech',
    shortDescription: 'Vintage engraved bronze body, sharp zero-gapped carbon steel T-blade, LCD battery display.',
    description: 'The preferred choice for precise beard shaping, fades, and hair trimming at home. Features high-torque rotary motor, rechargeable 1200mAh lithium battery with 180 min runtime, USB charging, and 4 limit combs (1.5mm, 2mm, 3mm, 4mm).',
    originalPrice: 2800,
    salePrice: 1650,
    discountPercentage: 41,
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewCount: 71,
    featured: false,
    bestSeller: true,
    newArrival: false,
    onSale: true,
    attributes: [
      { name: 'Color / Pattern', options: ['Vintage Antique Bronze Dragon', 'Classic Silver Buddha', 'Matte Gold Knight'] }
    ],
    variants: [
      { id: 'v36', name: 'Vintage Antique Bronze Dragon', attributes: { 'Color / Pattern': 'Vintage Antique Bronze Dragon' }, stock: 20 },
      { id: 'v37', name: 'Classic Silver Buddha', attributes: { 'Color / Pattern': 'Classic Silver Buddha' }, stock: 10 },
      { id: 'v38', name: 'Matte Gold Knight', attributes: { 'Color / Pattern': 'Matte Gold Knight' }, stock: 5 }
    ],
    specifications: {
      'Blade': 'Zero-gap Carbon Steel T-Blade',
      'Battery': '1200mAh Lithium Ion (180 mins)',
      'Charging': 'USB Type-C Fast Charge',
      'Accessories': '4 Guide Combs, Cleaning Brush, Lubricant Oil'
    },
    createdAt: '2026-03-10T10:00:00Z'
  }
];

const initialCoupons: Coupon[] = [
  {
    id: 'coup-1',
    code: 'WELCOME10',
    type: 'percentage',
    discountValue: 10,
    minOrderAmount: 1500,
    expiryDate: '2027-12-31',
    usageLimit: 1000,
    usedCount: 84,
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'AZADI500',
    type: 'fixed',
    discountValue: 500,
    minOrderAmount: 3000,
    expiryDate: '2027-12-31',
    usageLimit: 500,
    usedCount: 122,
    isActive: true
  },
  {
    id: 'coup-3',
    code: 'FREESHIP',
    type: 'fixed',
    discountValue: 200,
    minOrderAmount: 2500,
    expiryDate: '2027-12-31',
    usageLimit: 800,
    usedCount: 215,
    isActive: true
  }
];

const initialDeliveryZones: DeliveryZone[] = [
  {
    id: 'del-1',
    province: 'Punjab',
    city: 'Lahore',
    standardFee: 180,
    freeDeliveryThreshold: 2999,
    estimatedDays: '1-2 Days',
    expressAvailable: true,
    expressFee: 300
  },
  {
    id: 'del-2',
    province: 'Sindh',
    city: 'Karachi',
    standardFee: 220,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2-3 Days',
    expressAvailable: true,
    expressFee: 350
  },
  {
    id: 'del-3',
    province: 'Islamabad Capital Territory',
    city: 'Islamabad',
    standardFee: 190,
    freeDeliveryThreshold: 2999,
    estimatedDays: '1-2 Days',
    expressAvailable: true,
    expressFee: 320
  },
  {
    id: 'del-4',
    province: 'Punjab',
    city: 'Rawalpindi',
    standardFee: 190,
    freeDeliveryThreshold: 2999,
    estimatedDays: '1-2 Days'
  },
  {
    id: 'del-5',
    province: 'Punjab',
    city: 'Faisalabad',
    standardFee: 200,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2-3 Days'
  },
  {
    id: 'del-6',
    province: 'Punjab',
    city: 'Multan',
    standardFee: 200,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2-3 Days'
  },
  {
    id: 'del-7',
    province: 'Khyber Pakhtunkhwa',
    city: 'Peshawar',
    standardFee: 220,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2-3 Days'
  },
  {
    id: 'del-8',
    province: 'Balochistan',
    city: 'Quetta',
    standardFee: 250,
    freeDeliveryThreshold: 3499,
    estimatedDays: '3-5 Days'
  },
  {
    id: 'del-9',
    province: 'Punjab',
    city: 'Gujranwala',
    standardFee: 190,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2 Days'
  },
  {
    id: 'del-10',
    province: 'Punjab',
    city: 'Sialkot',
    standardFee: 190,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2 Days'
  },
  {
    id: 'del-11',
    province: 'Sindh',
    city: 'Hyderabad',
    standardFee: 220,
    freeDeliveryThreshold: 2999,
    estimatedDays: '2-3 Days'
  },
  {
    id: 'del-12',
    province: 'All Other Cities',
    city: 'Rest of Pakistan',
    standardFee: 250,
    freeDeliveryThreshold: 3499,
    estimatedDays: '3-5 Days'
  }
];

const initialPaymentMethods: PaymentMethodConfig[] = [
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    enabled: true,
    instructions: 'Pay with cash directly to the courier delivery agent when you inspect and receive your parcel at your doorstep.'
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa Mobile Account',
    enabled: true,
    accountTitle: 'HS Solution Official',
    accountNumber: '0345-9876543',
    instructions: 'Transfer the order total to Easypaisa Account: 0345-9876543 (Title: HS Solution Official) or scan QR code. Enter the 11-digit Transaction ID (TRX) and upload receipt screenshot below. Verified promptly.',
    requireProofScreenshot: true
  },
  {
    id: 'jazzcash',
    name: 'JazzCash Wallet / Till ID',
    enabled: true,
    accountTitle: 'HS Solution Official',
    accountNumber: '0301-8765432',
    instructions: 'Send payment via JazzCash App or Retailer to 0301-8765432 (Title: HS Solution Official). Provide your TID / Reference ID and proof receipt below.',
    requireProofScreenshot: true
  },
  {
    id: 'bank_transfer',
    name: 'Online Bank Transfer / Raast (Meezan Bank)',
    enabled: true,
    bankName: 'Meezan Bank Limited',
    accountTitle: 'HS Solution PVT LTD',
    accountNumber: '0102030405060708',
    iban: 'PK64MEZN000102030405060708',
    instructions: 'Transfer via online banking or Raast instant ID. Mention your Order ID in payment remarks. Share transaction reference or receipt screenshot.',
    requireProofScreenshot: true
  },
  {
    id: 'card',
    name: 'Debit / Credit Card (Visa / Mastercard / PayPak)',
    enabled: true,
    instructions: 'Instant secure checkout with any Pakistani or international Visa, Mastercard, or PayPak card with 3D Secure OTP verification.',
    requireProofScreenshot: false
  }
];

const initialReviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-001',
    userName: 'Hamza Farooq',
    userCity: 'Lahore',
    rating: 5,
    comment: 'MashaAllah best earbuds in this price range! Sound quality and bass is unbelievable, and ANC actually blocks fan and traffic noise. Delivered in 24 hours to Gulberg.',
    date: '2026-03-01',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-2',
    productId: 'prod-001',
    userName: 'Zubair Ahmed',
    userCity: 'Karachi',
    rating: 5,
    comment: 'Battery backup is outstanding. 6 hours easily on a single charge. Connected to iPhone instantly without lag. Cash on delivery was seamless.',
    date: '2026-03-04',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-3',
    productId: 'prod-002',
    userName: 'Muhammad Bilal',
    userCity: 'Islamabad',
    rating: 5,
    comment: 'The watch looks 100% like a 50k original Apple Watch Ultra! Build quality is solid titanium feel, screen is bright in direct sunlight. Received with two loops.',
    date: '2026-03-06',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-4',
    productId: 'prod-006',
    userName: 'Ayesha Siddiqui',
    userCity: 'Rawalpindi',
    rating: 5,
    comment: 'Fabric is extremely soft, pure Pakistani lawn quality. Embroidery on neck and daman looks very rich and neat. Chiffon dupatta colors are vibrant. 10/10 recommend!',
    date: '2026-03-07',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-5',
    productId: 'prod-007',
    userName: 'Sardar Tariq Khan',
    userCity: 'Peshawar',
    rating: 5,
    comment: 'As someone from KPK, I know real Peshawari chappal. This cow leather and tyre sole work is top notch craftmanship. Very comfortable arch support.',
    date: '2026-03-08',
    verifiedPurchase: true,
    approved: true
  }
];

const initialOrders: Order[] = [
  {
    id: 'ORD-100001',
    customerName: 'Usman Ali',
    customerPhone: '0300-1234567',
    customerEmail: 'usman.ali@gmail.com',
    shippingAddress: {
      province: 'Punjab',
      city: 'Lahore',
      area: 'DHA Phase 5, Sector C',
      streetAddress: 'House 142, Street 8',
      postalCode: '54792',
      instructions: 'Please call before delivery'
    },
    items: [
      {
        productId: 'prod-001',
        name: 'Buraq SoundPro ANC Wireless Earbuds (2nd Gen)',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
        price: 2899,
        quantity: 1,
        sku: 'BQM-EAR-001',
        selectedAttributes: { Color: 'Matte Black', Model: 'ANC Pro Edition' }
      }
    ],
    subtotal: 2899,
    discount: 289,
    deliveryFee: 180,
    total: 2790,
    couponCode: 'WELCOME10',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'Shipped',
    tracking: {
      courierName: 'TCS Pakistan',
      trackingNumber: 'TCS789123445',
      dispatchedDate: '2026-03-07',
      notes: 'Handed over to TCS Gulberg Hub'
    },
    createdAt: '2026-03-06T14:20:00Z',
    updatedAt: '2026-03-07T09:15:00Z'
  },
  {
    id: 'ORD-100002',
    customerName: 'Fatima Noor',
    customerPhone: '0321-7654321',
    customerEmail: 'fatima.noor@hotmail.com',
    shippingAddress: {
      province: 'Sindh',
      city: 'Karachi',
      area: 'Clifton Block 2',
      streetAddress: 'Apartment 4B, Ocean View Heights',
      postalCode: '75600',
      instructions: 'Leave at reception if not home'
    },
    items: [
      {
        productId: 'prod-006',
        name: 'Festive Luxury Embroidered Lawn 3-Piece Unstitched Suit',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
        price: 4250,
        quantity: 1,
        sku: 'BQM-CLT-006',
        selectedAttributes: { Color: 'Pistachio & Pastel Floral' }
      }
    ],
    subtotal: 4250,
    discount: 500,
    deliveryFee: 0,
    total: 3750,
    couponCode: 'AZADI500',
    paymentMethod: 'jazzcash',
    paymentStatus: 'verified',
    paymentProof: {
      transactionId: 'JC9982314751',
      screenshotUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
      verifiedAt: '2026-03-06T18:00:00Z'
    },
    orderStatus: 'Delivered',
    tracking: {
      courierName: 'Call Courier',
      trackingNumber: 'CC-9021482',
      dispatchedDate: '2026-03-06',
      notes: 'Delivered and signed by customer'
    },
    createdAt: '2026-03-05T11:45:00Z',
    updatedAt: '2026-03-08T16:30:00Z'
  }
];

const initialUsers: User[] = [
  {
    id: 'admin-1',
    name: 'HS Solution Owner',
    email: 'storetech@gmail.com',
    phone: '0300-1122334',
    role: 'admin',
    passwordHash: hashPassword('storetech123'),
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-demo-1',
    name: 'Usman Ali',
    email: 'usman.ali@gmail.com',
    phone: '0300-1234567',
    role: 'customer',
    passwordHash: hashPassword('Customer@123'),
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Home (Lahore)',
        province: 'Punjab',
        city: 'Lahore',
        area: 'DHA Phase 5, Sector C',
        streetAddress: 'House 142, Street 8',
        postalCode: '54792',
        isDefault: true
      }
    ],
    createdAt: '2026-02-15T00:00:00Z'
  }
];

const initialSettings: StoreSettings = {
  storeName: 'HS Solution',
  tagline: 'Pakistan’s Premier Multi-Product Tech & Lifestyle Store',
  logo: '/logo.jpg',
  contactNumber: '+92 300 1234567',
  whatsappNumber: '+923001234567',
  email: 'support@hssolution.pk',
  storeAddress: 'Plot 42-B, Commercial Avenue, Main Boulevard, Gulberg III, Lahore, Pakistan',
  announcement: '⚡ Mega Sale! Flat Rs. 500 OFF with code AZADI500 • Free Delivery over Rs. 2,999 • Cash on Delivery & Online Payment Nationwide',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  socials: {
    facebook: 'https://facebook.com/hssolution.pk',
    instagram: 'https://instagram.com/hssolution.pk',
    tiktok: 'https://tiktok.com/@hssolution.pk'
  }
};

let dbCache: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
      let dirty = false;

      // Ensure owner admin account uses the configured storetech@gmail.com credentials
      const adminUser = dbCache!.users.find(u => u.id === 'admin-1' || u.role === 'admin');
      if (adminUser && (adminUser.email !== 'storetech@gmail.com' || adminUser.passwordHash !== hashPassword('storetech123'))) {
        adminUser.email = 'storetech@gmail.com';
        adminUser.name = 'HS Solution Owner';
        adminUser.passwordHash = hashPassword('storetech123');
        dirty = true;
      }

      // Sync store name to HS Solution if still using previous default
      if (dbCache!.settings && dbCache!.settings.storeName === 'Store Tech Accessories') {
        dbCache!.settings.storeName = 'HS Solution';
        if (dbCache!.settings.email === 'support@storetechaccessories.pk') {
          dbCache!.settings.email = 'support@hssolution.pk';
        }
        if (dbCache!.settings.announcement?.includes('Cash on Delivery Nationwide')) {
          dbCache!.settings.announcement = '⚡ Mega Sale! Flat Rs. 500 OFF with code AZADI500 • Free Delivery over Rs. 2,999 • Cash on Delivery & Online Payment Nationwide';
        }
        if (dbCache!.settings.logo?.includes('unsplash.com/photo-1472851294608')) {
          dbCache!.settings.logo = '/logo.jpg';
        }
        dirty = true;
      }
      if (dbCache!.settings?.socials) {
        const { facebook, instagram, tiktok } = dbCache!.settings.socials;
        if (facebook?.includes('storetechaccessories.pk')) {
          dbCache!.settings.socials.facebook = facebook.replace('storetechaccessories.pk', 'hssolution.pk');
          dirty = true;
        }
        if (instagram?.includes('storetechaccessories.pk')) {
          dbCache!.settings.socials.instagram = instagram.replace('storetechaccessories.pk', 'hssolution.pk');
          dirty = true;
        }
        if (tiktok?.includes('storetechaccessories.pk')) {
          dbCache!.settings.socials.tiktok = tiktok.replace('storetechaccessories.pk', 'hssolution.pk');
          dirty = true;
        }
      }

      // Ensure online payment methods are enabled alongside COD
      if (dbCache!.paymentMethods) {
        const allOnlineDisabled = dbCache!.paymentMethods
          .filter(m => m.id !== 'cod')
          .every(m => !m.enabled);
        if (allOnlineDisabled) {
          dbCache!.paymentMethods.forEach(m => {
            m.enabled = true;
            if (m.accountTitle?.includes('Store Tech Accessories')) {
              m.accountTitle = m.accountTitle.replace('Store Tech Accessories', 'HS Solution');
            }
            if (m.instructions?.includes('Store Tech Accessories')) {
              m.instructions = m.instructions.replace('Store Tech Accessories', 'HS Solution');
            }
          });
          dirty = true;
        }
      }

      if (dirty) {
        saveDatabase(dbCache!);
      }
      return dbCache!;
    } catch (err) {
      console.error('Error reading db file, re-initializing...', err);
    }
  }

  dbCache = {
    categories: initialCategories,
    products: initialProducts,
    coupons: initialCoupons,
    deliveryZones: initialDeliveryZones,
    paymentMethods: initialPaymentMethods,
    orders: initialOrders,
    users: initialUsers,
    reviews: initialReviews,
    settings: initialSettings,
    orderCounter: 100003
  };

  saveDatabase(dbCache);
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema) {
  dbCache = data;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
