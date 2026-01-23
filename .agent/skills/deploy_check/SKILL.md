---
name: deploy_check
description: Checklist for deployment (Vercel specific, asset checks, key checks).
---

# Deploy Check Skill

Before deploying or finalizing the code, run through this checklist to ensure stability on Vercel or other platforms.

## Checklist

### 1. Environment & Keys
- [ ] **API Keys**: Ensure NO API keys are hardcoded in the source code.
    - Usage: `useState` for keys input by user, or `process.env` (only if server-side, which this app is mostly client-side).
    - **Current App Strategy**: Keys are stored in `localStorage` and React State (`apiKey`). This is SAFE for static deployment.

### 2. Assets (Images/Icons)
- [ ] **Public Directory**: Ensure static assets (like `logo.png`) are in the `/public` folder.
- [ ] **Paths**:
    - **Correct**: `<img src="/logo.png" />` (starts with slash).
    - **Incorrect**: `<img src="./logo.png" />` or `<img src="public/logo.png" />`.
- [ ] **Case Sensitivity**: Vercel (Linux) is case-sensitive. `Logo.png` != `logo.png`. Verify filenames match exactly.

### 3. Routing & Mobile
- [ ] **Responsiveness**:
    - Check for `hidden sm:block` or similar classes that might hide critical UI elements on mobile.
    - Ensure buttons have touch-friendly sizes (min 44px height).
- [ ] **Empty States**: Ensure empty states (e.g., no image uploaded) don't break the layout.

### 4. Build Test
- [ ] Run `npm run build` locally before pushing.
- [ ] Check for TypeScript errors (`tsc` check).
