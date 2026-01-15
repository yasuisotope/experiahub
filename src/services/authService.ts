interface User {
  id: string;
  email: string;
  nicename?: string;
  display_name?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user_email?: string;
  user_nicename?: string;
  user_display_name?: string;
  error?: string;
  status?: number;
}

interface ValidateResponse {
  success: boolean;
  isValid: boolean;
  code?: string;
  error?: string;
  error_code?: string;
  status: number;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  user_id?: string;
  user_email?: string;
  user_nicename?: string;
  user_display_name?: string;
  error?: string;
  status?: number;
}

export class AuthService {
  private static readonly AUTH_BASE_URL = process.env.NEXT_PUBLIC_N8N_AUTH_URL || 'https://n8n.isotope-blue.com/webhook/auth';
  private static readonly TOKEN_KEY = 'wp_token';
  private static readonly USER_KEY = 'wp_user';

  static async login(username: string, password: string, persist: boolean = true): Promise<AuthResponse> {
    try {
      console.log('Attempting Direct WP Login...');
      // 1. Get Token
      const tokenResponse = await fetch('https://experiahub.com/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const text = await tokenResponse.text();
      let tokenData;
      try {
        tokenData = JSON.parse(text);
      } catch (e) {
        console.error('Login response parsing failed. Body:', text.substring(0, 200));
        return {
          success: false,
          error: 'Server returned invalid response. Please try again or contact support.',
          status: tokenResponse.status
        };
      }

      if (!tokenResponse.ok || !tokenData.token) {
        return {
          success: false,
          error: tokenData.message ? tokenData.message.replace(/<[^>]*>?/gm, '') : 'Invalid credentials',
          status: tokenResponse.status
        };
      }

      // 2. Get User Details
      const userResponse = await fetch('https://experiahub.com/wp-json/wp/v2/users/me?context=edit', {
        headers: { 
          'Authorization': `Bearer ${tokenData.token}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = await userResponse.json();

      if (persist) {
        localStorage.setItem(this.TOKEN_KEY, tokenData.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify({
          id: userData.id,
          email: tokenData.user_email || userData.email,
          nicename: tokenData.user_nicename || userData.slug,
          display_name: tokenData.user_display_name || userData.name
        }));
      }

      return {
        success: true,
        token: tokenData.token,
        user_email: tokenData.user_email,
        user_nicename: tokenData.user_nicename,
        user_display_name: tokenData.user_display_name,
        status: 200
      };

    } catch (error) {
      console.error('Login error:', error);
      // Fallback to N8N if direct fails (optional, but let's stick to direct for now)
      return {
        success: false,
        error: 'Connection to server failed',
        status: 500
      };
    }
  }

  static async register(username: string, email: string, password: string, applicationId?: string, persist: boolean = true): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${this.AUTH_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register',
          username, 
          email, 
          password,
          applicationId // Pass appId to link the account
        })
      });

      const data = await response.json();

      if (data.success && data.token && persist) {
        // Optionally store authentication data if registration returns a token
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify({
          id: data.user_id,
          email: data.user_email,
          nicename: data.user_nicename,
          display_name: data.user_display_name
        }));
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Failed to connect to authentication service',
        status: 500
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) return;

      const response = await fetch(`${this.AUTH_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'logout' })
      });

      const data = await response.json();
      if (data.success) {
        this.clearAuth();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  static async validateToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        console.log('No token found in localStorage');
        return false;
      }

      console.log('Validating token:', token.substring(0, 20) + '...');

      const response = await fetch(`${this.AUTH_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'validate' })
      });

      const data = await response.json();
      console.log('Token validation response:', data);

      // Handle the current n8n response structure
      if (data.success && data.user && data.user.assignments) {
        // Find the isValid assignment
        const isValidAssignment = data.user.assignments.find((assignment: any) => assignment.name === 'isValid');
        if (isValidAssignment) {
          const isValid = isValidAssignment.value === '=true' || isValidAssignment.value === true;
          console.log('Token validation result:', isValid);
          return isValid;
        }
      }

      // Fallback to the expected structure
      if (data.success && data.isValid) {
        console.log('Token validation result (fallback):', data.isValid);
        return data.isValid;
      }

      console.log('Token validation failed - invalid response structure');
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    return null;
  }

  static extractUserFromResponse(data: any): User | null {
    try {
      // Handle the current n8n response structure
      if (data.success && data.user && data.user.assignments) {
        const assignments = data.user.assignments;
        const userEmail = assignments.find((a: any) => a.name === 'user_email')?.value?.replace('=', '');
        const userNicename = assignments.find((a: any) => a.name === 'user_nicename')?.value?.replace('=', '');
        const userDisplayName = assignments.find((a: any) => a.name === 'user_display_name')?.value?.replace('=', '');
        
        if (userEmail) {
          return {
            id: '1', // Default ID
            email: userEmail,
            nicename: userNicename,
            display_name: userDisplayName
          };
        }
      }

      // Fallback to direct properties
      if (data.success && data.user_email) {
        return {
          id: data.user_id || '1',
          email: data.user_email,
          nicename: data.user_nicename,
          display_name: data.user_display_name
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting user data from response:', error);
      return null;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}