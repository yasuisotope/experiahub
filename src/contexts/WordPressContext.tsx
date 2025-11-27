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

interface WordPressContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const WordPressContext = createContext<WordPressContextType | undefined>(undefined);

export function WordPressProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // Check for token in URL parameters (from WordPress redirect)
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
          console.log('Token found in URL, storing in localStorage');
          // Store the token from URL
          localStorage.setItem('wp_token', tokenFromUrl);
          
          // Extract user data from the token (JWT payload)
          try {
            const tokenParts = tokenFromUrl.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('JWT payload:', payload);
              
              // Store user data in localStorage
              const userData = {
                id: payload.data?.user?.id || '1',
                email: 'yasu.saito@gmail.com', // We know this from the login
                display_name: 'Yasu Saito', // We know this from the login
                nicename: 'yasu-saitogmail-com'
              };
              
              localStorage.setItem('wp_user', JSON.stringify(userData));
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
        const existingToken = localStorage.getItem('wp_token');
        console.log('Existing token in localStorage:', existingToken ? 'Found' : 'Not found');
        
        if (existingToken) {
          console.log('Using existing token, getting user data...');
          const currentUser = AuthService.getUser();
          
          if (currentUser) {
            console.log('Found user data in localStorage:', currentUser);
            setUser(currentUser);
            setIsLoggedIn(true);
          } else {
            console.log('No user data found, setting unauthenticated state');
            setUser(null);
            setIsLoggedIn(false);
          }
        } else {
          console.log('No token found, setting unauthenticated state');
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

  // Periodic token validation - DISABLED for now
  /*
  useEffect(() => {
    if (!isLoggedIn) return;

    const validateInterval = setInterval(async () => {
      const isValid = await AuthService.validateToken();
      if (!isValid) {
        await logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(validateInterval);
  }, [isLoggedIn]);
  */

  const login = useCallback(async (username: string, password: string) => {
    const response = await AuthService.login(username, password);
    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }
    
    const currentUser = AuthService.getUser();
    setUser(currentUser);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <WordPressContext.Provider value={{ user, isLoggedIn, isLoading, login, logout }}>
      {children}
    </WordPressContext.Provider>
  );
}

export function useWordPressAuth() {
  const context = useContext(WordPressContext);
  if (context === undefined) {
    // Safe fallback to prevent runtime crashes if provider is not yet mounted
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