'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  company_name: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    company_name: string;
    full_name: string;
  }) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('exeloka_token');
    const storedUser = localStorage.getItem('exeloka_user');
    
    if (storedToken) {
      setToken(storedToken);
      api.setAuthToken(storedToken);
      
      // Check if it's our fake token for testing
      if (storedToken === 'fake-jwt-token-for-testing' && storedUser) {
        // Use stored fake user data
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setLoading(false);
          return;
        } catch (e) {
          // Invalid stored user data, fall through to API call
        }
      }
      
      // Verify token and get user data
      api.get('/auth/me')
        .then((response) => {
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            // Token is invalid
            localStorage.removeItem('exeloka_token');
            localStorage.removeItem('exeloka_refresh_token');
            localStorage.removeItem('exeloka_user');
            setToken(null);
            api.setAuthToken(null);
          }
        })
        .catch(() => {
          // Token verification failed
          localStorage.removeItem('exeloka_token');
          localStorage.removeItem('exeloka_refresh_token');
          localStorage.removeItem('exeloka_user');
          setToken(null);
          api.setAuthToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user, token: authToken, refreshToken } = response.data.data;
        
        setUser(user);
        setToken(authToken);
        api.setAuthToken(authToken);
        
        localStorage.setItem('exeloka_token', authToken);
        localStorage.setItem('exeloka_refresh_token', refreshToken);
        
        toast.success('Welcome back!');
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    company_name: string;
    full_name: string;
  }) => {
    try {
      const response = await api.post('/auth/register', data);

      if (response.data.success) {
        const { user, token: authToken, refreshToken } = response.data.data;
        
        setUser(user);
        setToken(authToken);
        api.setAuthToken(authToken);
        
        localStorage.setItem('exeloka_token', authToken);
        localStorage.setItem('exeloka_refresh_token', refreshToken);
        
        toast.success('Account created successfully!');
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    
    localStorage.removeItem('exeloka_token');
    localStorage.removeItem('exeloka_refresh_token');
    localStorage.removeItem('exeloka_user'); // Remove fake user data
    
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}