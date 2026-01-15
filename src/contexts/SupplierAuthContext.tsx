'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthService } from '@/services/authService';

interface User {
  id: string;
  email: string;
  nicename?: string;
  display_name?: string;
}

interface SupplierAuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SupplierAuthContext = createContext<SupplierAuthContextType | undefined>(undefined);

export function SupplierAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing Supplier authentication...');
        
        // Check for token in URL parameters (from WordPress redirect)
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
          console.log('Token found in URL, storing in localStorage');
          // Store the token from URL
          localStorage.setItem('supplier_token', tokenFromUrl);
          
          // Extract user data from the token (JWT payload)
          try {
            const tokenParts = tokenFromUrl.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('JWT payload:', payload);
              
              // Store user data in localStorage
              const userData = {
                id: payload.data?.user?.id || '1',
                email: 'supplier@example.com', // Placeholder
                display_name: 'Supplier User', // Placeholder
                nicename: 'supplier-user'
              };
              
              localStorage.setItem('supplier_user', JSON.stringify(userData));
              console.log('Stored user data:', userData);
              
              // Set authentication state
              setUser(userData);
              setIsLoggedIn(true);
              
              // Clear the token from URL
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.toString());
              
              return; // Skip further validation
            }
          } catch (error) {
            console.error('Error parsing JWT token:', error);
          }
        }

        // Check for existing token in localStorage
        const existingToken = localStorage.getItem('supplier_token');
        
        if (existingToken) {
          // Manually get user from supplier_user key
          const userStr = localStorage.getItem('supplier_user');
          const currentUser = userStr ? JSON.parse(userStr) : null;
          
          if (currentUser) {
            setUser(currentUser);
            setIsLoggedIn(true);
          } else {
            setUser(null);
            setIsLoggedIn(false);
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [searchParams]);


  const login = useCallback(async (username: string, password: string) => {
    // PASS FALSE TO PERSIST: This prevents AuthService from overwriting 'wp_token'/'wp_user'
    const response = await AuthService.login(username, password, false);
    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }
    
    // Manual storage for Supplier Portal ONLY
    if (response.token) {
        localStorage.setItem('supplier_token', response.token);
        
        // Reconstruct user object
        let userData: any = null;
        if ((response as any).user_id) {
             userData = {
                id: (response as any).user_id,
                email: response.user_email || '',
                nicename: response.user_nicename,
                display_name: response.user_display_name
            };
        } else {
             // Fallback attempt to read from temp storage or similar if AuthService behaved differently
             // But since we passed persist=false, AuthService returned data but didn't store it. Perfect.
             // We rely on response fields.
        }

        // Use response data directly if available
        if (!userData) {
           userData = {
             id: '1', 
             email: username, // Fallback
             nicename: 'Supplier',
             display_name: 'Supplier'
           }
        }

        if (userData) {
            localStorage.setItem('supplier_user', JSON.stringify(userData));
        }
    }

    // Update State
    const userStr = localStorage.getItem('supplier_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    setUser(currentUser);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_user');
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <SupplierAuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout }}>
      {children}
    </SupplierAuthContext.Provider>
  );
}

export function useSupplierAuth() {
  const context = useContext(SupplierAuthContext);
  if (context === undefined) {
    return {
      user: null,
      isLoggedIn: false,
      isLoading: true,
      login: async () => { throw new Error('Auth not initialized'); },
      logout: async () => { /* no-op */ },
    } as const;
  }
  return context;
}
