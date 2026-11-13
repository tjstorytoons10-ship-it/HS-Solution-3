import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  CreditCard,
  Truck,
  TicketPercent,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Upload,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import {
  Category,
  Product,
  Order,
  Coupon,
  DeliveryZone,
  PaymentMethodConfig,
  DashboardStats,
  StoreSettings
} from '../../types';
import { formatPKR, formatDate, formatDateTime, PAKISTAN_PROVINCES, PAKISTAN_MAJOR_CITIES } from '../../lib/formatters';
import { api } from '../../lib/api';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useLogo } from '../../context/LogoContext';

interface AdminDashboardProps {
  onClose: () => void;
  onViewInvoice: (orderId: string) => void;
  onRefreshPublicData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onViewInvoice,
  onRefreshPublicData
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { logoUrl, updateLogo, resetLogo } = useLogo();

  // Strict Security Check: If not logged in as the authorized owner Admin, do not render dashboard
  if (!isAdmin || user?.role !== 'admin' || user?.email?.toLowerCase() !== 'storetech@gmail.com') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600">
            Aap ke paas Admin Panel access karne ki ijazat nahi hai. Yeh panel sirf authorized store admin ke liye makhsoos hai.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'coupons' | 'delivery' | 'payments' | 'settings'
  >('overview');

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Tracking modal for orders
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('TCS Pakistan');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Delivery
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingDeliveryZone, setEditingDeliveryZone] = useState<DeliveryZone | null>(null);

  // Payments
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethodConfig | null>(null);
  const [paymentSavedMessage, setPaymentSavedMessage] = useState('');

  // Settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Admin-only Logo Upload states
  const [logoInputUrl, setLogoInputUrl] = useState(logoUrl);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSavedMsg, setLogoSavedMsg] = useState('');
  const [logoError, setLogoError] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setStatsLoading(true);
      const [
        dashStats,
        prods,
        cats,
        ords,
        custs,
        coups,
        zones,
        payments,
        storeSettings
      ] = await Promise.all([
        api.getAdminStats(),
        api.getProducts(),
        api.getCategories(),
        api.getAdminOrders(),
        api.getAdminCustomers(),
        api.getCoupons(),
        api.getDeliveryRates(),
        api.getPaymentMethods(),
        api.getSettings()
      ]);

      setStats(dashStats);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setCustomers(custs);
      setCoupons(coups);
      setDeliveryZones(zones);
      setPaymentMethods(payments);
      setSettings(storeSettings);
      setLogoInputUrl(storeSettings.logo || logoUrl);
    } catch (err) {
      console.error('Failed loading admin dashboard data', err);
    } finally {
      setStatsLoading(false);
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Payment verification
  const handleVerifyPayment = async (orderId: string, paymentStatus: 'verified' | 'failed') => {
    try {
      const updated = await api.verifyOrderPayment(orderId, paymentStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message || 'Failed to verify payment');
    }
  };

  // Save courier tracking
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    try {
      const updated = await api.updateOrderTracking(trackingModalOrder.id, {
        courierName,
        trackingNumber,
        notes: trackingNotes
      });
      setOrders(prev => prev.map(o => o.id === trackingModalOrder.id ? updated : o));
      setTrackingModalOrder(null);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const imagesInput = String(formData.get('images') || '');
    const imagesList = imagesInput.split('\n').map(s => s.trim()).filter(Boolean);

    const payload: Partial<Product> = {
      name: String(formData.get('name') || ''),
      sku: String(formData.get('sku') || ''),
      categoryId: String(formData.get('categoryId') || ''),
      brand: String(formData.get('brand') || ''),
      shortDescription: String(formData.get('shortDescription') || ''),
      description: String(formData.get('description') || ''),
      originalPrice: Number(formData.get('originalPrice') || 0),
      salePrice: Number(formData.get('salePrice') || 0),
      stock: Number(formData.get('stock') || 0),
      videoUrl: String(formData.get('videoUrl') || '') || undefined,
      images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
      featured: formData.get('featured') === 'on',
      bestSeller: formData.get('bestSeller') === 'on',
      newArrival: formData.get('newArrival') === 'on',
      onSale: formData.get('onSale') === 'on'
    };

    try {
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await api.createProduct(payload);
        setProducts(prev => [created, ...prev]);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      onRefreshPublicData();
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      onRefreshPublicData();
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Partial<Category> = {
      name: String(formData.get('name') || ''),
      slug: String(formData.get('slug') || ''),
      description: String(formData.get('description') || ''),
      image: String(formData.get('image') || ''),
      order: Number(formData.get('order') || 1)
    };

    try {
      if (editingCategory) {
        const updated = await api.updateCategory(editingCategory.id, payload);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
      } else {
        const created = await api.createCategory(payload);
        setCategories(prev => [...prev, created]);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Coupon
  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Partial<Coupon> = {
      code: String(formData.get('code') || ''),
      type: formData.get('type') as any || 'percentage',
      discountValue: Number(formData.get('discountValue') || 0),
      minOrderAmount: Number(formData.get('minOrderAmount') || 0),
      expiryDate: String(formData.get('expiryDate') || '2027-12-31'),
      usageLimit: Number(formData.get('usageLimit') || 500),
      isActive: true
    };

    try {
      const created = await api.createCoupon(payload);
      setCoupons(prev => [created, ...prev]);
      setShowCouponModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon code?')) return;
    try {
      await api.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Customer Block
  const handleToggleBlockCustomer = async (id: string) => {
    try {
      const res = await api.toggleBlockCustomer(id);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, isBlocked: res.isBlocked } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Payment Method
  const handleTogglePaymentMethod = async (method: PaymentMethodConfig) => {
    try {
      const updated = await api.updatePaymentMethod(method.id, {
        enabled: !method.enabled
      });
      setPaymentMethods(prev => prev.map(m => m.id === method.id ? updated : m));
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save / Add Payment Method Details (JazzCash, EasyPaisa, Bank Transfer, etc.)
  const handleSavePaymentMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: Partial<PaymentMethodConfig> = {
      name: String(formData.get('name') || '').trim(),
      accountTitle: String(formData.get('accountTitle') || '').trim(),
      accountNumber: String(formData.get('accountNumber') || '').trim(),
      bankName: String(formData.get('bankName') || '').trim(),
      iban: String(formData.get('iban') || '').trim(),
      instructions: String(formData.get('instructions') || '').trim(),
      requireProofScreenshot: formData.get('requireProofScreenshot') === 'on',
      enabled: formData.get('enabled') === 'on'
    };

    try {
      if (editingPaymentMethod) {
        const updated = await api.updatePaymentMethod(editingPaymentMethod.id, payload);
        setPaymentMethods(prev => prev.map(m => m.id === editingPaymentMethod.id ? updated : m));
        setPaymentSavedMessage(`${updated.name} details updated!`);
      } else {
        const created = await api.createPaymentMethod(payload);
        setPaymentMethods(prev => [...prev, created]);
        setPaymentSavedMessage(`${created.name} added!`);
      }
      setShowPaymentModal(false);
      setEditingPaymentMethod(null);
      onRefreshPublicData();
      setTimeout(() => setPaymentSavedMessage(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save payment method details');
    }
  };

  // Delete Custom Payment Method
  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Remove this payment channel?')) return;
    try {
      await api.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method');
    }
  };

  // Save / Add Delivery Zone
  const handleSaveDeliveryZone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: Partial<DeliveryZone> = {
      province: String(formData.get('province') || 'Punjab'),
      city: String(formData.get('city') || '').trim(),
      standardFee: Number(formData.get('standardFee') || 200),
      freeDeliveryThreshold: Number(formData.get('freeDeliveryThreshold') || 2999),
      estimatedDays: String(formData.get('estimatedDays') || '2-4 Days').trim()
    };

    try {
      if (editingDeliveryZone) {
        const updated = await api.updateDeliveryZone(editingDeliveryZone.id, payload);
        setDeliveryZones(prev => prev.map(z => z.id === editingDeliveryZone.id ? updated : z));
      } else {
        const created = await api.createDeliveryZone(payload);
        setDeliveryZones(prev => [...prev, created]);
      }
      setShowDeliveryModal(false);
      setEditingDeliveryZone(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save delivery zone');
    }
  };

  const handleDeleteDeliveryZone = async (id: string) => {
    if (!confirm('Delete this delivery zone rule?')) return;
    try {
      await api.deleteDeliveryZone(id);
      setDeliveryZones(prev => prev.filter(z => z.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete delivery zone');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Partial<StoreSettings> = {
      storeName: String(formData.get('storeName') || ''),
      tagline: String(formData.get('tagline') || ''),
      logo: String(formData.get('logo') || '').trim() || settings?.logo || '/logo.jpg',
      contactNumber: String(formData.get('contactNumber') || ''),
      whatsappNumber: String(formData.get('whatsappNumber') || ''),
      email: String(formData.get('email') || ''),
      storeAddress: String(formData.get('storeAddress') || ''),
      announcement: String(formData.get('announcement') || '')
    };

    try {
      const res = await api.updateSettings(payload);
      setSettings(res);
      setLogoInputUrl(res.logo || '/logo.jpg');
      setSettingsSavedMessage(true);
      onRefreshPublicData();
      setTimeout(() => setSettingsSavedMessage(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Admin-only Logo File Upload
  const handleAdminLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image size must be under 2 MB.');
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoInputUrl(dataUrl);
      try {
        setLogoSaving(true);
        await updateLogo(dataUrl);
        setSettings(prev => (prev ? { ...prev, logo: dataUrl } : prev));
        onRefreshPublicData();
        setLogoSavedMsg('Store logo updated for all visitors!');
        setTimeout(() => setLogoSavedMsg(''), 3000);
      } catch (err: any) {
        setLogoError(err.message || 'Failed to update logo.');
      } finally {
        setLogoSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Admin-only Logo URL Apply
  const handleAdminSaveLogoUrl = async () => {
    setLogoError('');
    if (!logoInputUrl.trim()) {
      setLogoError('Please enter a logo URL or upload an image.');
      return;
    }
    try {
      setLogoSaving(true);
      await updateLogo(logoInputUrl.trim());
      setSettings(prev => (prev ? { ...prev, logo: logoInputUrl.trim() } : prev));
      onRefreshPublicData();
      setLogoSavedMsg('Store logo updated for all visitors!');
      setTimeout(() => setLogoSavedMsg(''), 3000);
    } catch (err: any) {
      setLogoError(err.message || 'Failed to save logo.');
    } finally {
      setLogoSaving(false);
    }
  };

  // Admin-only Reset Logo
  const handleAdminResetLogo = async () => {
    setLogoError('');
    try {
      setLogoSaving(true);
      await resetLogo();
      setLogoInputUrl('/logo.jpg');
      setSettings(prev => (prev ? { ...prev, logo: '/logo.jpg' } : prev));
      onRefreshPublicData();
      setLogoSavedMsg('Default store logo restored.');
      setTimeout(() => setLogoSavedMsg(''), 3000);
    } catch (err: any) {
      setLogoError(err.message || 'Failed to reset logo.');
    } finally {
      setLogoSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <BrandLogo variant="admin" size="sm" />

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reload data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Go to Store</span>
          </button>

          <button
            onClick={() => { logout(); onClose(); }}
            className="p-2 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition"
            title="Log out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between p-3 shrink-0 overflow-y-auto">
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'overview' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition ${
                activeTab === 'orders' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>Orders</span>
              </div>
              {stats?.pendingOrders ? (
                <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">
                  {stats.pendingOrders}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition ${
                activeTab === 'products' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-blue-500" />
                <span>Products ({products.length})</span>
              </div>
              {stats?.lowStockCount ? (
                <span className="bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]" title="Low stock items">
                  {stats.lowStockCount}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'categories' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'customers' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Customers ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'coupons' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TicketPercent className="w-4 h-4 text-rose-500" />
              <span>Coupons & Promos</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'delivery' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Pakistan Delivery</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'payments' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4 text-teal-500" />
              <span>Payment Methods</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition ${
                activeTab === 'settings' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Brand & Store Settings</span>
            </button>
          </nav>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-800 block">Single Admin Mode</span>
            <p>Direct database mutations & verified transactions.</p>
          </div>
        </aside>

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {/* ==================================================== */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                  Store Performance & KPIs
                </h1>
                <p className="text-xs text-slate-500">Live sales overview across Pakistan</p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                  <h3 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    {formatPKR(stats.totalSales)}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold block">
                    All-time completed sales
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Today's Sales</span>
                  <h3 className="text-2xl font-black text-emerald-700 font-['Outfit']">
                    {formatPKR(stats.todaySales)}
                  </h3>
                  <span className="text-[11px] text-slate-500 block">Today's orders sum</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
                  <h3 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    {stats.totalOrders}
                  </h3>
                  <div className="flex gap-2 text-[11px] font-bold">
                    <span className="text-amber-600">{stats.pendingOrders} Pending</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600">{stats.deliveredOrders} Delivered</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Low Stock Alerts</span>
                  <h3 className={`text-2xl font-black font-['Outfit'] ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {stats.lowStockCount} Items
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    Products with ≤ 5 units left
                  </span>
                </div>
              </div>

              {/* 7-Day Revenue Trend Visualizer */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Recent 7 Days Sales Trend (PKR)
                  </h3>
                  <span className="text-xs text-slate-400">Daily breakdown</span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
                  {stats.dailySales.map((day, i) => {
                    const maxVal = Math.max(...stats.dailySales.map(d => d.amount), 5000);
                    const heightPercent = Math.max(12, Math.round((day.amount / maxVal) * 100));

                    return (
                      <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-600">{formatPKR(day.amount)}</span>
                        <div
                          className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-t-xl transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] text-slate-400 truncate max-w-full">{day.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock Items Warning Table */}
              {stats.lowStockItems.length > 0 && (
                <div className="p-6 rounded-3xl bg-red-50/70 border border-red-200 space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Inventory Low Stock Alert (Needs Reorder)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.lowStockItems.map(item => (
                      <div key={item.id} className="p-3 bg-white rounded-xl border border-red-200 text-xs flex justify-between items-center shadow-2xs">
                        <div className="truncate mr-2">
                          <strong className="block text-slate-800 truncate">{item.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </div>
                        <span className="bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded text-[11px] shrink-0">
                          {item.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: ORDERS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Orders Management
                  </h1>
                  <p className="text-xs text-slate-500">Track, update and verify payments for customer orders</p>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Phone..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 bg-white text-xs rounded-xl border border-slate-300 outline-none"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-white text-xs py-2 px-3 rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">City</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(o => {
                        const matchesFilter = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
                        const q = orderSearch.toLowerCase();
                        const matchesSearch = !q ||
                          o.id.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.customerPhone.toLowerCase().includes(q);
                        return matchesFilter && matchesSearch;
                      })
                      .map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block">{order.customerName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</span>
                          </td>
                          <td className="p-3.5 text-slate-600">{order.shippingAddress.city}</td>
                          <td className="p-3.5 font-bold text-slate-900 font-['Outfit']">{formatPKR(order.total)}</td>
                          <td className="p-3.5">
                            <span className="uppercase font-semibold block text-[11px] text-slate-700">
                              {order.paymentMethod}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${
                              order.paymentStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-slate-50 border border-slate-300 text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            {/* Verify manual payment button */}
                            {order.paymentMethod !== 'cod' && order.paymentStatus === 'pending' && (
                              <button
                                onClick={() => handleVerifyPayment(order.id, 'verified')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md text-[11px] font-bold shadow-2xs"
                                title="Approve & verify manual payment"
                              >
                                Verify Pay
                              </button>
                            )}

                            {/* Add Tracking button */}
                            <button
                              onClick={() => {
                                setTrackingModalOrder(order);
                                setCourierName(order.tracking?.courierName || 'TCS Pakistan');
                                setTrackingNumber(order.tracking?.trackingNumber || '');
                                setTrackingNotes(order.tracking?.notes || '');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-[11px] font-semibold"
                              title="Courier tracking code"
                            >
                              Tracking
                            </button>

                            {/* View invoice */}
                            <button
                              onClick={() => onViewInvoice(order.id)}
                              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                              title="Invoice"
                            >
                              <Printer className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Product Catalog Management
                  </h1>
                  <p className="text-xs text-slate-500">Add, edit, manage stock & variants for products</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="px-3 py-2 bg-white text-xs rounded-xl border border-slate-300 outline-none"
                  />
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (PKR)</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Badges</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} • {p.brand}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600">{categories.find(c => c.id === p.categoryId)?.name || 'Other'}</td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {formatPKR(p.salePrice)}
                            {p.originalPrice > p.salePrice && (
                              <span className="block text-[10px] text-slate-400 line-through">{formatPKR(p.originalPrice)}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              p.stock <= 4 ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-1 flex-wrap">
                              {p.featured && <span className="bg-purple-100 text-purple-800 text-[10px] px-1 rounded">Featured</span>}
                              {p.bestSeller && <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded">Best Seller</span>}
                              {p.newArrival && <span className="bg-blue-100 text-blue-800 text-[10px] px-1 rounded">New</span>}
                            </div>
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setShowProductModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Category Management
                  </h1>
                  <p className="text-xs text-slate-500">Organize and add unlimited Pakistani product categories</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <img src={cat.image} alt={cat.name} className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-bold text-slate-900 truncate">{cat.name}</h4>
                      <p className="text-slate-400 text-[10px]">Slug: {cat.slug}</p>
                      <span className="text-[10px] text-slate-500">Order: #{cat.order}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: CUSTOMERS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                  Registered Customers ({customers.length})
                </h1>
                <p className="text-xs text-slate-500">View customer activity, order counts, and access controls</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Orders</th>
                      <th className="p-3.5">Total Spent</th>
                      <th className="p-3.5 text-right">Status / Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-3.5 text-slate-600">{c.email}</td>
                        <td className="p-3.5 font-mono text-slate-600">{c.phone}</td>
                        <td className="p-3.5 font-bold text-slate-800">{c.totalOrders}</td>
                        <td className="p-3.5 font-bold text-emerald-700 font-['Outfit']">{formatPKR(c.totalSpent)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleBlockCustomer(c.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              c.isBlocked
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-slate-100'
                            }`}
                          >
                            {c.isBlocked ? 'Blocked (Unblock)' : 'Active (Block)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: COUPONS */}
          {/* ==================================================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Discount Coupons & Vouchers
                  </h1>
                  <p className="text-xs text-slate-500">Create percentage and fixed PKR promotions</p>
                </div>
                <button
                  onClick={() => setShowCouponModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Coupon</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-1 rounded text-sm">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-slate-800">
                      {c.type === 'percentage' ? `${c.discountValue}% OFF` : `Flat ${formatPKR(c.discountValue)} OFF`}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Min. Order: {formatPKR(c.minOrderAmount)} • Used: {c.usedCount}/{c.usageLimit}
                    </p>
                    <span className="text-[10px] text-slate-400 block">Expires: {c.expiryDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: PAKISTAN DELIVERY SETTINGS */}
          {/* ==================================================== */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Pakistan Delivery Rates & Zones
                  </h1>
                  <p className="text-xs text-slate-500">Configure city delivery charges, thresholds, and estimated timelines</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDeliveryZone(null);
                    setShowDeliveryModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Delivery City</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Province</th>
                      <th className="p-3.5">City / Zone</th>
                      <th className="p-3.5">Standard Fee</th>
                      <th className="p-3.5">Free Delivery Threshold</th>
                      <th className="p-3.5">Estimated Transit Time</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveryZones.map(zone => (
                      <tr key={zone.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-medium text-slate-600">{zone.province}</td>
                        <td className="p-3.5 font-bold text-slate-900">{zone.city}</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{formatPKR(zone.standardFee)}</td>
                        <td className="p-3.5 font-mono text-slate-700 font-bold">Above {formatPKR(zone.freeDeliveryThreshold)}</td>
                        <td className="p-3.5 text-slate-600">{zone.estimatedDays}</td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingDeliveryZone(zone);
                              setShowDeliveryModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                            title="Edit zone"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeliveryZone(zone.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Delete zone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 8: PAYMENT METHODS MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Payment Channels & Account Details
                  </h1>
                  <p className="text-xs text-slate-500">
                    Edit JazzCash number, EasyPaisa account, Bank Transfer / IBAN details, Card & COD instructions, or add new payment accounts
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingPaymentMethod(null);
                    setShowPaymentModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 self-start shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Payment Account</span>
                </button>
              </div>

              {paymentSavedMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {paymentSavedMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paymentMethods.map(method => {
                  const isBuiltIn = ['cod', 'easypaisa', 'jazzcash', 'bank_transfer', 'card'].includes(method.id);
                  return (
                    <div key={method.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3.5 text-xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{method.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              ID: {method.id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleTogglePaymentMethod(method)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                              method.enabled
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {method.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>

                        <p className="text-slate-600 leading-relaxed text-[11px]">{method.instructions}</p>

                        {(method.accountTitle || method.accountNumber || method.bankName || method.iban) && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                            {method.bankName && (
                              <div className="flex justify-between gap-2">
                                <span className="text-slate-500">Bank / Channel:</span>
                                <strong className="text-slate-900 text-right">{method.bankName}</strong>
                              </div>
                            )}
                            {method.accountTitle && (
                              <div className="flex justify-between gap-2">
                                <span className="text-slate-500">Account Title:</span>
                                <strong className="text-slate-900 text-right">{method.accountTitle}</strong>
                              </div>
                            )}
                            {method.accountNumber && (
                              <div className="flex justify-between gap-2">
                                <span className="text-slate-500">Account / Mobile #:</span>
                                <strong className="text-emerald-700 font-mono text-right">{method.accountNumber}</strong>
                              </div>
                            )}
                            {method.iban && (
                              <div className="flex justify-between gap-2">
                                <span className="text-slate-500">IBAN / Raast ID:</span>
                                <strong className="text-slate-900 font-mono text-[10px] text-right break-all">{method.iban}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {method.id === 'cod'
                            ? 'Doorstep cash collection'
                            : method.id === 'card'
                            ? '3D Secure OTP card form'
                            : method.requireProofScreenshot !== false
                            ? 'Requires TRX ID / Receipt'
                            : 'No receipt required'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPaymentMethod(method);
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>

                          {!isBuiltIn && (
                            <button
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete payment channel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 9: BRAND & STORE SETTINGS */}
          {/* ==================================================== */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                  Brand & Store Configuration
                </h1>
                <p className="text-xs text-slate-500">Update store name, logo URL, contact info, WhatsApp number and announcement banner</p>
              </div>

              {settingsSavedMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Settings updated successfully!
                </div>
              )}

              {/* Admin-Only Store Logo Management Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 border-2 border-emerald-500/30 shadow-sm shrink-0 flex items-center justify-center">
                      <img
                        src={logoInputUrl || settings.logo || '/logo.jpg'}
                        alt="Store Logo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>Store Brand Logo (Admin Only)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Only you (Admin) can change the logo. Changes apply live across the entire store.
                      </p>
                    </div>
                  </div>
                </div>

                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAdminLogoFileUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={logoSaving}
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 text-slate-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload Logo from Phone / PC</span>
                  </button>

                  <button
                    type="button"
                    disabled={logoSaving}
                    onClick={handleAdminResetLogo}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="/logo.jpg or https://..."
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    disabled={logoSaving}
                    onClick={handleAdminSaveLogoUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {logoSaving ? 'Saving...' : 'Apply Logo'}
                  </button>
                </div>

                {logoError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                    {logoError}
                  </p>
                )}

                {logoSavedMsg && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span>{logoSavedMsg}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    name="storeName"
                    defaultValue={settings.storeName}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    defaultValue={settings.tagline}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <input type="hidden" name="logo" value={logoInputUrl || settings.logo || '/logo.jpg'} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp Support Number</label>
                    <input
                      type="text"
                      name="whatsappNumber"
                      defaultValue={settings.whatsappNumber}
                      placeholder="+923001234567"
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      name="contactNumber"
                      defaultValue={settings.contactNumber}
                      placeholder="+92 300 1234567"
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={settings.email}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Physical Address (Lahore / Pakistan)</label>
                  <input
                    type="text"
                    name="storeAddress"
                    defaultValue={settings.storeAddress}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Top Announcement Banner Text</label>
                  <textarea
                    rows={2}
                    name="announcement"
                    defaultValue={settings.announcement}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition"
                >
                  Save Store Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {/* ==================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ''}
                  placeholder="e.g. Ultra Pro Wireless Earbuds"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    name="categoryId"
                    defaultValue={editingProduct?.categoryId || categories[0]?.id}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    name="brand"
                    required
                    defaultValue={editingProduct?.brand || 'HS Solution'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sale Price (PKR) *</label>
                  <input
                    type="number"
                    name="salePrice"
                    required
                    defaultValue={editingProduct?.salePrice || 2499}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Original Price (PKR)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    defaultValue={editingProduct?.originalPrice || 3999}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    defaultValue={editingProduct?.stock || 25}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                <input
                  type="text"
                  name="sku"
                  defaultValue={editingProduct?.sku || `BQM-${Math.floor(1000 + Math.random() * 9000)}`}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Image URLs (One per line) *</label>
                <textarea
                  rows={3}
                  name="images"
                  defaultValue={editingProduct?.images?.join('\n') || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80'}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  defaultValue={editingProduct?.shortDescription || ''}
                  placeholder="Key features summary..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  name="description"
                  defaultValue={editingProduct?.description || ''}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="featured" defaultChecked={editingProduct?.featured} />
                  <span>Featured Product</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="bestSeller" defaultChecked={editingProduct?.bestSeller} />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="newArrival" defaultChecked={editingProduct?.newArrival} />
                  <span>New Arrival</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT CATEGORY */}
      {/* ==================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ''}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={editingCategory?.slug || ''}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  name="image"
                  defaultValue={editingCategory?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sort Order #</label>
                <input
                  type="number"
                  name="order"
                  defaultValue={editingCategory?.order || categories.length + 1}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD COURIER TRACKING CODE */}
      {/* ==================================================== */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
              Assign Courier Tracking: {trackingModalOrder.id}
            </h3>
            <form onSubmit={handleSaveTracking} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Partner *</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                >
                  <option value="TCS Pakistan">TCS Pakistan</option>
                  <option value="Leopards Courier">Leopards Courier</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="PostEx Logistics">PostEx Logistics</option>
                  <option value="Trax Logistics">Trax Logistics</option>
                  <option value="M&P Express">M&P Express</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tracking Number / Consignment # *</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TCS78921829"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Notes</label>
                <input
                  type="text"
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  placeholder="e.g. Picked up from Lahore hub"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save & Update Status to Shipped
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CREATE COUPON */}
      {/* ==================================================== */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
              Create New Coupon
            </h3>
            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g. SUMMER20"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select name="type" className="w-full p-2.5 rounded-xl border border-slate-300">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed PKR (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    required
                    placeholder="15 or 500"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Order Amount (PKR)</label>
                <input
                  type="number"
                  name="minOrderAmount"
                  defaultValue={1500}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: ADD / EDIT PAYMENT METHOD & ACCOUNT DETAILS */}
      {/* ==================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
                {editingPaymentMethod ? `Edit: ${editingPaymentMethod.name}` : 'Add New Payment Account'}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPaymentMethod(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Channel Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingPaymentMethod?.name || ''}
                  placeholder="e.g. JazzCash Wallet / Easypaisa / Meezan Bank Transfer / SadaPay"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Title
                  </label>
                  <input
                    type="text"
                    name="accountTitle"
                    defaultValue={editingPaymentMethod?.accountTitle || ''}
                    placeholder="e.g. HS Solution Official"
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account / Mobile Number / Till ID
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    defaultValue={editingPaymentMethod?.accountNumber || ''}
                    placeholder="e.g. 0301-8765432 or 010203040506"
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bank / Wallet Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    defaultValue={editingPaymentMethod?.bankName || ''}
                    placeholder="e.g. Meezan Bank / HBL / JazzCash"
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    IBAN / Raast ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="iban"
                    defaultValue={editingPaymentMethod?.iban || ''}
                    placeholder="e.g. PK64MEZN000102030405060708"
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instructions Shown to Customer *
                </label>
                <textarea
                  rows={3}
                  name="instructions"
                  required
                  defaultValue={
                    editingPaymentMethod?.instructions ||
                    'Transfer the total amount to the account details above and enter your Transaction ID (TRX/TID) or upload screenshot.'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={editingPaymentMethod ? editingPaymentMethod.enabled : true}
                  />
                  <span className="font-semibold text-slate-800">Enable this payment method at Checkout</span>
                </label>

                {(!editingPaymentMethod || (editingPaymentMethod.id !== 'cod' && editingPaymentMethod.id !== 'card')) && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requireProofScreenshot"
                      defaultChecked={editingPaymentMethod ? editingPaymentMethod.requireProofScreenshot !== false : true}
                    />
                    <span className="font-semibold text-slate-800">Require Transaction ID / Payment Screenshot</span>
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setEditingPaymentMethod(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Payment Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 6: ADD / EDIT DELIVERY ZONE */}
      {/* ==================================================== */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
              {editingDeliveryZone ? `Edit Delivery: ${editingDeliveryZone.city}` : 'Add Delivery City / Zone'}
            </h3>
            <form onSubmit={handleSaveDeliveryZone} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Province *</label>
                <select
                  name="province"
                  defaultValue={editingDeliveryZone?.province || PAKISTAN_PROVINCES[0]}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                >
                  {PAKISTAN_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City Name *</label>
                <input
                  type="text"
                  name="city"
                  required
                  list="pk-cities-list"
                  defaultValue={editingDeliveryZone?.city || ''}
                  placeholder="e.g. Lahore, Karachi, Multan"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
                <datalist id="pk-cities-list">
                  {PAKISTAN_MAJOR_CITIES.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Fee (PKR) *</label>
                  <input
                    type="number"
                    name="standardFee"
                    required
                    defaultValue={editingDeliveryZone?.standardFee ?? 200}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Free Delivery Above *</label>
                  <input
                    type="number"
                    name="freeDeliveryThreshold"
                    required
                    defaultValue={editingDeliveryZone?.freeDeliveryThreshold ?? 2999}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Transit Time</label>
                <input
                  type="text"
                  name="estimatedDays"
                  defaultValue={editingDeliveryZone?.estimatedDays || '2-4 Working Days'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setEditingDeliveryZone(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
