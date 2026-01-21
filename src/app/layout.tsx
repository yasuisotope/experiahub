'use client';

import React, { useState, useEffect } from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { WordPressProvider } from '@/contexts/WordPressContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import theme from '@/theme/theme';
import { initSentry } from '@/monitoring/sentry';

// Prevent hydration mismatch by using a client-only component
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try { initSentry(); } catch {}
  }, []);

  if (!hasMounted) {
    return null;
  }

  return children;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ExperiaHub</title>
        <meta name="description" content="ExperiaHub - Connecting Suppliers and Travelers" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://res.cloudinary.com/dasahamyc/image/upload/v1764230943/ExperiaHub_Logo_512x512_mlgydt.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/common@6.1.19/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.19/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.19/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/list@6.1.19/main.min.css" />
      </head>
      <body>
        <ClientOnly>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles styles={{
              '@font-face': {
                fontFamily: 'Agrandir',
                src: 'local("Agrandir"), local("Agrandir-Regular")',
                fontDisplay: 'swap',
              },
              'body': {
                backgroundColor: 'transparent', 
              },
              '.fc .fc-event': {
                borderRadius: 8,
                borderColor: 'rgba(74, 124, 140, 0.25)'
              },
              '.fc .fc-timegrid-event, .fc .fc-daygrid-event': {
                transition: 'background-color .15s ease, border-color .15s ease'
              },
              '.fc .fc-event:hover': {
                backgroundColor: 'rgba(240, 248, 250, 0.6) !important',
                borderColor: 'rgba(74, 124, 140, 0.35) !important'
              },
              '.fc .fc-event:focus-visible': {
                outline: '2px solid rgba(74,124,140,0.45)',
                outlineOffset: 2
              }
            }} />
            <WordPressProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </WordPressProvider>
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  );
}