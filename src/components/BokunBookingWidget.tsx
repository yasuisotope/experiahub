'use client';

import React, { useEffect, useRef } from 'react';
import { track } from '@/services/analytics';
import { Box, CircularProgress, Typography } from '@mui/material';

interface BokunBookingWidgetProps {
  productId: string;
  width?: string;
  height?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  source?: 'panel' | 'list' | string;
}

export default function BokunBookingWidget({
  productId,
  width = '100%',
  height = '600px',
  onLoad,
  onError,
  source = 'panel'
}: BokunBookingWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      const errorMsg = 'Product ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      return;
    }

    // Construct Bokun booking URL
    const channelUuid = process.env.NEXT_PUBLIC_BOKUN_CHANNEL_UUID;
    const bookingUrl = channelUuid
      ? `https://widgets.bokun.io/online-sales/${channelUuid}/experience/${productId}`
      : `https://widgets.bokun.io/activity/${productId}`;
    
    const iframe = iframeRef.current;
    if (iframe) {
      track('widget_open', { productId, source });
      iframe.src = bookingUrl;
      
      const handleLoad = () => {
        setLoading(false);
        track('widget_loaded', { productId, source });
        onLoad?.();
      };

      const handleError = () => {
        const errorMsg = 'Failed to load booking widget';
        setError(errorMsg);
        track('widget_error', { productId, source, error: errorMsg });
        onError?.(errorMsg);
        setLoading(false);
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data: any = (event && (event as any).data) || {};
          if (data && (data as any).type === 'bokun.checkout_complete') {
            track('checkout_complete', { productId, source, bookingId: (data as any).bookingId });
          }
        } catch {}
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
      window.addEventListener('message', handleMessage as EventListener);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        window.removeEventListener('message', handleMessage as EventListener);
      };
    }
  }, [productId, onLoad, onError]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: 1,
        }}
      >
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            zIndex: 1,
          }}
        >
          <CircularProgress size={40} sx={{ color: 'rgba(74, 124, 140, 0.9)' }} />
        </Box>
      )}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
        title="Bokun Booking Widget"
        allow="payment"
      />
    </Box>
  );
} 