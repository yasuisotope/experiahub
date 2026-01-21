'use client';

import * as React from 'react';
import { getSlots, startCheckout, Slot } from '@/lib/bokunClient';

type Props = {
  experienceId: number;
  getToken: () => Promise<string> | string; // WP JWT provider
  getDate: () => string;                    // YYYY-MM-DD provider
  defaultPax?: { adult: number; child?: number };
  customer?: { name?: string; email?: string; phone?: string };
  label?: string;
  onError?: (msg: string) => void;
};

export function BookingButton({
  experienceId,
  getToken,
  getDate,
  defaultPax = { adult: 1 },
  customer,
  label = 'Book now',
  onError
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [slotId, setSlotId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fail = (msg: string) => {
    setError(msg);
    onError?.(msg);
  };

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof getToken === 'function' ? await getToken() : getToken;
      const date = getDate();
      const { success, slots: s, error: e } = await getSlots({ token, experienceId, date });
      if (!success || !s?.length) return fail(e || 'No slots available');
      setSlots(s);
      setSlotId(s[0].startTimeId);
    } catch (e: any) {
      fail(e?.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!slotId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof getToken === 'function' ? await getToken() : getToken;
      const date = getDate();
      const res = await startCheckout({
        token,
        experienceId,
        date,
        startTimeId: slotId,
        pax: defaultPax,
        customer
      });
      if (!res.success) return fail(res.error || 'Checkout unavailable');
      
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        // Direct success (e.g. free or confirmed by backend)
        window.location.href = '/bookings?success=true';
      }
    } catch (e: any) {
      fail(e?.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {!slots ? (
        <button disabled={loading} onClick={handleClick}>
          {loading ? 'Loading…' : label}
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <select value={slotId ?? undefined} onChange={(e) => setSlotId(Number(e.target.value))}>
            {slots.map((s) => (
              <option key={s.startTimeId} value={s.startTimeId}>
                {s.time} · up to {s.capacity} pax · {s.durationMinutes} min
              </option>
            ))}
          </select>
          <button disabled={loading || !slotId} onClick={handleCheckout}>
            {loading ? 'Starting…' : 'Proceed to checkout'}
          </button>
          <button disabled={loading} onClick={() => setSlots(null)}>
            Back
          </button>
        </div>
      )}
      {error && <div style={{ color: '#b00020' }}>{error}</div>}
    </div>
  );
}


