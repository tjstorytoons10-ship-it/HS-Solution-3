import React, { useEffect, useState } from 'react';
import { X, Printer, Download, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { Order, StoreSettings } from '../../types';
import { formatPKR, formatDate, formatDateTime } from '../../lib/formatters';
import { api } from '../../lib/api';
import { BrandLogo } from '../common/BrandLogo';

interface InvoiceModalProps {
  orderId: string | null;
  settings?: StoreSettings | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  orderId,
  settings,
  onClose
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    async function load() {
      try {
        setLoading(true);
        const data = await api.getOrder(orderId!);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order invoice', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  if (!orderId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Top Controls Bar (Hidden during print) */}
        <div className="p-4 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Invoice / Receipt
            </span>
            <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              {orderId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-8 bg-white text-slate-900 print:p-0 print:m-0">
          {loading || !order ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading invoice data...</div>
          ) : (
            <>
              {/* 1. Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
                <div className="space-y-2">
                  <BrandLogo variant="invoice" />

                  <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                    <p>{settings?.storeAddress || 'Commercial Zone, Gulberg III, Lahore, Pakistan'}</p>
                    <p>NTN: 9812401-4 • Official E-Commerce Store</p>
                    <p>UAN Support: {settings?.contactNumber || '+92 300 1234567'}</p>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-block">
                    Official Order Invoice
                  </span>
                  <h3 className="text-xl font-black font-mono text-slate-900 mt-1">
                    {order.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date: <strong>{formatDateTime(order.createdAt)}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Payment Status:{' '}
                    <strong className={`uppercase ${order.paymentStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {order.paymentStatus}
                    </strong>
                  </p>
                </div>
              </div>

              {/* 2. Bill To & Shipping Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <h4 className="font-extrabold uppercase text-slate-400 text-[11px] mb-1.5 tracking-wider">
                    Customer / Billed To
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                  <p className="text-slate-600 mt-0.5">Mobile: {order.customerPhone}</p>
                  {order.customerEmail && <p className="text-slate-600">Email: {order.customerEmail}</p>}
                </div>

                <div>
                  <h4 className="font-extrabold uppercase text-slate-400 text-[11px] mb-1.5 tracking-wider">
                    Delivery Destination (Pakistan)
                  </h4>
                  <p className="font-bold text-slate-900">{order.shippingAddress.streetAddress}</p>
                  <p className="text-slate-700">{order.shippingAddress.area}</p>
                  <p className="text-slate-700 font-semibold">{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                  {order.shippingAddress.postalCode && (
                    <p className="text-slate-500">Postal Code: {order.shippingAddress.postalCode}</p>
                  )}
                </div>
              </div>

              {/* 3. Items Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono">SKU: {item.sku}</span>
                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                              <span>
                                ({Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-3 text-right font-medium text-slate-600">{formatPKR(item.price)}</td>
                        <td className="p-3 text-right font-black text-slate-900 font-['Outfit']">
                          {formatPKR(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Financial Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="text-xs space-y-1.5 max-w-sm text-slate-500">
                  <p className="font-bold text-slate-800 uppercase tracking-wider">Payment Method:</p>
                  <p className="font-mono font-semibold text-slate-900 uppercase">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                  </p>
                  {order.paymentProof?.transactionId && (
                    <p className="text-[11px]">
                      TRX ID: <strong className="text-slate-900 font-mono">{order.paymentProof.transactionId}</strong>
                    </p>
                  )}
                  <p className="pt-2 text-[11px] leading-relaxed italic">
                    Thank you for shopping at HS Solution Pakistan! Check your parcel upon courier delivery.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatPKR(order.subtotal)}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({order.couponCode || 'Promo'})</span>
                      <span>-{formatPKR(order.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className="font-bold text-slate-900">
                      {order.deliveryFee === 0 ? 'FREE' : formatPKR(order.deliveryFee)}
                    </span>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-emerald-700 font-['Outfit'] text-lg">
                      {formatPKR(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
