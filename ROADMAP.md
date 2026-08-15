# 🗺️ NavRoom Card – Roadmap & Feature Backlog

Denna fil dokumenterar planerade förbättringar, community-önskemål och framtida utvecklingsidéer för **NavRoom Card**.

---

## 📌 Kommande Funktioner & Förbättringar

### 1. 🎨 Smart White Fallback & Manuell Accentfärg *(Issue #1)*
* **Problem:** Vid ljust tema med vit bakgrund och lampor inställda på vitt ljus (`rgb(255, 255, 255)`), blir ikoner och strömknappar vita på vit botten och därmed osynliga.
* **Lösning:**
  - **Smart Contrast Safeguard:** Automatisk detektering om lampans färg är för nära vit/bakgrundsfärgen, vilket automatiskt aktiverar `accent_fallback` eller mörknar accentfärgen för läsbarhet.
  - **Manuell färg-override:** Ett val i editorn för att tvinga en fast anpassad färg istället för lampans dynamiska RGB om användaren föredrar det.
* **Prioritet:** Hög (Bugfix / Usability)
* **Status:** 📝 Specifierad & Redo för implementation

---

### 2. 📱 Platt / Kompakt Rad-Layout (*Compact / Slim Row Layout*)
* **Mål:** Erbjuda en horisontell radlayout (~55–65px hög) som alternativ till den vertikala standardboxen (130px), optimerad för mobila dashboards och vertikala rumslistor.
* **Design & Struktur:**
  - **Vänster:** Vänsterställd färgad accent-stripe (`border-left`), cirkulär rumsikon med överlappande status-badge (antal tända lampor/öppna dörrar).
  - **Mitten:** Rumsnamn i fetstil med en kompakt subrad för sensorer (`25.6 °C • 47 % • CO2`).
  - **Höger:** Strömknapp för belysning eller navigeringspil.
* **Konfiguration:** `layout: 'compact'` (eller `variant: 'compact'`) i kortinställningarna och visuell editor.
* **Prioritet:** Medel / Stor Feature
* **Status:** 💡 Idéstadiet & Designanalys klar

---

### 3. 🚪 Utökad sensor- och dörr/fönster-integration
* **Mål:** Möjlighet att visa öppna dörrar/fönster i rummet via en chip eller badge (t.ex. `1 öppen`).
* **Prioritet:** Låg / Framtida
* **Status:** 💡 Backlog

---

## 📋 Färdiga Milstolpar
- [x] **v2.3.0:** Flerspråksstöd för nordiska språk (Svenska, Danska, Norska, Finska, Isländska).
- [x] **v2.2.0:** Auto-discovery pre-fill i den visuella editorn.
- [x] **v2.0.0:** Områdesigenkänning, layoutvarianter (`badge`, `chip`, `pur`) och dynamisk RGB-färgtoning.
