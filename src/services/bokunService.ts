import CryptoJS from 'crypto-js';

interface BokunProduct {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  price?: {
    amount: number;
    currency: string;
  };
  duration?: number;
  location?: {
    city?: string;
    country?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  availability?: {
    available: boolean;
    nextAvailableDate?: string;
  };
  bookingUrl?: string;
}

interface BokunApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class BokunService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private channelUuid: string;
  private supplierApiUrl: string;

  constructor() {
    this.apiKey = process.env.BOKUN_API_KEY || '';
    this.apiSecret = process.env.BOKUN_API_SECRET || '';
    this.baseUrl = process.env.BOKUN_BASE_URL || 'https://api.bokun.io';
    this.channelUuid = process.env.BOKUN_CHANNEL_UUID || '';
    this.supplierApiUrl = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || '';
  }

  private createSignature(date: string, method: string, path: string): string {
    // Create signature string: date + accessKey + method + path
    const stringToSign = `${date}${this.apiKey}${method}${path}`;
    
    // Create HMAC-SHA1 signature using the secret key
    const signature = CryptoJS.HmacSHA1(stringToSign, this.apiSecret);
    
    // Base64 encode the signature
    return CryptoJS.enc.Base64.stringify(signature);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BokunApiResponse<T>> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Bokun API credentials not configured');
      }

      const url = `${this.baseUrl}${endpoint}`;
      const method = options.method || 'GET';
      const now = new Date();
      const date = now.getUTCFullYear() + '-' + 
                   String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getUTCDate()).padStart(2, '0') + ' ' +
                   String(now.getUTCHours()).padStart(2, '0') + ':' + 
                   String(now.getUTCMinutes()).padStart(2, '0') + ':' + 
                   String(now.getUTCSeconds()).padStart(2, '0');
      const signature = this.createSignature(date, method, endpoint);

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Bokun-Date': date,
        'X-Bokun-AccessKey': this.apiKey,
        'X-Bokun-Signature': signature,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        method,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bokun API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Bokun API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getProduct(productId: string): Promise<BokunApiResponse<BokunProduct>> {
    return this.makeRequest<BokunProduct>(`/activity.json/${productId}`);
  }

  async getProducts(limit: number = 50, offset: number = 0): Promise<BokunApiResponse<BokunProduct[]>> {
    return this.makeRequest<BokunProduct[]>(`/activity.json/search?limit=${limit}&offset=${offset}`);
  }

  async checkAvailability(productId: string, date: string): Promise<BokunApiResponse<any>> {
    if (!this.supplierApiUrl) {
      return { success: false, error: 'N8N supplier URL not configured' };
    }
    try {
      const res = await fetch(`${this.supplierApiUrl}/supplier/bokun/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ experienceId: Number(productId), date })
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `n8n availability error: ${res.status} ${res.statusText} - ${text}` };
      }
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async getBookingUrl(productId: string): Promise<BokunApiResponse<{ url: string }>> {
    // Bokun booking URLs are typically constructed as widgets
    const bookingUrl = `https://widgets.bokun.io/activity/${productId}`;
    return { success: true, data: { url: bookingUrl } };
  }

  // Channel Manager API – Shallow Availability
  async getAvailableShallow(productId: string, date: string): Promise<BokunApiResponse<any>> {
    if (!this.channelUuid) {
      return { success: false, error: 'Bokun channel UUID not configured' };
    }
    const endpoint = `/product/getAvailable`;
    const body: any = {
      organizationUuid: this.channelUuid,
      organization: this.channelUuid, // some accounts use this field name
      products: [{ productId: Number(productId) }],
      searchConditions: {
        dateFrom: date,
        dateTo: date,
        capacity: { adults: 2, children: 0 }
      },
      page: 0,
      pageSize: 20
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  // Channel Manager API – Deep Availability
  async getAvailabilityDeep(productId: string, date: string): Promise<BokunApiResponse<any>> {
    if (!this.channelUuid) {
      return { success: false, error: 'Bokun channel UUID not configured' };
    }
    const endpoint = `/product/getAvailability`;
    const body: any = {
      organizationUuid: this.channelUuid,
      organization: this.channelUuid,
      productId: Number(productId),
      searchConditions: {
        dateFrom: date,
        dateTo: date,
        capacity: { adults: 2, children: 0 }
      }
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });
  }
}

export const bokunService = new BokunService();
export type { BokunProduct, BokunApiResponse }; 