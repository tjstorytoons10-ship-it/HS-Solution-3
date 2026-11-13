import React, { useState, useEffect } from 'react';
import { useLogo } from '../../context/LogoContext';

interface BrandLogoProps {
  variant?: 'navbar' | 'footer' | 'admin' | 'invoice' | 'icon-only' | 'badge-large';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'navbar',
  className = '',
  size = 'md',
  theme = 'light'
}) => {
  const { logoUrl } = useLogo();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  // Sizing dimensions for the emblem icon
  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  // Primary Emblem: The actual HS Solution Logo image
  const LogoEmblem = () => (
    <div
      className={`relative ${iconSizeClasses} rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 shadow-md overflow-hidden bg-white border border-slate-200 ring-2 ring-cyan-500/20 shadow-sm ${
        variant === 'admin'
          ? 'ring-2 ring-amber-500/50'
          : ''
      }`}
    >
      {!imgError ? (
        <img
          src={logoUrl || '/logo.jpg'}
          alt="HS Solution Logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        /* High-tech vector fallback if image fails to load */
        <div className="w-full h-full bg-slate-950 flex items-center justify-center p-1.5">
          <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
            <circle cx="18" cy="18" r="16" stroke="#0891b2" strokeWidth="2" fill="#0f172a" />
            <path d="M11 13H23L13 23H25" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="27" cy="9" r="2" fill="#10b981" />
          </svg>
        </div>
      )}
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <LogoEmblem />
      </div>
    );
  }

  if (variant === 'badge-large') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-cyan-500/30 bg-white border border-slate-200">
          <img
            src={logoUrl || '/logo.jpg'}
            alt="HS Solution Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-['Outfit']">
            HS <span className="text-cyan-600">SOLUTION</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-mono mt-0.5">
            Official Tech Store • Pakistan Nationwide
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoEmblem />
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-sm tracking-tight text-slate-900 font-['Outfit']">
              HS SOLUTION
            </span>
            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              Admin
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-mono uppercase tracking-wider block mt-1">
            Control Console
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <LogoEmblem />
        <div>
          <div className="flex items-center gap-2 leading-none">
            <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit']">
              HS<span className="text-cyan-600"> SOLUTION</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono tracking-wider">
            <span className="text-slate-500 uppercase">Tech Store</span>
            <span className="w-1 h-1 rounded-full bg-cyan-500 inline-block" />
            <span className="text-emerald-600 font-semibold uppercase">Pakistan</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoEmblem />
        <div>
          <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit'] block leading-none">
            HS<span className="text-cyan-700"> SOLUTION</span>
          </span>
          <span className="text-[10px] tracking-wider text-slate-500 font-mono uppercase block mt-1">
            Official E-Commerce Store • Pakistan Nationwide Delivery
          </span>
        </div>
      </div>
    );
  }

  // Default 'navbar' variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoEmblem />
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-['Outfit']">
            HS<span className="text-cyan-600"> SOLUTION</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono tracking-wider">
          <span className="text-slate-500 uppercase">Tech Store</span>
          <span className="w-1 h-1 rounded-full bg-cyan-500 inline-block" />
          <span className="text-emerald-600 uppercase font-semibold">Pakistan</span>
        </div>
      </div>
    </div>
  );
};
