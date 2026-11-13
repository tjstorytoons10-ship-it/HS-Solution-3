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
  name: string;
  attributes: Record<string, string>;
  priceAdjustment?: number;
  stock: number;
  sku?: string;
}

export interface ProductAttributeOption {
  name: string;
  options: string[];
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
  reviewsList?: Review[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedAttributes: Record<string, string>;
  selectedVariant?: ProductVariant;
  unitPrice: number;
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
  id: string;
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
  paymentMethod: 'cod' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'card' | (string & {});
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
    courierName: string;
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

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockItems: Array<{ id: string; name: string; stock: number; sku: string }>;
  dailySales: Array<{ date: string; amount: number }>;
}
