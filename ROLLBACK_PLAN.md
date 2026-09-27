# BILLWISE — Operational Rollback & Incident Response Plan

This document outlines standard operating procedures (SOP) for rapid, zero-downtime rollback in case of calculation errors, tariff disputes, client storage anomalies, or deployment issues during the Public Beta.

---

## 1. Incident Severity Matrix

| Severity Level | Impact Description | Target Response Time | Action Level |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Deterministic engine computes wrong bill amount on supported LT-1A bills; tariff rates invalid. | < 15 minutes | Instant Tariff Reversion / Git Revert |
| **SEV-2 (High)** | Client-side application fails to boot due to localStorage corruption; White screen on mobile. | < 1 hour | Schema migration patch / LocalStorage fallback |
| **SEV-3 (Medium)** | Camera OCR fails on specific Android/iOS browsers or lighting conditions. | < 4 hours | Verify manual input fallback visibility |
| **SEV-4 (Low)** | Typographical error in Malayalam localization or cosmetic styling bug. | Next release | Standard PR fix |

---

## 2. Failure Scenarios & Rollback Runbooks

### Runbook A: Tariff Revision Reversion (SEV-1)
*Trigger: KSERC stays a tariff hike, gazette rates are disputed, or a newly published tariff draft contains invalid slab parameters.*

1. **Option 1: Instant In-App Console Reversion (No code deploy required)**:
   - Navigate to `/admin`.
   - Unlock with authorized passkey (`kseb2026`).
   - In **Tariff Editor**, click on the previous stable tariff schedule (e.g. `KSERC 2023 LT-1A`).
   - Click **Set as Active**.
   - The engine immediately switches active billing to the previous verified schedule and writes an immutable audit record.

2. **Option 2: Codebase Rollback**:
   - In `src/lib/tariffs/ksebTariff2024.ts`, toggle `isCurrent`:
     ```ts
     export const CURRENT_KSEB_TARIFF_VERSION: TariffVersion = {
       ...
       isCurrent: false, // Set to false
     };
     export const PREVIOUS_KSEB_TARIFF_2023: TariffVersion = {
       ...
       isCurrent: true,  // Set to true
     };
     ```
   - Run verification gate:
     ```bash
     npm run release-check
     ```
   - Commit and push hotfix.

---

### Runbook B: Client Storage Schema Corruption (SEV-2)
*Trigger: Users report white screen or crash after visiting app due to corrupted or outdated localStorage JSON payload.*

1. **Automatic Self-Healing**:
   - `StorageManager` wraps all `localStorage.getItem()` calls inside defensive `try/catch` blocks that return safe defaults (`[]` for history, `{}` for budget).
   - If corrupted data is detected, the app continues functioning in-memory without crashing.

2. **User-Guided Manual Reset**:
   - If a specific user reports persistent storage issues:
     - Direct user to: `https://billwise.app/history` ➔ Click **Reset History / Clear Data**.
     - Or instruct user to clear site data for `billwise.app` in browser settings.

3. **Global Emergency Schema Migration**:
   - In `src/lib/storage/index.ts`, increment storage key namespace from `_v1` to `_v2`:
     ```ts
     const STORAGE_KEYS = {
       HISTORY: 'billwise_history_v2',
       FEEDBACK: 'billwise_feedback_v2',
       ...
     };
     ```
   - Deploy hotfix. All users instantly receive fresh, clean schemas without browser errors.

---

### Runbook C: OCR Scanner Degradation / Device Camera Incompatibility (SEV-3)
*Trigger: Modern browser permissions change, WebRTC video stream fails, or camera returns unreadable canvas.*

1. **Zero-Dead-End Guarantee**:
   - The bill scanner (`/scan`) and meter guide (`/meter-guide`) are strictly optional conveniences.
   - If scanning fails or confidence drops below 50%:
     - An automatic fallback notice appears: *"Camera reading unclear? Enter your reading manually."*
     - Direct button: `[ Calculate Manually ]` (`/manual`) or `[ I already know my units ]` (`/predict`).
2. **Feature Flag Kill Switch**:
   - To immediately disable camera features across the entire site without breaking layout:
     - Open `src/lib/config/flags.ts`.
     - Set:
       ```ts
       export const FEATURE_FLAGS = {
         enableMeterOcr: false,
         enableBillOcr: false,
         ...
       };
       ```
     - CTAs will automatically route directly to manual input flows.

---

### Runbook D: Production Hosting / Deployment Rollback (SEV-1 / SEV-2)
*Trigger: Production deployment bundle errors or Next.js edge runtime issues on CDN hosting platform.*

1. **Git Revert Procedure**:
   ```bash
   # Check last known good commit
   git log -n 5 --oneline

   # Revert to last stable release commit (e.g. tag v0.4.0)
   git revert HEAD --no-edit

   # Run automated release gate
   npm run release-check

   # Deploy reverted master branch
   git push origin master
   ```

2. **CDN / Vercel / Netlify Instant Rollback**:
   - Open hosting platform dashboard (e.g. Vercel / Cloudflare Pages / Netlify).
   - Go to **Deployments**.
   - Locate the previous successful production deployment.
   - Click **Instant Rollback / Promote to Production**.
   - DNS and edge cache switch to the previous immutable build in < 30 seconds.

---

## 3. Post-Rollback Health Check Checklist

After executing any rollback, verify the following endpoints:

- [ ] `GET /` — Loads cleanly, hero copy displays, no console errors.
- [ ] `GET /predict?units=240` — Verifies prediction calculation engine returns ₹1,148 for 240 units.
- [ ] `GET /manual` — Confirms manual slab breakdown renders accurately.
- [ ] `GET /tariff` — Verifies active tariff version banner and slabs match expected rates.
- [ ] `GET /manifest.json` — Ensures PWA manifest is served with valid JSON.
- [ ] Run `npm run release-check` locally to confirm all 64 automated tests pass.
