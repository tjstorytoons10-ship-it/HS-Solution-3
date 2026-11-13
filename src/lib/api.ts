import { Product, Category, Order, Coupon, DeliveryZone, PaymentMethodConfig, User, StoreSettings, DashboardStats } from '../types';

const TOKEN_KEY = 'buraqmart_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY)
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    apiFetch<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  adminLogin: (data: { email: string; password: string }) =>
    apiFetch<{ token: string; user: User }>('/auth/admin-login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => apiFetch<{ user: User }>('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string }) =>
    apiFetch<{ user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  addAddress: (address: any) =>
    apiFetch<{ savedAddresses: any[] }>('/auth/addresses', { method: 'POST', body: JSON.stringify(address) }),

  deleteAddress: (id: string) =>
    apiFetch<{ savedAddresses: any[] }>(`/auth/addresses/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => apiFetch<Category[]>('/categories'),
  createCategory: (data: Partial<Category>) => apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) => apiFetch<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiFetch<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params?: { search?: string; category?: string; minPrice?: number; maxPrice?: number; brand?: string; rating?: number; inStock?: boolean; sort?: string; tag?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    return apiFetch<Product[]>(`/products${qStr ? `?${qStr}` : ''}`);
  },

  getProduct: (idOrSlug: string) => apiFetch<Product>(`/products/${idOrSlug}`),
  createProduct: (data: Partial<Product>) => apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => apiFetch<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiFetch<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
  addReview: (productId: string, data: { userName: string; userCity?: string; rating: number; comment: string; imageUrl?: string }) =>
    apiFetch<any>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),

  // Delivery
  getDeliveryRates: () => apiFetch<DeliveryZone[]>('/delivery-rates'),
  createDeliveryZone: (data: Partial<DeliveryZone>) => apiFetch<DeliveryZone>('/delivery-rates', { method: 'POST', body: JSON.stringify(data) }),
  updateDeliveryZone: (id: string, data: Partial<DeliveryZone>) => apiFetch<DeliveryZone>(`/delivery-rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeliveryZone: (id: string) => apiFetch<{ message: string }>(`/delivery-rates/${id}`, { method: 'DELETE' }),

  // Payment
  getPaymentMethods: () => apiFetch<PaymentMethodConfig[]>('/payment-methods'),
  createPaymentMethod: (data: Partial<PaymentMethodConfig>) =>
    apiFetch<PaymentMethodConfig>('/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodConfig>) =>
    apiFetch<PaymentMethodConfig>(`/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePaymentMethod: (id: string) =>
    apiFetch<{ message: string }>(`/payment-methods/${id}`, { method: 'DELETE' }),

  // Coupons
  getCoupons: () => apiFetch<Coupon[]>('/coupons'),
  validateCoupon: (code: string, orderAmount: number, categoryId?: string) =>
    apiFetch<{ valid: boolean; code: string; type: 'percentage' | 'fixed'; discountValue: number; discountAmount: number }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount, categoryId })
    }),
  createCoupon: (data: Partial<Coupon>) => apiFetch<Coupon>('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: Partial<Coupon>) => apiFetch<Coupon>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => apiFetch<{ message: string }>(`/coupons/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (orderData: any) => apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  trackOrder: (orderId: string) => apiFetch<any>(`/orders/track/${orderId}`),
  getMyOrders: () => apiFetch<Order[]>('/orders/my/list'),
  getOrder: (orderId: string) => apiFetch<Order>(`/orders/${orderId}`),

  // Admin
  getAdminOrders: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch<Order[]>(`/admin/orders${q ? `?${q}` : ''}`);
  },
  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch<Order>(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  verifyOrderPayment: (orderId: string, paymentStatus: 'pending' | 'verified' | 'failed') =>
    apiFetch<Order>(`/admin/orders/${orderId}/payment`, { method: 'PUT', body: JSON.stringify({ paymentStatus }) }),
  updateOrderTracking: (orderId: string, trackingData: { courierName: string; trackingNumber: string; notes?: string }) =>
    apiFetch<Order>(`/admin/orders/${orderId}/tracking`, { method: 'PUT', body: JSON.stringify(trackingData) }),

  getAdminStats: () => apiFetch<DashboardStats>('/admin/stats'),
  getAdminCustomers: () => apiFetch<any[]>('/admin/customers'),
  toggleBlockCustomer: (id: string) => apiFetch<any>(`/admin/customers/${id}/toggle-block`, { method: 'PUT' }),

  // Store Settings
  getSettings: () => apiFetch<StoreSettings>('/settings'),
  updateSettings: (data: Partial<StoreSettings>) => apiFetch<StoreSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
};
