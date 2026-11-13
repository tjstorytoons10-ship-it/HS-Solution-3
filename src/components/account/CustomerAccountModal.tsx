import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  HelpCircle,
  LogOut,
  Plus,
  FileText,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Order, Product } from '../../types';
import { formatPKR, formatDate, PAKISTAN_PROVINCES, PAKISTAN_MAJOR_CITIES } from '../../lib/formatters';
import { api } from '../../lib/api';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onViewInvoice: (orderId: string) => void;
  onOpenAdminDashboard?: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  onViewInvoice,
  onOpenAdminDashboard
}) => {
  const { user, isAdmin, login, register, logout } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'profile' | 'support'>('orders');

  // Auth form states (if not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Add Address states
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrProvince, setAddrProvince] = useState('Punjab');
  const [addrCity, setAddrCity] = useState('Lahore');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      loadCustomerOrders();
    }
  }, [user, isOpen]);

  const loadCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const loggedInUser = await login({ email: email.trim(), password });
        setPassword('');
        if (
          loggedInUser.role === 'admin' &&
          loggedInUser.email?.toLowerCase() === 'storetech@gmail.com'
        ) {
          onClose();
          onOpenAdminDashboard?.();
          return;
        }
      } else {
        if (!name.trim() || !phone.trim()) {
          throw new Error('Please fill all required fields');
        }
        await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
        setPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrArea.trim()) return;

    try {
      await api.addAddress({
        label: addrLabel,
        province: addrProvince,
        city: addrCity,
        area: addrArea.trim(),
        streetAddress: addrStreet.trim(),
        isDefault: false
      });
      setShowAddAddress(false);
      setAddrArea('');
      setAddrStreet('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 text-slate-100">
        {/* Modal Top Bar */}
        <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="font-extrabold text-white text-base font-['Outfit']">
              {user ? `Customer Account: ${user.name}` : 'Sign In to HS Solution'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            /* Unauthenticated View: Login / Register */
            <div className="p-6 sm:p-10 max-w-md mx-auto space-y-6">
              <div className="flex border-b border-slate-800 font-mono">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 pb-3 font-bold text-sm transition border-b-2 ${
                    authMode === 'login'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 pb-3 font-bold text-sm transition border-b-2 ${
                    authMode === 'register'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-mono">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Tariq Mehmood"
                        className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Mobile Number (Pakistan)</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0300-1234567"
                        className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Customer Dashboard with Tabs */
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
              {/* Sidebar */}
              <div className="p-4 border-r border-slate-800 bg-slate-950/60 space-y-1 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition ${
                    activeTab === 'orders' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Orders ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition ${
                    activeTab === 'wishlist' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Wishlist ({wishlist.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition ${
                    activeTab === 'addresses' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Addresses</span>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition ${
                    activeTab === 'profile' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition ${
                    activeTab === 'support' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Help & WhatsApp</span>
                </button>

                {/* Owner Only: Switch to Admin Dashboard */}
                {isAdmin && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdminDashboard?.();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-slate-950" />
                        <span>Owner Admin Panel</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl text-rose-400 hover:bg-rose-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="md:col-span-3 p-6 sm:p-8 space-y-6">
                {/* 1. My Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-white text-base font-['Outfit']">
                      Order History ({orders.length})
                    </h3>

                    {ordersLoading ? (
                      <p className="text-xs text-slate-400 font-mono">Loading orders...</p>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl font-mono">
                        No orders placed yet.
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-cyan-400 text-sm">{order.id}</span>
                              <span className="text-slate-500 block text-[11px]">{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="border border-cyan-500/30 text-cyan-400 bg-cyan-950/40 font-bold px-2.5 py-0.5 rounded-xs uppercase text-[10px]">
                                {order.orderStatus}
                              </span>
                              <button
                                onClick={() => onViewInvoice(order.id)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400"
                                title="View invoice"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Items in order */}
                          <div className="space-y-1.5 pt-1 border-t border-slate-800">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-slate-300">
                                <span className="truncate max-w-[240px]">{it.name} (×{it.quantity})</span>
                                <span className="font-bold text-cyan-300">{formatPKR(it.price * it.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-slate-200">
                            <span>Total (COD / Raast)</span>
                            <span className="text-cyan-400 font-['Outfit'] text-sm">{formatPKR(order.total)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-white text-base font-['Outfit']">
                      Saved Wishlist ({wishlist.length})
                    </h3>

                    {wishlist.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl font-mono">
                        Your wishlist is empty. Tap the heart icon on any gear to save it!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {wishlist.map(p => (
                          <div key={p.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center gap-3">
                            <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0" />
                            <div className="flex-1 min-w-0 text-xs">
                              <h4 className="font-bold text-white truncate">{p.name}</h4>
                              <p className="text-cyan-300 font-mono font-bold">{formatPKR(p.salePrice)}</p>
                              <div className="flex items-center gap-2 mt-2 font-mono">
                                <button
                                  onClick={() => addToCart(p, 1)}
                                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-2.5 py-1 rounded-sm text-[11px] font-bold"
                                >
                                  Add to Cart
                                </button>
                                <button
                                  onClick={() => removeFromWishlist(p.id)}
                                  className="text-rose-400 hover:underline text-[11px]"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Saved Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-white text-base font-['Outfit']">
                        Saved Delivery Addresses
                      </h3>
                      <button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Address
                      </button>
                    </div>

                    {showAddAddress && (
                      <form onSubmit={handleAddAddress} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="font-bold text-white">Add New Address</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Label (e.g. Home, Office)"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
                          />
                          <select
                            value={addrProvince}
                            onChange={(e) => setAddrProvince(e.target.value)}
                            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
                          >
                            {PAKISTAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
                          >
                            {PAKISTAN_MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input
                            type="text"
                            placeholder="Area / Phase"
                            required
                            value={addrArea}
                            onChange={(e) => setAddrArea(e.target.value)}
                            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Complete Street Address & House #"
                          required
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-lg"
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAddress(false)}
                            className="bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2">
                      {user.savedAddresses?.map(addr => (
                        <div key={addr.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{addr.label}</span>
                            <span className="text-slate-400">{addr.streetAddress}, {addr.area}, {addr.city}, {addr.province}</span>
                          </div>
                          {addr.isDefault && (
                            <span className="border border-cyan-500/30 text-cyan-400 bg-cyan-950/40 text-[10px] font-bold px-2 py-0.5 rounded-xs">
                              Default
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Profile Information Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-4 text-xs font-mono">
                    <h3 className="font-extrabold text-white text-base font-['Outfit']">
                      Account Profile
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div>
                        <span className="text-slate-500 block">Name:</span>
                        <strong className="text-white font-bold text-sm">{user.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Email:</span>
                        <strong className="text-white">{user.email}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phone:</span>
                        <strong className="text-cyan-400">{user.phone}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Role:</span>
                        <span className="capitalize font-bold text-cyan-400">{user.role}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Support Tab */}
                {activeTab === 'support' && (
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-mono">
                    <h3 className="font-extrabold text-white text-base font-['Outfit']">
                      Customer Support
                    </h3>
                    <p className="text-slate-400">Have an inquiry regarding delivery, warranty claims, or product setup?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                        <strong className="block text-cyan-300 font-bold text-sm mb-1 font-['Outfit']">WhatsApp Helpline</strong>
                        <p className="text-slate-400 text-xs">Direct chat with our Lahore hardware team.</p>
                        <a
                          href="https://wa.me/923001234567"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="block text-white font-bold text-sm mb-1 font-['Outfit']">Helpline Call</strong>
                        <p className="text-slate-400 text-xs">+92 300 1234567 (Mon-Sat, 10 AM to 8 PM)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
