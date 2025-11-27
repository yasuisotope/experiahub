import { NextRequest, NextResponse } from 'next/server';
import { bokunService } from '@/services/bokunService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await bokunService.getProduct(productId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: result.data });
  } catch (error) {
    console.error('Error fetching Bokun product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 