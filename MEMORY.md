# Project Memory Bank

## Project Overview
**ExperiaHub** is a Next.js application hosting a Supplier Portal and Chat features.
- **Live URL**: `https://app.experiahub.com`
- **Repository**: `https://github.com/yasuisotope/experiahub`
- **Active Codebase**: `/experiahub-new` (Local) -> `main` branch (Remote)

## Critical Architecture
- **Framework**: Next.js 14 (App Router)
- **Deployment**: Vercel
- **Styling**: Material UI (MUI)
- **Image Hosting**: Cloudinary (configured in `next.config.js`)
- **Backend/Automation**: n8n workflows (interacting via API)

## Key Configurations
### Images
- **Provider**: Cloudinary
- **Config**: `next.config.js` includes `images.remotePatterns` for `res.cloudinary.com`.
- **Logo URL**: `https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png`
- **Favicon URL**: `https://res.cloudinary.com/dasahamyc/image/upload/v1764230943/ExperiaHub_Logo_512x512_mlgydt.png`

### Git & Deployment
- **Gitignore**: Standard Next.js + `.yarn/cache` (to prevent large pushes).
- **Package Management**: `npm`. `package-lock.json` MUST be kept in sync with `package.json`.

## Recent History & Fixes
### 2025-11-27: Restoration & Fixes
1.  **Restored Correct Codebase**:
    - Identified `experiahub-new` as the correct source code (containing Supplier Portal).
    - Replaced the incorrect "Berry Template" deployment by force-pushing `experiahub-new` to `origin/main`.
2.  **Logo & Favicon Fixes**:
    - Updated `src/components/layout/MainLayout.tsx` (Main App) and `src/app/supplier/page.tsx` (Supplier Portal) to use the Cloudinary logo URL.
    - Updated `src/app/layout.tsx` to use the Cloudinary favicon.
3.  **Build Fixes**:
    - Resolved `npm ci` errors on Vercel by running `npm install` locally and committing the synced `package-lock.json`.
    - Fixed git push size issues by adding `.yarn/cache` to `.gitignore`.

## Active Workflows
- **Supplier Portal**: Located at `/supplier`.
- **Chat**: Located at `/chat`.

## Future Instructions
- **When updating dependencies**: Always run `npm install` and commit `package-lock.json`.
- **When changing images**: Use Cloudinary URLs where possible to avoid local asset path issues on Vercel.
- **When pushing code**: Ensure you are in `experiahub-new` and pushing to `yasuisotope/experiahub`.
