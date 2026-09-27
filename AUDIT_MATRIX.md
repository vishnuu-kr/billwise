# BILLWISE — Production Reality Audit Matrix (Phase 6)

Every major system has been audited against the actual codebase. Subsystems are classified using the required rating categories:

- **A: TRUE PRODUCTION** (Fully functional in real-world deployment without manual simulation)
- **B: LOCAL-ONLY** (Works on the client device; does not aggregate across users)
- **C: DEMO** (Simulated or mock behavior designed for demonstration)
- **D: HEURISTIC** (Algorithmic approximation / rule-based heuristics rather than machine learning)
- **E: STATIC** (Pre-compiled or hardcoded assets requiring code redeployment to modify)
- **F: REQUIRES EXTERNAL SERVICE** (Requires server-side infrastructure or external API)
- **G: UNSAFE / INCOMPLETE** (Exposed credentials, unauthenticated routes, or security risks)

---

## Subsystem Audit & Reality Matrix

| Subsystem | Previous Documentation Claim | Actual Code Reality | Phase 6 Rating | Action Required |
| :--- | :--- | :--- | :---: | :--- |
| **LT-1A Billing Engine** | "Deterministic KSERC billing engine" | Pure mathematical functions implementing official slabs, duty, subsidies, and fixed charges with ₹1,148 reference baseline. | **A: TRUE PRODUCTION** | Maintain regression immutability. |
| **Tariff Repository** | "Live versioned tariff database" | Static TypeScript objects in `ksebTariff2024.ts`. In-memory Map in browser tab. | **E: STATIC** | Build official-source ingestion pipeline and explicit `TariffStatus` model. |
| **Admin Console** | "Authenticated Admin Console" | Client-side React page with hardcoded passkey `kseb2026` in browser JS. Rate mutations exist only in that browser tab. | **G: UNSAFE / DEMO** | Remove fake client passkey; clarify role as Operator Diagnostics Console; protect server routes. |
| **Analytics Pipeline** | "Anonymous user funnel analytics" | Client-side event buffer stored in individual user's `localStorage` (`billwise_funnel_counts_v1`). No cross-user aggregation. | **B: LOCAL-ONLY** | Implement `/api/events` route handler for genuine anonymous, aggregatable server telemetry. |
| **User Feedback** | "In-app feedback loop" | Saved exclusively to local browser `localStorage` (`billwise_feedback_v1`). Maintainers never received feedback from external users. | **B: LOCAL-ONLY** | Implement `/api/feedback` server endpoint with rate limiting and PII redaction. |
| **Bill & Meter OCR** | "100% On-device OCR" | Rule-based regex pattern matching and HTML canvas pixel analysis. Assistive, not AI. | **D: HEURISTIC** | Remove any "AI" wording; enforce explicit confirmation before using detected meter numbers. |
| **Prediction Calibration** | "Self-calibrating prediction model" | Linear daily extrapolation (`units / daysElapsed * 60`). Historical error calculated locally. | **D: HEURISTIC** | Version the model as `v1-daily-run-rate`; version the calculation engine as `v1-kserc-deterministic`. |
| **Client Storage** | "Privacy-first local storage" | LocalStorage with defensive `try/catch` and `schemaVersion: 1`. Zero cloud user accounts. | **A: TRUE PRODUCTION** | Add migration tests and corruption boundary tests. |
| **PWA & Offline** | "Installable PWA" | Service worker caches static URLs under hardcoded `billwise-v1`. No cache invalidation on new release. | **B: LOCAL-ONLY (Partial)** | Tie to `SITE_CONFIG.cacheVersion`; auto-purge stale caches on worker activation. |
| **Domain Configuration** | "Production canonical domain" | `https://billwise.app` hardcoded in 8 files; `https://billwise.in` hardcoded in `robots.ts` and `sitemap.ts`. | **G: INCONSISTENT** | Centralize into `SITE_CONFIG.domain` in `src/lib/config/site.ts`. |
| **Security Headers** | "Production security" | `next.config.ts` was empty without security headers (no CSP, no HSTS, no X-Frame-Options). | **G: INCOMPLETE** | Add production security headers in `next.config.ts`. |

---

## Executive Conclusion
BILLWISE's domestic LT-1A calculation engine is genuinely launch-grade. However, the telemetry, feedback, and admin components were operating in **Local-Only / Demo mode**. Phase 6 upgrades these systems into a genuine, privacy-preserving production service.
