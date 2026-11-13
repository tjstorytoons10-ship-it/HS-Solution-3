import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const LEGACY_LOGO_STORAGE_KEY = 'storetech_custom_logo_v1';
const DEFAULT_LOGO = '/logo.jpg';

interface LogoContextType {
  logoUrl: string;
  updateLogo: (newLogoUrl: string) => Promise<void>;
  resetLogo: () => Promise<void>;
  syncServerLogo: (serverLogo?: string) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO);

  // Clean up any legacy client-side logo overrides so only admin server logo applies
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_LOGO_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const syncServerLogo = (serverLogo?: string) => {
    if (!serverLogo || serverLogo.includes('unsplash.com/photo-1472851294608')) {
      setLogoUrl(DEFAULT_LOGO);
      return;
    }
    setLogoUrl(serverLogo);
  };

  // Admin-only mutation: persists to backend /api/admin/settings (enforced by requireAdmin)
  const updateLogo = async (newLogoUrl: string) => {
    const cleanUrl = newLogoUrl.trim() || DEFAULT_LOGO;
    const updated = await api.updateSettings({ logo: cleanUrl });
    setLogoUrl(updated.logo || cleanUrl);
  };

  // Admin-only mutation: resets logo on backend
  const resetLogo = async () => {
    const updated = await api.updateSettings({ logo: DEFAULT_LOGO });
    setLogoUrl(updated.logo || DEFAULT_LOGO);
  };

  return (
    <LogoContext.Provider value={{ logoUrl, updateLogo, resetLogo, syncServerLogo }}>
      {children}
    </LogoContext.Provider>
  );
};

export function useLogo() {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
}
