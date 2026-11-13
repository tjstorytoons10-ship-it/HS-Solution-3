import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, authStorage } from '../lib/api';

const OWNER_ADMIN_EMAIL = 'storetech@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  adminLogin: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      authStorage.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    authStorage.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    const res = await api.register(data);
    authStorage.setToken(res.token);
    setUser(res.user);
  };

  const adminLogin = async (credentials: { email: string; password: string }) => {
    const res = await api.adminLogin(credentials);
    authStorage.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    authStorage.removeToken();
    setUser(null);
  };

  const isAdmin =
    user?.role === 'admin' &&
    user?.email?.toLowerCase() === OWNER_ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        register,
        adminLogin,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
