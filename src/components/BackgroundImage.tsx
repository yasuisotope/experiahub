'use client';

import React from 'react';

type Attribution = {
  authorName?: string;
  authorUrl?: string;
};

interface BackgroundImageProps {
  imageUrl?: string;
  lqip?: string; // optional low-quality placeholder (e.g., blur hash rendered as data URL upstream)
  attribution?: Attribution;
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1, default 0.45; set to 0 to remove dark overlay
}

export default function BackgroundImage({ imageUrl, lqip, attribution, children, overlayOpacity = 0.45 }: BackgroundImageProps) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#f5f5f5',
          backgroundImage: imageUrl ? `url(${imageUrl})` : (lqip ? `url(${lqip})` : 'none'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity .25s ease',
          filter: 'saturate(0.9)',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      {/* dark overlay for readability */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: `linear-gradient(0deg, rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity}))`,
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      {/* content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
      {/* attribution intentionally hidden in UI per product direction */}
    </div>
  );
}


