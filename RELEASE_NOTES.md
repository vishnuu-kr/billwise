# BILLWISE — Release Notes (v0.5.0-beta)

**Release Date**: September 27, 2026  
**Stage**: Public Beta  
**Target Scope**: Kerala Domestic LT-1A Electricity Consumers (Single-Phase and Three-Phase, Bi-Monthly & Monthly Billing Cycles)

---

## 1. Overview & Purpose
BILLWISE is an electricity intelligence and bill prediction web application designed specifically for Kerala households. It bridges the gap between complex KSERC tariff rules and everyday consumers by answering one simple question: **"What will my next KSEB electricity bill probably look like, and how can I avoid expensive slab jumps before the meter reader arrives?"**

---

## 2. What's Included in v0.5.0-beta

### A. Deterministic Billing & Tariff Engine
- **KSERC 2024 Gazetted LT-1A Schedule**: Exact implementation of telescopic (up to 250 units/month or 500 units bi-monthly) and non-telescopic rates (>500 units bi-monthly).
- **Comprehensive Cost Breakdown**:
  - Telescopic energy charges by individual slab tier
  - Fixed charge brackets based on consumption tiers
  - Kerala Electricity Duty (10%)
  - Fuel Adjustment Charges (FAC / FPPCA)
  - Fixed charge subsidies (up to ₹40) and energy subsidies (up to ₹108 for eligible consumption)
  - Meter rent and statutory rounding
- **Immutable Reference Bill Regression**: Calibrated against official KSEB bills (240 units / ₹1,148 reference baseline).

### B. Bill & Meter Scanning (On-Device OCR)
- **Bill Scanner (`/scan`)**: Extracts previous reading, present reading, consumed units, billing dates, phase, connected load, and charges directly from photos of printed KSEB bills.
- **Meter Scanner (`/meter-guide`)**: Optical digit extraction for cumulative kWh displays from electronic static single-phase and three-phase domestic meters.
- **Consistency Guardrails**: Automatically verifies whether extracted units match `present - previous`; warns when OCR readings diverge.
- **Unsupported Bill Traps**: Automatically detects and halts on Commercial (LT-IV, LT-VII), High Tension (HT), Solar Net-metering, and Time-of-Day (ToD) smart meters, explaining why they are not supported.

### C. Predictive Pacing & Slab Alerting (`/predict`)
- **Dynamic Days-Elapsed Extrapolation**: Projects expected cycle consumption based on days between meter readings.
- **Slab Boundary Alerts**: Proactively warns households when their daily consumption pace will cause them to breach the next tariff threshold (e.g., 250 units or 300 units) and quantifies the extra rupee cost of crossing.
- **Controllable Impact Simulator**: Quantifies how reducing 0.5 units/day or running AC 1 hour less per day saves ₹X on the upcoming bill.

### D. What-If Simulator & Appliance Estimator
- **Bi-Directional Rupee & Unit Simulator (`/what-if`)**: Slide usage up or down to immediately observe marginal rupee impacts.
- **Kerala Appliance Energy Model (`/appliances`)**: Pre-configured wattages and duty cycles for typical Kerala domestic appliances (BLDC fans, inverter ACs, induction cooktops, mixies, water heaters, pumps).
- **Budget Controller (`/budget`)**: Set a target bill (e.g., ₹1,500) and receive a maximum allowable daily unit consumption budget.

### E. Privacy Architecture & Zero-PII Guarantee
- **100% Client-Side Processing**: Bill photos and meter readings are analyzed entirely inside the consumer's browser engine.
- **Zero Server Accounts**: No usernames, passwords, phone numbers, or cloud databases required.
- **PII Stripping Filter**: All telemetry and user feedback automatically redacts 13-digit consumer numbers, phone numbers, and email addresses.

### F. Bilingual Localization (English & Malayalam)
- **Instant Language Switching**: Toggle between Malayalam (`മലയാളം`) and English across all routes.
- **Manglish Natural Language Query**: Type conversational queries like *"AC kooduthal ittāl bill ethra varum?"* or *"240 unit bill ethra?"* for instant estimates.

### G. Public Beta In-App Feedback Loop & Analytics Funnel
- **Result Card Feedback**: 1-click rating (`👍 Helpful` / `👎 Inaccurate`) with optional categorizations (`Too high`, `Too low`, `Explanation unclear`, `Scanner error`).
- **History Calibration Rating**: Compare predicted bill vs actual KSEB bill upon receipt (`Close enough`, `Too high`, `Too low`).
- **Admin Console (`/admin`)**:
  - Live funnel conversion and drop-off analysis (Visits ➔ Input Flow ➔ Results ➔ Simulator ➔ History/Share)
  - Gazette tariff revision diffing (2023 previous vs 2024 active)
  - Cryptographically structured immutable audit trail

---

## 3. Supported vs. Unsupported Scenarios

| Category / Type | Status | User Guidance |
| :--- | :--- | :--- |
| **Domestic LT-1A (1-Phase)** | Fully Supported | Primary target; full telescopic and non-telescopic calculation |
| **Domestic LT-1A (3-Phase)** | Fully Supported | Supported with 3-phase fixed charge brackets and meter rent |
| **Commercial (LT-IV / LT-VII)** | Unsupported | Detected by OCR / manual selector; displays redirect to KSEB portal |
| **Solar Net-Metering (Prosumer)**| Unsupported | Net export credits and banked energy require specialized settlement |
| **Time-of-Day (ToD) Smart Meters**| Unsupported | Dynamic peak/off-peak/normal time tariffs are currently outside scope |
| **Industrial / HT Consumers** | Unsupported | Demand charges, kVAh billing, and power factor penalties excluded |

---

## 4. Verification & Testing Summary
- **64 Passing Unit Tests** across 7 test suites (regression, calculation, prediction, tariff validation, edge cases, Phase 3 UX, Phase 5 Beta).
- **Automated Release Gate (`npm run release-check`)**: Confirms runtime safety, test suite passage, production build compilation, and zero-PII leak safety.
- **26 Static Routes** verified under Next.js Turbopack production compiler.
