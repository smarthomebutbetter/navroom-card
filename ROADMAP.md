# 🗺️ NavRoom Card – Roadmap & Feature Backlog

This document tracks planned features, community requests, and future architecture improvements for **NavRoom Card**.

---

## 📌 Upcoming Features & Enhancements

### 1. 🎨 Smart White Fallback & Manual Accent Color *(Issue #1)*
* **Problem:** On light themes with a white background and lights set to pure white (`rgb(255, 255, 255)`), icons, badge text, and power buttons become pure white on white background (invisible).
* **Proposed Solution:**
  - **Smart Contrast Safeguard:** Automatic luminance/contrast check that gracefully falls back to `accent_fallback` or adjusts brightness when computed RGB is near pure white (`R, G, B > 235`).
  - **Manual Accent Override:** An optional setting in the visual editor allowing users to lock a custom fixed color instead of dynamic light RGB tinting.
* **Priority:** High (Bugfix / Usability)
* **Status:** 📝 Specified & Ready for implementation

---

### 2. 📱 Compact / Slim Row Layout (`layout: 'compact'`)
* **Goal:** Provide an ultra-clean horizontal row layout (~55–65px height) as an alternative to the standard vertical grid card (130px), specifically optimized for mobile dashboards and dense room listings.
* **Design & Structure:**
  - **Left Section:** Colored accent indicator (`border-left` glow), circular room icon container with overlay status badge (lights on count or state).
  - **Middle Section:** Room name in bold typography with a compact horizontal subline for sensor values (`25.6 °C • 47 % • CO2`).
  - **Right Section:** Compact power button toggle or room navigation chevron.
* **Configuration:** Added as `layout: 'compact'` (or `variant: 'compact'`) in YAML and full visual UI editor support.
* **Priority:** Medium / Major Feature
* **Status:** 💡 Concept & Design Analysis Complete

---

### 3. 🔽 Built-in Collapsible Dropdown / Accordion (`collapsible: true`)
* **Goal:** Integrate collapsible sub-card grid (accordion) natively within the card, eliminating the need for wrapping in external custom cards like `expander-card`.
* **Design & Structure:**
  - **Animated Toggle:** Chevron icon on the header that rotates smoothly on state toggle.
  - **Custom Child Cards:** Support nesting arbitrary Lovelace cards via `cards: [...]` configuration using HA's native `loadCardHelpers()` and `createCardElement()`.
  - **Auto-Populated Grid:** Support an `auto_entities: true` mode which automatically finds all active devices/lights in the area and displays them in a 2-column grid layout of standard Tile cards.
* **Priority:** Medium
* **Status:** 📝 Research & Architecture Approved

---

### 4. 🚪 Extended Door, Window & Climate State Integration
* **Goal:** Support summary badges for open doors/windows within the area (e.g. `1 open`) or active HVAC states.
* **Priority:** Low / Backlog
* **Status:** 💡 Backlog

---

## 📋 Completed Milestones
- [x] **v2.3.0:** Native localization for Nordic languages (Swedish, Danish, Norwegian, Finnish, Icelandic) and enhanced locale normalization.
- [x] **v2.2.0:** Auto-discovery pre-fill in the visual editor.
- [x] **v2.0.0:** Area discovery, layout variants (`badge`, `chip`, `pur`), and dynamic RGB light color tinting.
