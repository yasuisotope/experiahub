export interface OctoAvailabilityResponse {
  // Keep generic to accommodate different tenant schemas; we pass-through safely
  [key: string]: any;
}

export interface OctoApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class OctoService {
  private baseUrl: string;
  private token: string;
  private vendorId: string;

  constructor() {
    this.baseUrl = process.env.OCTO_BASE_URL || 'https://api.bokun.io/octo/v1';
    this.token = process.env.OCTO_TOKEN || '';
    this.vendorId = process.env.OCTO_VENDOR_ID || '124994';
  }

  private getAuthHeader(): string | null {
    if (!this.token) return null;
    const suffix = this.vendorId ? `/${this.vendorId}` : '';
    return `Bearer ${this.token}${suffix}`;
  }

  async getAvailability(
    productId: string,
    startDate: string,
    endDate: string,
    adults: number = 2,
    children: number = 0
  ): Promise<OctoApiResult<OctoAvailabilityResponse>> {
    try {
      const auth = this.getAuthHeader();
      if (!auth) return { success: false, error: 'OCTO token not configured' };

      const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(productId)}/availability`);
      url.searchParams.set('start', startDate);
      url.searchParams.set('end', endDate || startDate);
      url.searchParams.set('pax.adults', String(adults));
      url.searchParams.set('pax.children', String(children));

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': auth
        }
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `OCTO error: ${res.status} ${res.statusText} - ${text}` };
      }
      const data = (await res.json()) as OctoAvailabilityResponse;
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e?.message || 'OCTO availability error' };
    }
  }
}

export const octoService = new OctoService();

