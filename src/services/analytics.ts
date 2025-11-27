export type AnalyticsEventParams = Record<string, any>;

export function track(event: string, props?: Record<string, any>) {
  try {
    // existing analytics implementation
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event, ...props });
    }
  } catch {}
}

export function trackBackgroundChange(source: 'supplier' | 'chat', bg?: { id?: string; url?: string }) {
  track('bg_change', { source, id: bg?.id || null, hasAttribution: Boolean(bg?.id), url: bg?.url ? 'set' : 'unset' });
}

export function trackBackgroundRemove(source: 'supplier' | 'chat') {
  track('bg_remove', { source });
}
