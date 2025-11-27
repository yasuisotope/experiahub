"use client";

import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;

export function initSentry(): void {
  if (typeof window === "undefined") return;
  if (sentryInitialized) return;
  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [Sentry.replayIntegration()],
    });

    sentryInitialized = true;
  } catch {
    // no-op: do not block app if Sentry fails
  }
}