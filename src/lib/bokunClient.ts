export type Slot = { startTimeId: number; time: string; capacity: number; durationMinutes: number };

export async function getSlots(params: {
  token: string;
  experienceId: number;
  date: string; // YYYY-MM-DD
}): Promise<{ success: boolean; status: number; slots?: Slot[]; error?: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_N8N_URL}/supplier/bokun/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({ experienceId: params.experienceId, date: params.date }),
    cache: 'no-store'
  });
  return res.json();
}

export async function startCheckout(params: {
  token: string;
  experienceId: number;
  date: string;           // YYYY-MM-DD
  startTimeId: number;
  pax: { adult: number } & Partial<Record<string, number>>;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<{ success: boolean; status: number; checkoutUrl?: string; error?: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_N8N_URL}/supplier/bokun/checkout/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({
      experienceId: params.experienceId,
      date: params.date,
      startTimeId: params.startTimeId,
      pax: params.pax,
      customer: params.customer
    }),
    cache: 'no-store'
  });
  return res.json();
}


