import React, { useState } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { formatPKR, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';

interface OrderTrackingPageProps {
  onViewInvoice: (orderId: string) => void;
  onExploreProducts: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  onViewInvoice,
  onExploreProducts
}) => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState('');

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;

    setError('');
    setLoading(true);
    setOrder(null);

    try {
      const res = await api.trackOrder(orderIdInput.trim());
      setOrder(res);
    } catch (err: any) {
      setError(err.message || 'No order found with this tracking ID. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const idx = statuses.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header & Search */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-cyan-950/40 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>REAL-TIME COURIER TRACKING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
          Track Your Tech Accessories Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-mono">
          Enter your Order ID (e.g. ORD-100001) received on your order confirmation SMS.
        </p>

        {/* Tracking Input Box */}
        <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            required
            placeholder="e.g. ORD-100001"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
            className="flex-1 text-sm py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 font-mono font-bold text-cyan-300 uppercase outline-none focus:border-cyan-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition disabled:opacity-50 flex items-center gap-2 font-mono"
          >
            {loading ? (
              <span>Locating...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 font-semibold flex items-center gap-2 text-left font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Results */}
      {order && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-in fade-in">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                <span>ORDER ID:</span>
                <strong className="text-cyan-400 text-sm font-mono">{order.id}</strong>
              </div>
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                Status: <span className="text-cyan-400">{order.orderStatus}</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Booked on {formatDate(order.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewInvoice(order.id)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          {/* Courier Dispatch Card */}
          {order.tracking && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-cyan-400/80 font-bold block">Assigned Courier Partner</span>
                  <strong className="text-sm text-white">{order.tracking.courierName}</strong>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Waybill: <span className="text-cyan-300 font-bold">{order.tracking.trackingNumber}</span>
                  </div>
                </div>
              </div>

              {order.tracking.notes && (
                <div className="text-right text-slate-400 text-[11px] max-w-xs">
                  {order.tracking.notes}
                </div>
              )}
            </div>
          )}

          {/* Stepper Status Progress */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Shipment Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
              {statuses.map((st, i) => {
                const currentIdx = getStatusIndex(order.orderStatus);
                const isPassed = i <= currentIdx;
                const isCurrent = i === currentIdx;

                return (
                  <div key={st} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                          : isPassed
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isCurrent
                          ? 'text-cyan-300'
                          : isPassed
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-cyan-400 font-bold block mb-1">Destination Address:</span>
              <p className="text-slate-200 font-semibold">{order.customerName}</p>
              <p className="text-slate-400">{order.shippingAddress.streetAddress}, {order.shippingAddress.area}</p>
              <p className="text-slate-400">{order.shippingAddress.city}, {order.shippingAddress.province} ({order.shippingAddress.postalCode})</p>
              <p className="text-cyan-300 pt-1">Phone: {order.customerPhone}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-cyan-400 font-bold block mb-1">Payment Summary:</span>
              <div className="flex justify-between text-slate-400">
                <span>Method:</span>
                <span className="uppercase text-slate-200 font-bold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Status:</span>
                <span className="capitalize text-emerald-400 font-bold">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                <span>Total Amount:</span>
                <span className="text-cyan-300 text-sm">{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Items in Order */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
              Purchased Tech Accessories ({order.items.length})
            </h4>
            <div className="divide-y divide-slate-800">
              {order.items.map((it: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {it.image && (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-slate-950"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-200">{it.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        Qty: {it.quantity} × {formatPKR(it.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {formatPKR(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Demo helper */}
      {!order && (
        <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2 text-xs font-mono">
          <span className="text-slate-400">Try testing with demo order IDs:</span>
          <div className="flex justify-center gap-3 text-cyan-400 font-bold">
            <button
              onClick={() => setOrderIdInput('ORD-100001')}
              className="hover:underline bg-slate-950 px-2.5 py-1 rounded-sm border border-slate-800"
            >
              ORD-100001
            </button>
            <button
              onClick={() => setOrderIdInput('ORD-100002')}
              className="hover:underline bg-slate-950 px-2.5 py-1 rounded-sm border border-slate-800"
            >
              ORD-100002
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
