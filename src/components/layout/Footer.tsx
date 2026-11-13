import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones, MapPin, Phone, Mail, Zap, CheckCircle2 } from 'lucide-react';
import { StoreSettings } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface FooterProps {
  settings?: StoreSettings | null;
  onNavigateCategory: (slug: string) => void;
  onOpenTrackOrder: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigateCategory, onOpenTrackOrder }) => {
  return (
    <footer className="bg-white text-slate-600 pt-16 pb-8 border-t border-slate-200">
      {/* 1. Value Guarantee Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-xs sm:text-sm">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-500">Available across 200+ cities in Pakistan</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-xs sm:text-sm">7-Day Replacement</h4>
              <p className="text-[11px] text-slate-500">Direct check & exchange warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-xs sm:text-sm">100% Genuine Tech</h4>
              <p className="text-[11px] text-slate-500">Inspected & performance certified</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-xs sm:text-sm">24/7 WhatsApp Support</h4>
              <p className="text-[11px] text-slate-500">Technical guidance in Urdu & English</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <BrandLogo variant="footer" theme="light" />
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
            Pakistan’s premier destination for high-performance mobile tech, ANC earbuds, AMOLED smartwatches, and fast GaN charging solutions. Safe express delivery nationwide with Cash on Delivery.
          </p>

          <div className="pt-2 text-xs text-slate-600 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <span>{settings?.storeAddress || 'Plot 42-B, Commercial Avenue, Main Boulevard, Gulberg III, Lahore'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{settings?.contactNumber || '+92 300 1234567'} (Helpline)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{settings?.email || 'support@hssolution.pk'}</span>
            </div>
          </div>
        </div>

        {/* Quick Tech Categories */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
            Tech Categories
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
            <li>
              <button onClick={() => onNavigateCategory('airpods-earbuds')} className="hover:text-cyan-600 transition">
                AirPods & Audio
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateCategory('smart-watches')} className="hover:text-cyan-600 transition">
                Smart Watches & Bands
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateCategory('mobile-accessories')} className="hover:text-cyan-600 transition">
                GaN Fast Chargers & Cables
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateCategory('electronics')} className="hover:text-cyan-600 transition">
                Gaming & Desk Tech
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateCategory('normal-watches')} className="hover:text-cyan-600 transition">
                Classic Watches
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
            <li>
              <button onClick={onOpenTrackOrder} className="hover:text-cyan-700 transition text-cyan-600 font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Track Your Parcel</span>
              </button>
            </li>
            <li>
              <span className="hover:text-cyan-600 transition cursor-pointer">Shipping & Delivery Rates</span>
            </li>
            <li>
              <span className="hover:text-cyan-600 transition cursor-pointer">7-Day Replacement Policy</span>
            </li>
            <li>
              <span className="hover:text-cyan-600 transition cursor-pointer">Cash on Delivery Verification</span>
            </li>
            <li>
              <span className="hover:text-cyan-600 transition cursor-pointer">WhatsApp Quick Ordering</span>
            </li>
          </ul>
        </div>

        {/* Payment & Courier Partners */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
            Payment Methods
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>Cash on Delivery (COD)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>JazzCash & EasyPaisa</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>Raast Instant QR / IBAN</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Bank Wire Transfer</span>
            </div>
          </div>

          <div className="pt-3">
            <h5 className="text-[11px] font-mono uppercase text-slate-500 mb-1.5 font-bold">Courier Partners</h5>
            <div className="text-[11px] font-medium text-slate-600">
              TCS Pakistan · Call Courier · Leopards
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p className="font-mono">
          © {new Date().getFullYear()} HS Solution Pakistan. All rights reserved.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="text-emerald-700 font-semibold">● Official Pakistan Store</span>
          <span>·</span>
          <span>100% Genuine Guarantee</span>
        </div>
      </div>
    </footer>
  );
};
