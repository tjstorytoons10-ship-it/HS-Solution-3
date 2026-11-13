import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  CreditCard,
  Building,
  Phone,
  FileText,
  MessageCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  QrCode,
  Lock,
  Smartphone,
  X,
  Zap,
  Sparkles
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Order, PaymentMethodConfig, DeliveryZone } from '../../types';
import { formatPKR, PAKISTAN_PROVINCES, PAKISTAN_MAJOR_CITIES } from '../../lib/formatters';
import { api } from '../../lib/api';

interface CheckoutPageProps {
  onBackToShopping: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToShopping,
  onOrderSuccess
}) => {
  const { items, subtotal, appliedCoupon, discountAmount, clearCart } = useCart();
  const { user } = useAuth();

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [province, setProvince] = useState('Punjab');
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [instructions, setInstructions] = useState('');

  // Payment Selection & Manual Details
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card Payment States
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [is3DSecureModalOpen, setIs3DSecureModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Delivery rules
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Load payment methods & delivery zones from API
  useEffect(() => {
    async function loadData() {
      try {
        const [methods, zones] = await Promise.all([
          api.getPaymentMethods(),
          api.getDeliveryRates()
        ]);
        setPaymentMethods(methods);
        setDeliveryZones(zones);
        if (methods.length > 0) {
          const codEnabled = methods.find(m => m.id === 'cod' && m.enabled);
          const firstEnabled = methods.find(m => m.enabled);
          if (codEnabled) {
            setSelectedPaymentMethod('cod');
          } else if (firstEnabled) {
            setSelectedPaymentMethod(firstEnabled.id as any);
          }
        }
      } catch (err) {
        console.error('Failed to load checkout config', err);
      }
    }
    loadData();
  }, []);

  // Autofill if user has saved default address
  useEffect(() => {
    if (user?.savedAddresses && user.savedAddresses.length > 0) {
      const def = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
      if (def) {
        setProvince(def.province || 'Punjab');
        setCity(def.city || 'Lahore');
        setArea(def.area || '');
        setStreetAddress(def.streetAddress || '');
        setPostalCode(def.postalCode || '');
      }
    }
  }, [user]);

  // Determine delivery fee based on city
  const cityRule = deliveryZones.find(z => z.city.toLowerCase() === city.toLowerCase());
  const deliveryFee = (() => {
    const threshold = cityRule ? cityRule.freeDeliveryThreshold : 2999;
    if (subtotal >= threshold) return 0;
    return cityRule ? cityRule.standardFee : 200;
  })();

  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Handle local screenshot upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Card Number formatting (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Expiry formatting (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Detect card brand
  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(60|65|81)/.test(clean)) return 'PayPak';
    if (clean.startsWith('3')) return 'UnionPay';
    return 'Card';
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to proceed.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !streetAddress.trim() || !area.trim()) {
      setErrorMessage('Please fill in all required customer and address fields.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid Pakistani mobile number (e.g. 0300 1234567).');
      return;
    }

    // If Card payment, validate and open 3DS OTP modal
    if (selectedPaymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setErrorMessage('Please enter a valid 16-digit debit or credit card number.');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Please enter the name on your card.');
        return;
      }
      if (cardExpiry.length < 5) {
        setErrorMessage('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMessage('Please enter the 3-digit CVV code.');
        return;
      }
      setIs3DSecureModalOpen(true);
      return;
    }

    // If manual/online wallet/bank payment method selected, require TRX ID or Screenshot
    const currentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (
      selectedPaymentMethod !== 'cod' &&
      selectedPaymentMethod !== 'card' &&
      currentMethod?.requireProofScreenshot !== false &&
      !transactionId.trim() &&
      !screenshotDataUrl
    ) {
      setErrorMessage('Please provide either your Transaction ID (TRX/TID) or upload your payment receipt screenshot.');
      return;
    }

    submitFinalOrder();
  };

  const submitFinalOrder = async (cardDetails?: { last4: string; brand: string }) => {
    try {
      setIsSubmitting(true);

      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        shippingAddress: {
          province,
          city,
          area: area.trim(),
          streetAddress: streetAddress.trim(),
          postalCode: postalCode.trim(),
          instructions: instructions.trim()
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedAttributes: item.selectedAttributes
        })),
        couponCode: appliedCoupon?.code,
        paymentMethod: selectedPaymentMethod,
        paymentProof: selectedPaymentMethod === 'card' ? {
          transactionId: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
          cardLast4: cardDetails?.last4 || cardNumber.replace(/\s/g, '').slice(-4),
          cardBrand: cardDetails?.brand || detectCardBrand(cardNumber),
          verifiedAt: new Date().toISOString()
        } : (transactionId || screenshotDataUrl) ? {
          transactionId: transactionId.trim() || `TRX-${Date.now().toString().slice(-6)}`,
          screenshotUrl: screenshotDataUrl || undefined
        } : undefined
      };

      const placedOrder = await api.createOrder(orderPayload);
      clearCart();
      setIs3DSecureModalOpen(false);
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification OTP sent to your phone.');
      return;
    }

    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      const cleanCard = cardNumber.replace(/\s/g, '');
      submitFinalOrder({
        last4: cleanCard.slice(-4),
        brand: detectCardBrand(cleanCard)
      });
    }, 1200);
  };

  const activeMethodConfig = paymentMethods.find(m => m.id === selectedPaymentMethod);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToShopping}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-600 hover:text-cyan-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO CATALOG</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-cyan-800 font-mono font-semibold bg-cyan-50 px-3.5 py-1.5 rounded-lg border border-cyan-200">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>PAKISTAN VERIFIED CHECKOUT · 256-BIT SSL ENCRYPTION</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer Info, Shipping Address & Payment Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Contact & Customer Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold text-xs font-mono rounded">
                01
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Full Name <span className="text-cyan-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Usman Malik"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white transition text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Mobile Number (SMS & Call) <span className="text-cyan-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white transition font-mono text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Email Address (Digital Receipt & Updates)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white transition text-sm"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery Address in Pakistan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold text-xs font-mono rounded">
                02
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Pakistan Delivery Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Province <span className="text-cyan-600">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 cursor-pointer text-sm"
                >
                  {PAKISTAN_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  City <span className="text-cyan-600">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 cursor-pointer text-sm"
                >
                  {PAKISTAN_MAJOR_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other City">Other / Outskirts</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Town / Area / Sector <span className="text-cyan-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. DHA Phase 5 / Gulberg III"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 54000"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Complete Street Address & Flat/House # <span className="text-cyan-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House # 12-B, Street 4, Sector G, Near Masjid..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Call before arrival / Gate code"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold text-xs font-mono rounded">
                  03
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Order & Payment Method
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Online Payment or Cash on Delivery
              </span>
            </div>

            {/* Primary Order Mode Toggle: Cash on Delivery vs Online Payment */}
            {(() => {
              const codMethod = paymentMethods.find(m => m.id === 'cod' && m.enabled);
              const onlineMethods = paymentMethods.filter(m => m.enabled && m.id !== 'cod');
              const isOnlineSelected = selectedPaymentMethod !== 'cod';

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Cash on Delivery */}
                    {(!paymentMethods.length || codMethod) && (
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('cod')}
                        className={`p-4 rounded-xl border-2 text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                          !isOnlineSelected
                            ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Truck className={`w-4 h-4 ${!isOnlineSelected ? 'text-amber-600' : 'text-slate-500'}`} />
                            <span className="font-bold text-slate-900 text-sm">
                              Cash on Delivery
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Pay cash at your doorstep when your parcel arrives
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          !isOnlineSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                        }`}>
                          {!isOnlineSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    )}

                    {/* Option 2: Online Order / Online Payment */}
                    {(!paymentMethods.length || onlineMethods.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isOnlineSelected) {
                            const nextOnline = onlineMethods[0]?.id || 'easypaisa';
                            setSelectedPaymentMethod(nextOnline as any);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                          isOnlineSelected
                            ? 'border-cyan-600 bg-cyan-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className={`w-4 h-4 ${isOnlineSelected ? 'text-cyan-600' : 'text-slate-500'}`} />
                            <span className="font-bold text-slate-900 text-sm">
                              Online Payment
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            EasyPaisa, JazzCash, Bank Transfer or Debit/Credit Card
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isOnlineSelected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'
                        }`}>
                          {isOnlineSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Online Payment Channels Sub-Selector */}
                  {isOnlineSelected && onlineMethods.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                        Select Online Payment Channel
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {onlineMethods.map(method => {
                          const isSelected = selectedPaymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedPaymentMethod(method.id as any)}
                              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'border-cyan-600 bg-cyan-50/60 shadow-xs ring-1 ring-cyan-500'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  {method.id === 'easypaisa' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>}
                                  {method.id === 'jazzcash' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>}
                                  {method.id === 'bank_transfer' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>}
                                  {method.id === 'card' && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>}
                                  {!['easypaisa', 'jazzcash', 'bank_transfer', 'card'].includes(method.id) && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0"></span>
                                  )}
                                  <span className="font-bold text-slate-900 text-xs block">
                                    {method.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block pl-4">
                                  {method.id === 'card'
                                    ? 'Visa, Mastercard & PayPak (Instant)'
                                    : method.id === 'bank_transfer'
                                    ? 'IBAN / Raast Direct Bank Transfer'
                                    : 'Mobile Wallet / TRX Verification'}
                                </span>
                              </div>

                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* COD Explanatory Box */}
            {selectedPaymentMethod === 'cod' && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cash on Delivery (Doorstep Verification)</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  No advance payment needed. Inspect your tech accessories at your doorstep and pay exact PKR cash directly to the courier rider.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-amber-800 font-semibold pt-1">
                  <span>✓ 100% Genuine Tech Verified</span>
                  <span>✓ 7-Day Replacement Policy</span>
                  <span>✓ TCS & Leopards Express Logistics</span>
                </div>
              </div>
            )}

            {/* Card Payment Form */}
            {selectedPaymentMethod === 'card' && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-cyan-600" />
                    <span>Card Details (Visa / Mastercard / PayPak)</span>
                  </div>
                  <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    3D Secure 2.0
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium uppercase tracking-wider text-[11px]">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required={selectedPaymentMethod === 'card'}
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="e.g. MUHAMMAD USMAN"
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 uppercase outline-none focus:border-cyan-500 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 uppercase tracking-wider text-[11px] font-medium">Card Number *</label>
                      <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-bold">
                        {detectCardBrand(cardNumber)}
                      </span>
                    </div>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required={selectedPaymentMethod === 'card'}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4123 4567 8901 2345"
                        maxLength={19}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs tracking-wider outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[11px] font-medium">
                        Expiry (MM/YY) *
                      </label>
                      <input
                        type="text"
                        required={selectedPaymentMethod === 'card'}
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-center outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 uppercase tracking-wider text-[11px] font-medium">CVV / CVC *</label>
                        <span className="text-[10px] text-slate-400">3 Digits</span>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required={selectedPaymentMethod === 'card'}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="•••"
                          maxLength={3}
                          className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-center outline-none focus:border-cyan-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-cyan-50/50 rounded-lg border border-cyan-100 text-[11px] text-cyan-900 font-medium">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Protected by 3D Secure OTP verification. Supports all Pakistani bank accounts (HBL, Meezan, Alfalah, UBL, MCB).</span>
                  </div>
                </div>
              </div>
            )}

            {/* Easypaisa / JazzCash / Bank Transfer Instructions */}
            {activeMethodConfig && activeMethodConfig.id !== 'cod' && activeMethodConfig.id !== 'card' && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {activeMethodConfig.name} Transfer
                    </h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {activeMethodConfig.instructions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg shrink-0">
                    <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded flex items-center justify-center font-bold">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] leading-tight">
                      <span className="font-bold text-slate-500 block">Transfer Amount:</span>
                      <span className="text-cyan-700 font-bold">{formatPKR(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2.5">
                  {activeMethodConfig.accountTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Account Title:</span>
                      <strong className="text-slate-900 font-bold">{activeMethodConfig.accountTitle}</strong>
                    </div>
                  )}

                  {activeMethodConfig.accountNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Account / Mobile Number:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-cyan-700 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {activeMethodConfig.accountNumber}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeMethodConfig.accountNumber!, 'account')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                          title="Copy"
                        >
                          {copiedAccount === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeMethodConfig.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Bank / Channel:</span>
                      <strong className="text-slate-900">{activeMethodConfig.bankName}</strong>
                    </div>
                  )}

                  {activeMethodConfig.iban && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IBAN / Raast ID:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-cyan-700 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {activeMethodConfig.iban}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeMethodConfig.iban!, 'iban')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                          title="Copy IBAN"
                        >
                          {copiedAccount === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Proof & Transaction ID Inputs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider text-[11px] mb-1 font-medium">
                      Transaction ID (TRX / TID / Ref #) <span className="text-cyan-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      placeholder={selectedPaymentMethod === 'easypaisa' ? 'e.g. EP7891238912 (11 digits)' : 'e.g. TID891240129'}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono uppercase font-bold outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Device Screenshot File Upload */}
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider text-[11px] mb-1 font-medium">
                      Upload Payment Receipt Screenshot (Optional)
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {screenshotDataUrl ? (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-cyan-200 bg-cyan-50/60">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-cyan-600" />
                          <span className="text-cyan-800 font-semibold text-xs">Receipt Attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setScreenshotDataUrl('')}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-lg border border-dashed border-slate-300 hover:border-cyan-500 bg-white hover:bg-slate-50 transition flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-cyan-600" />
                        <span>Upload Screenshot from Phone or PC</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 sticky top-24 shadow-sm font-sans">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-cyan-700 font-mono text-xs font-semibold">[{items.length} ITEMS]</span>
            </h3>

            {/* Items list */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto space-y-3 pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-slate-500">
                      Qty: {item.quantity} · {formatPKR(item.product.salePrice)}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono shrink-0">
                    {formatPKR(item.product.salePrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-900 font-semibold">{formatPKR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- {formatPKR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Courier Logistics</span>
                <span className={deliveryFee === 0 ? 'text-emerald-700 font-bold' : 'text-slate-900 font-semibold'}>
                  {deliveryFee === 0 ? 'FREE' : formatPKR(deliveryFee)}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-base font-bold text-slate-900">
                <span className="uppercase text-xs tracking-wider">Grand Total</span>
                <span className="text-cyan-700 font-mono text-lg font-bold">
                  {formatPKR(grandTotal)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 cursor-pointer font-mono"
            >
              {isSubmitting ? (
                <span>PROCESSING SECURE ORDER...</span>
              ) : selectedPaymentMethod === 'card' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>PAY WITH CARD ({formatPKR(grandTotal)})</span>
                </>
              ) : selectedPaymentMethod === 'cod' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>CONFIRM COD ORDER ({formatPKR(grandTotal)})</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>SUBMIT ORDER ({formatPKR(grandTotal)})</span>
                </>
              )}
            </button>

            <div className="space-y-1 text-center text-[10px] text-slate-500">
              <p>🚚 Courier: TCS / Leopards Nationwide Logistics</p>
              <p>🛡️ 7-Day Replacement Guarantee & Doorstep Inspection</p>
            </div>
          </div>
        </div>
      </form>

      {/* 3D SECURE OTP MODAL SIMULATION FOR CARD PAYMENT */}
      {is3DSecureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  3D Secure 2.0 Verification
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIs3DSecureModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Confirming Payment of {formatPKR(grandTotal)}
              </h3>
              <p className="text-xs text-slate-600">
                A 6-digit One-Time Password (OTP) was dispatched to your mobile number ending in <strong className="text-cyan-700 font-mono">{customerPhone.slice(-4) || '9876'}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Merchant:</span>
                <strong className="text-slate-900">HS Solution PK</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Card:</span>
                <strong className="text-cyan-700">{detectCardBrand(cardNumber)} •••• {cardNumber.replace(/\s/g, '').slice(-4)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <strong className="text-cyan-700 font-bold">{formatPKR(grandTotal)}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left uppercase tracking-wider">
                  Enter 6-Digit SMS OTP Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="849201"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold py-3 px-4 rounded-xl border border-slate-300 bg-white text-cyan-700 outline-none focus:border-cyan-500"
                />
              </div>

              {otpError && (
                <p className="text-xs text-rose-600 font-semibold">{otpError}</p>
              )}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer font-mono"
              >
                {isVerifyingOtp ? 'AUTHORIZING WITH BANK...' : 'VERIFY OTP & COMPLETE ORDER'}
              </button>

              <button
                type="button"
                onClick={() => setOtpInput('849201')}
                className="text-[11px] text-cyan-600 hover:text-cyan-800 font-mono block mx-auto cursor-pointer font-medium"
              >
                Use Quick Demo OTP: 849201
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
