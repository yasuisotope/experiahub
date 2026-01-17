# Bokun Integration Strategy Documentation

## Overview
This document outlines the strategy for integrating Bokun (Travel Tech Provider) with the ExperiaHub Supplier Portal. The goal is to automatically synchronize bookings and products, ensuring that suppliers using Bokun have their data reflected in ExperiaHub without manual entry.

## Architecture
The integration relies on **N8N Workflows** acting as the middleware between Bokun API and ExperiaHub (Supabase).

```mermaid
graph LR
    Bokun[Bokun API] -- Webhook/Polling --> N8N[N8N Workflow]
    N8N -- Transform --> Proxy[ExperiaHub API Proxy (route.ts)]
    Proxy -- Insert/Update --> Supabase[(Supabase DB)]
```

## 1. Data Mapping

### Suppliers
We must link an ExperiaHub `auth.users` account (and `suppliers` entry) to a Bokun Vendor ID.
*   **New Column:** `bokun_vendor_id` (Text) in `public.suppliers` table.
*   **Action:** You must manually populate this ID for each supplier who uses Bokun.

### Experiences (Products)
*   **Existing Column:** `bokun_product_id` (Text) in `public.experiences`.
*   **Logic:** When syncing, N8N matches Bokun Product ID. If found, it updates availability/price. If not, it creates a new draft experience.

### Bookings
*   **New Column:** `bokun_booking_id` (Text) in `public.bookings`.
*   **Logic:**
    1.  Fetch "New Bookings" from Bokun since last sync.
    2.  Check if `bokun_booking_id` exists in `bookings` table.
    3.  If no, Insert. If yes, Update status (e.g. Confirmed -> Cancelled).

## 2. N8N Workflow Definition

### Workflow A: Product Sync (Daily)
1.  **Trigger:** Schedule (Every 24h).
2.  **Get Suppliers:** Query Supabase for suppliers with `bokun_vendor_id IS NOT NULL`.
3.  **Loop:** For each supplier:
    a.  **Fetch Products:** Call Bokun API `GET /product/search` with Vendor ID.
    b.  **Transform:** Map Bokun JSON to ExperiaHub `activities` schema.
    c.  **Push:** POST to `https://app.experiahub.com/api/n8n/supplier/activities/sync`.
        *   The backend (Build V100+) handles the UPSERT logic securely.

### Workflow B: Booking Sync (Hourly/Real-time)
1.  **Trigger:** Schedule (Every 1h) OR Bokun Webhook (if available on plan).
2.  **Get Suppliers:** Query Supabase for suppliers with `bokun_vendor_id`.
3.  **Loop:** For each supplier:
    a.  **Fetch Bookings:** Call `GET /booking/search` with `lastModifiedSince`.
    b.  **Transform:**
        *   `customerName`: `customer.firstName` + `customer.lastName`
        *   `pax`: `totalParticipants`
        *   `price`: `totalPrice`
        *   `status`: Map `CONFIRMED` -> `Confirmed`, `CANCELLED` -> `Cancelled`.
    c.  **Push:** POST to `https://app.experiahub.com/api/n8n/supplier/bookings/sync` (New Endpoint needed).

## 3. Implementation Steps (User)

1.  **Add `bokun_vendor_id` column** to `suppliers` table via Supabase SQL Editor:
    ```sql
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bokun_vendor_id text;
    ```
2.  **Build N8N Workflows** using the logic above.
3.  **Test** with one supplier.

## 4. Current Status (V100)
*   [x] **Backend Proxy:** `route.ts` V100 supports `supplier/activities/sync`.
*   [ ] **Booking Sync Endpoint:** Needs to be added to `route.ts`.
*   [ ] **Database Schema:** `bokun_vendor_id` column needs to be added.
*   [ ] **N8N:** Workflow needs to be created.
