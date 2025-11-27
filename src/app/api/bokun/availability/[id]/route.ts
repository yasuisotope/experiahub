import { NextRequest, NextResponse } from 'next/server';
import { bokunService } from '@/services/bokunService';
import { octoService } from '@/services/octoService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Try OCTO first (if enabled)
    const octoRes = await octoService.getAvailability(productId, date, date);
    if (octoRes.success && octoRes.data) {
      return NextResponse.json({ availability: octoRes.data, source: 'octo' });
    }

    // Then Channel Manager shallow, deep, REST, then fallback
    let result = await bokunService.getAvailableShallow(productId, date);
    if (!result.success) {
      result = await bokunService.getAvailabilityDeep(productId, date);
    }
    if (!result.success) {
      result = await bokunService.checkAvailability(productId, date);
    }

    if (result.success) {
      return NextResponse.json({ availability: result.data });
    }

    // Graceful fallback: if REST availability is not enabled/returns 404, synthesize times from product
    const productRes = await bokunService.getProduct(productId);
    if (productRes.success && productRes.data) {
      const product: any = productRes.data as any;
      const startTimes: Array<{ hour: number; minute: number }> = Array.isArray(product.startTimes)
        ? product.startTimes.map((t: any) => ({ hour: Number(t?.hour || 0), minute: Number(t?.minute || 0) }))
        : [];
      const pad = (n: number) => String(n).padStart(2, '0');
      const times = startTimes.map((t) => ({ time: `${pad(t.hour)}:${pad(t.minute)}` }));
      return NextResponse.json({ availability: { date, times, fallback: true } });
    }

    return NextResponse.json(
      { error: result.error || 'Failed to check availability' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error checking Bokun availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 