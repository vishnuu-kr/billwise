# BILLWISE — Brand Identity & Logo Guidelines

> Official Brand & Visual Identity Guide for BILLWISE (v0.6.0-rc.1)

---

## 1. The Brand Mark

* **Design Concept:** **Razor Split Shards (Dual-Shard Energy)**  
  A modern, developer-grade aesthetic (Supabase / Vercel style) featuring twin aerodynamic electric polygon shards sliced by a mathematically parallel 45° air gap (negative-space cleavage). It represents high-voltage power transmission, tiered utility rate thresholds, and razor-sharp predictive bill intelligence for Kerala electricity consumers.
* **Mark Archetype:** Aerodynamic Vector Polygons / Dual High-Voltage Shards
* **Key Components:**
  * **Upper Energy Shard (`#006FEE`):** Electric Cobalt polygon projecting forward and downward (`points="144,16 64,132 118,132 156,94 132,94"`).
  * **45° Negative-Space Cleavage:** Precision 16px parallel air gap providing visual tension, balance, and optical clarity down to 16px.
  * **Lower Energy Shard (`#17171C` / `#FFFFFF`):** Grounded anchor shard mirroring the vector thrust (`points="112,240 192,124 138,124 100,162 124,162"`).

---

## 2. Approved Color System

| Role | Color Name | HEX | RGB | Use Case |
|---|---|---|---|---|
| **Primary Accent** | Electric Cobalt | `#006FEE` | `rgb(0, 111, 238)` | Upper energy shard, active states, key CTAs, tariff alerts |
| **Grounded Ink** | Deep Ink | `#17171C` | `rgb(23, 23, 28)` | Lower shard on light surfaces, wordmark, primary typography |
| **Dark Container** | Slate Obsidian | `#0F172A` | `rgb(15, 23, 42)` | App icons, PWA splash containers, dark mode tiles |
| **Pure White** | Surface White | `#FFFFFF` | `rgb(255, 255, 255)` | Lower shard on dark containers, reversed wordmark, card surfaces |
| **Canvas** | Warm Neutral | `#F7F7F5` | `rgb(247, 247, 245)` | Default application canvas & background surface |

---

## 3. Clear Space & Minimum Sizes

### Clear Space
Maintain a clear exclusion zone around the mark equal to the width of the 45° cleavage gap (**$1 \times G$**, where $G \approx 16\text{ px}$ on the $256\text{ px}$ grid). No secondary copy, graphical borders, or container edges may intrude into this boundary.

### Minimum Sizes
| Format | Digital Screen | Print | Notes |
|---|---|---|---|
| **Symbol Only** | `16 × 16 px` | `5 mm` | Clean vector polygons ensure crisp rendering at micro-scales (`favicon.ico`, mobile nav) |
| **Horizontal Lockup** | `96 px width` | `24 mm width` | Symbol size $\ge 18\text{ px}$ with wordmark tracking `-0.03em` |
| **Stacked Lockup** | `80 px width` | `20 mm width` | For square social headers, splash screens, and vertical badges |

---

## 4. Master Asset Deliverables

Production assets are maintained in `D:\projects\logo setup\dist\modern_brand\` and synchronized directly into `D:\projects\billwise`:

* **In-App Component:**
  * `D:\projects\billwise\src\components\BrandLogo.tsx` — Vector `<BrandIcon />` and `<BrandLogo />` components with dynamic sizing and theme-aware colors (`var(--accent)` and `var(--foreground)`).
* **PWA & Web Icons:**
  * `public/icon-192.png` & `public/icon-512.png` — Dark slate obsidian squircle container (`#0F172A`) with Electric Cobalt and Pure White shards.
  * `public/icon-192.svg` & `public/icon-512.svg` — Scalable SVG app icon masters.
  * `public/favicon.ico` — Multi-resolution favicon (16px, 32px, 48px).
* **Master Vector Package (`dist/modern_brand/`):**
  * `billwise-symbol-color.svg` — Full brand color master (Cobalt + Ink).
  * `billwise-symbol-white.svg` — Pure white reversed version for dark themes.
  * `billwise-symbol-black.svg` — 1-color black master.
  * `billwise-symbol-mono.svg` — Single-tone Cobalt `#006FEE` mark.
  * `billwise-logo-horizontal.svg` — Horizontal lockup with outlined Inter Bold wordmark.
  * `billwise-logo-horizontal-white.svg` — White lockup for dark surfaces.
  * `billwise-app-icon-dark.svg` & `billwise-app-icon-light.svg` — Squircle app icon source SVGs.

---

## 5. Typography

* **Wordmark Geometry:** Outlined geometric sans derived from **Inter Bold** with tight optical tracking (`-0.03em`).
* **Web Font Stack:**
  * Primary: `Poppins`, `Inter`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `sans-serif`
  * Numerical & Meter Data: `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace

---

## 6. Brand Don'ts

1. **Do not distort:** Never stretch, squash, shear, or skew the mark.
2. **Do not rotate:** The shard cleavage is engineered on an exact 45° dynamic angle.
3. **Do not reintroduce blocky letterforms:** Bulky monograms and clumsy ribbon folds are deprecated in favor of razor-sharp aerodynamic polygons.
4. **Do not recolor outside the approved palette:** Do not use uncalibrated gradients or unapproved neon tones.
5. **Do not add decorative drop shadows or 3D extrusions:** Keep all vector silhouettes flat, crisp, and high-performance.
