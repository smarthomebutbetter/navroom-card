/**
 * NavRoom Card – Custom Lovelace Card (v1.6.0)
 * Room overview card with area icon, light-color accent, power button,
 * sortable sensor chips (temperature, humidity, CO2) and three layout variants.
 *
 * Variants: badge | chip | pur
 * Actions:  tap / hold / double_tap for the card, power_action for the button
 * i18n:     English + German (auto-detected from the HA user language)
 *
 * Note: `custom:raum-karte` is kept as a backward-compatible alias.
 *
 * https://github.com/smarthomebutbetter/navroom-card
 */

const RK_VERSION = '1.6.0';

const RK_DEFAULTS = {
  variant: 'badge',
  height: 130,
  radius: 32,
  padding: 15,
  head_height: 40,
  row_gap: 6,
  icon_size: 26,
  name_size: 17,
  name_weight: 700,
  chip_height: 24,
  chip_font: 11.5,
  chip_pad: 10,
  chip_gap: 6,
  pwr_size: 38,
  pwr_icon: 20,
  badge_size: 18,
  bg_tint: 0.10,
  accent_fallback: '255,183,77',
};

const RK_DESIGN_KEYS = [
  'height', 'radius', 'padding', 'head_height', 'row_gap', 'icon_size',
  'name_size', 'name_weight', 'chip_height', 'chip_font', 'chip_pad',
  'chip_gap', 'pwr_size', 'pwr_icon', 'badge_size', 'bg_tint',
  'accent_fallback', 'chip_order',
];

const RK_VARIANTS = ['badge', 'chip', 'pur'];
const RK_CHIP_ORDER_DEFAULT = ['temp', 'humidity', 'co2', 'light'];
const RK_HOLD_MS = 500;
const RK_DBL_MS = 250;
const RK_CO2_WARN = 1000;
const RK_CO2_ALERT = 1500;

/* ------------------------------ i18n ------------------------------ */

const RK_I18N = {
  en: {
    area: 'Area',
    light: 'Light (group or single light)',
    temp: 'Temperature sensor',
    humidity: 'Humidity sensor',
    co2: 'CO2 sensor',
    variant: 'Variant',
    variant_badge: 'Counter badge on power button',
    variant_chip: 'Lights chip in status row',
    variant_pur: 'Plain – no counter',
    tap_action: 'Card: tap',
    hold_action: 'Card: hold',
    double_tap_action: 'Card: double tap',
    power_action: 'Power button: tap',
    name: 'Override name',
    icon: 'Override icon',
    height: 'Card height',
    radius: 'Corner radius',
    icon_size: 'Icon size',
    name_size: 'Name size',
    chip_height: 'Chip height',
    chip_font: 'Chip font size',
    pwr_size: 'Power button size',
    badge_size: 'Badge size',
    bg_tint: 'Background tint (0–0.4)',
    accent_fallback: 'Fallback color (R,G,B)',
    section_interaction: 'Interactions',
    section_overrides: 'Overrides (optional)',
    section_design: 'Design',
    order_title: 'Chip order',
    order_hint: 'Sort with the arrows – chips without a configured sensor are simply skipped.',
    order_temp: 'Temperature',
    order_humidity: 'Humidity',
    order_co2: 'CO2',
    order_light: 'Lights chip',
    reset: 'Reset design',
    off: 'Off',
    one_light: '1 light',
    n_lights: '{n} lights',
    error_area: 'Please select an area or set a name.',
    card_description: 'Room overview with area icon, light-color accent, configurable power button, sortable sensor chips and three layout variants.',
  },
  de: {
    area: 'Bereich',
    light: 'Licht (Gruppe oder Einzellicht)',
    temp: 'Temperatursensor',
    humidity: 'Luftfeuchtigkeitssensor',
    co2: 'CO2-Sensor',
    variant: 'Variante',
    variant_badge: 'Zähler-Badge am Power-Button',
    variant_chip: 'Lichter-Chip in der Statuszeile',
    variant_pur: 'Pur – ohne Zähler',
    tap_action: 'Karte: Tippen',
    hold_action: 'Karte: Halten',
    double_tap_action: 'Karte: Doppeltippen',
    power_action: 'Power-Button: Tippen',
    name: 'Name überschreiben',
    icon: 'Icon überschreiben',
    height: 'Kartenhöhe',
    radius: 'Eckenradius',
    icon_size: 'Icongröße',
    name_size: 'Namensgröße',
    chip_height: 'Chip-Höhe',
    chip_font: 'Chip-Schrift',
    pwr_size: 'Power-Button',
    badge_size: 'Badge',
    bg_tint: 'Hintergrund-Einfärbung (0–0,4)',
    accent_fallback: 'Fallback-Farbe (R,G,B)',
    section_interaction: 'Interaktion',
    section_overrides: 'Überschreiben (optional)',
    section_design: 'Design',
    order_title: 'Chip-Reihenfolge',
    order_hint: 'Mit den Pfeilen sortieren – nicht konfigurierte Chips werden einfach übersprungen.',
    order_temp: 'Temperatur',
    order_humidity: 'Luftfeuchtigkeit',
    order_co2: 'CO2',
    order_light: 'Lichter-Chip',
    reset: 'Design zurücksetzen',
    off: 'Aus',
    one_light: '1 Licht',
    n_lights: '{n} Lichter',
    error_area: 'Bitte einen Bereich wählen oder einen Namen setzen.',
    card_description: 'Raumübersicht mit Area-Icon, Lichtfarben-Akzent, konfigurierbarem Power-Button, sortierbaren Sensor-Chips und drei Layout-Varianten.',
  },
};

function rkLang(hass) {
  const l = (hass && hass.locale && hass.locale.language) || (hass && hass.language) || 'en';
  return String(l).toLowerCase().startsWith('de') ? 'de' : 'en';
}

function rkT(hass, key) {
  const lang = rkLang(hass);
  return (RK_I18N[lang] && RK_I18N[lang][key]) || RK_I18N.en[key] || key;
}

/* ------------------------------ Card ------------------------------ */

class NavRoomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._built = false;
  }

  static getConfigElement() {
    return document.createElement('navroom-card-editor');
  }

  static getStubConfig(hass) {
    const firstArea = hass && hass.areas ? Object.keys(hass.areas)[0] : '';
    return { area: firstArea || '' };
  }

  setConfig(config) {
    if (!config || (!config.area && !config.name)) {
      throw new Error(RK_I18N.en.error_area + ' / ' + RK_I18N.de.error_area);
    }
    this._c = { ...RK_DEFAULTS, ...config };
    if (this._c.variant === 'zaehler') this._c.variant = 'badge';
    if (!RK_VARIANTS.includes(this._c.variant)) this._c.variant = 'badge';
    this._built = false;
    if (this._hass) this._build();
  }

  set hass(hass) {
    const old = this._hass;
    this._hass = hass;
    if (!this._c) return;
    if (!this._built) {
      this._build();
      return;
    }
    if (this._statesChanged(old, hass)) this._update();
  }

  getCardSize() { return 2; }
  getGridOptions() { return { columns: 6, rows: 2, min_columns: 4, min_rows: 2 }; }

  _watchedIds() {
    const c = this._c;
    const ids = [];
    if (c.light) {
      ids.push(c.light);
      const st = this._hass && this._hass.states[c.light];
      const members = st && st.attributes ? st.attributes.entity_id : null;
      if (Array.isArray(members)) ids.push(...members);
    }
    if (c.temp) ids.push(c.temp);
    if (c.humidity) ids.push(c.humidity);
    if (c.co2) ids.push(c.co2);
    return ids;
  }

  _statesChanged(a, b) {
    if (!a) return true;
    return this._watchedIds().some((id) => a.states[id] !== b.states[id]);
  }

  _build() {
    const c = this._c;
    const chipIcon = Math.round(c.chip_font + 3);
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          position: relative;
          height: ${c.height}px;
          padding: ${c.padding}px;
          border-radius: ${c.radius}px;
          border: none;
          box-shadow: none;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: ${c.head_height}px 1fr auto;
          row-gap: ${c.row_gap}px;
          cursor: pointer;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), background .3s ease;
          --rk-accent: ${c.accent_fallback};
          --rk-neutral: rgba(255,255,255,0.08);
        }
        ha-card:active { transform: scale(0.965); }
        ha-card.on {
          background:
            linear-gradient(0deg, rgba(var(--rk-accent), ${c.bg_tint}), rgba(var(--rk-accent), ${c.bg_tint})),
            var(--ha-card-background, var(--card-background-color));
        }
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        #ic {
          --mdc-icon-size: ${c.icon_size}px;
          color: var(--secondary-text-color);
          transition: color .3s ease;
        }
        ha-card.on #ic { color: rgb(var(--rk-accent)); }
        #pwr {
          position: relative;
          width: ${c.pwr_size}px;
          height: ${c.pwr_size}px;
          border-radius: 50%;
          border: none;
          padding: 0;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: var(--rk-neutral);
          transition: transform .15s ease, background .25s ease;
        }
        #pwr.show { display: flex; }
        #pwr:active { transform: scale(0.90); }
        #pwr ha-icon {
          --mdc-icon-size: ${c.pwr_icon}px;
          color: var(--secondary-text-color);
          transition: color .25s ease;
        }
        ha-card.on #pwr { background: rgba(var(--rk-accent), 0.20); }
        ha-card.on #pwr ha-icon { color: rgb(var(--rk-accent)); }
        #badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: ${c.badge_size}px;
          height: ${c.badge_size}px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgb(var(--rk-accent));
          color: #241a08;
          font: 800 ${Math.round(c.badge_size * 0.61)}px/1 Roboto, sans-serif;
          display: none;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }
        #badge.show { display: flex; }
        #name {
          align-self: end;
          font-size: ${c.name_size}px;
          font-weight: ${c.name_weight};
          color: var(--primary-text-color);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #chips {
          display: flex;
          align-items: center;
          gap: ${c.chip_gap}px;
          min-height: ${c.chip_height}px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          margin-right: -${c.padding}px;
          padding-right: ${c.padding}px;
        }
        #chips::-webkit-scrollbar { display: none; }
        .chip {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: ${c.chip_height}px;
          padding: 0 ${c.chip_pad}px;
          border-radius: 999px;
          font-size: ${c.chip_font}px;
          font-weight: 600;
          line-height: 1;
          color: var(--secondary-text-color);
          background: var(--rk-neutral);
          transition: all .25s ease;
          white-space: nowrap;
        }
        .chip ha-icon {
          --mdc-icon-size: ${chipIcon}px;
          margin-left: -2px;
        }
        .chip.hot {
          color: rgb(var(--rk-accent));
          background: rgba(var(--rk-accent), 0.16);
        }
        .chip.warn {
          color: #ffb74d;
          background: rgba(255, 183, 77, 0.16);
        }
        .chip.alert {
          color: #ff7043;
          background: rgba(255, 112, 67, 0.18);
        }
        @media (prefers-reduced-motion: reduce) {
          ha-card, #pwr, #ic, .chip { transition: none; }
        }
      </style>
      <ha-card>
        <div class="head">
          <ha-icon id="ic"></ha-icon>
          <button id="pwr" aria-label="Toggle light">
            <ha-icon icon="mdi:power"></ha-icon>
            <span id="badge"></span>
          </button>
        </div>
        <div id="name"></div>
        <div id="chips"></div>
      </ha-card>
    `;

    this._el = {
      card: this.shadowRoot.querySelector('ha-card'),
      ic: this.shadowRoot.getElementById('ic'),
      pwr: this.shadowRoot.getElementById('pwr'),
      badge: this.shadowRoot.getElementById('badge'),
      name: this.shadowRoot.getElementById('name'),
      chips: this.shadowRoot.getElementById('chips'),
    };

    this._bindActions(this._el.card);
    this._el.chips.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    this._el.chips.addEventListener('pointerup', (ev) => ev.stopPropagation());
    this._el.pwr.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    this._el.pwr.addEventListener('pointerup', (ev) => ev.stopPropagation());
    this._el.pwr.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this._handlePower();
    });

    this._built = true;
    this._update();
  }

  /* Standard HA actions for the card: tap / hold / double_tap */
  _bindActions(el) {
    let holdTimer = null;
    let held = false;
    let lastTap = 0;

    el.addEventListener('pointerdown', () => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        held = true;
        this._handleAction('hold');
      }, RK_HOLD_MS);
    });
    const cancel = () => clearTimeout(holdTimer);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('pointercancel', cancel);

    el.addEventListener('pointerup', () => {
      clearTimeout(holdTimer);
      if (held) return;
      const dbl = this._c.double_tap_action;
      const hasDbl = dbl && dbl.action && dbl.action !== 'none';
      if (!hasDbl) {
        this._handleAction('tap');
        return;
      }
      const now = Date.now();
      if (now - lastTap < RK_DBL_MS) {
        lastTap = 0;
        this._handleAction('double_tap');
      } else {
        lastTap = now;
        setTimeout(() => {
          if (lastTap && Date.now() - lastTap >= RK_DBL_MS) {
            lastTap = 0;
            this._handleAction('tap');
          }
        }, RK_DBL_MS + 10);
      }
    });
  }

  _fireHassAction(actionConfig) {
    this.dispatchEvent(new CustomEvent('hass-action', {
      detail: {
        config: { entity: this._c.light, tap_action: actionConfig },
        action: 'tap',
      },
      bubbles: true,
      composed: true,
    }));
  }

  _handleAction(action) {
    const cfg = this._c[action + '_action'];
    if (cfg && cfg.action) {
      if (cfg.action === 'none') return;
      this._fireHassAction(cfg);
      return;
    }
    if (action === 'tap') this._navigate();
  }

  /* Power button: own configurable action, defaults to toggling the light */
  _handlePower() {
    const cfg = this._c.power_action;
    if (cfg && cfg.action) {
      if (cfg.action === 'none') return;
      this._fireHassAction(cfg);
      return;
    }
    if (this._c.light && this._hass) {
      this._hass.callService('light', 'toggle', { entity_id: this._c.light });
    }
  }

  _chipOrder() {
    const raw = Array.isArray(this._c.chip_order) ? this._c.chip_order : [];
    const clean = raw.filter((k) => RK_CHIP_ORDER_DEFAULT.includes(k));
    RK_CHIP_ORDER_DEFAULT.forEach((k) => {
      if (!clean.includes(k)) clean.push(k);
    });
    return clean;
  }

  _update() {
    const c = this._c;
    const hass = this._hass;
    const el = this._el;
    if (!hass || !el) return;

    // Theme-independent neutral tones (dark/light)
    const dark = !!(hass.themes && hass.themes.darkMode);
    el.card.style.setProperty('--rk-neutral', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');

    // Name & icon from the area registry (with overrides)
    const area = c.area && hass.areas ? hass.areas[c.area] : null;
    el.name.textContent = c.name || (area && area.name) || c.area || '';
    el.ic.setAttribute('icon', c.icon || (area && area.icon) || 'mdi:home-outline');

    // Light state & accent color (average of RGB colors of lights that are on)
    const light = c.light ? hass.states[c.light] : null;
    const on = !!(light && light.state === 'on');
    let count = 0;
    const cols = [];
    if (light) {
      const members = light.attributes ? light.attributes.entity_id : null;
      if (Array.isArray(members) && members.length) {
        members.forEach((id) => {
          const s = hass.states[id];
          if (s && s.state === 'on') {
            count += 1;
            if (s.attributes && Array.isArray(s.attributes.rgb_color)) {
              cols.push(s.attributes.rgb_color);
            }
          }
        });
      } else if (on) {
        count = 1;
        if (light.attributes && Array.isArray(light.attributes.rgb_color)) {
          cols.push(light.attributes.rgb_color);
        }
      }
    }
    let accent = c.accent_fallback;
    if (cols.length) {
      accent = [0, 1, 2]
        .map((i) => Math.round(cols.reduce((a, x) => a + x[i], 0) / cols.length))
        .join(',');
    }
    el.card.style.setProperty('--rk-accent', accent);
    el.card.classList.toggle('on', on);

    // Power button & badge (badge only in "badge" variant)
    el.pwr.classList.toggle('show', !!c.light);
    el.badge.textContent = String(count);
    el.badge.classList.toggle('show', c.variant === 'badge' && count > 0);

    // Chips: build and sort by configured order
    const defs = {};
    if (c.temp) {
      defs.temp = { icon: 'mdi:thermometer', t: this._fmt(hass.states[c.temp], 1, '°'), cls: '' };
    }
    if (c.humidity) {
      defs.humidity = { icon: 'mdi:water-percent', t: this._fmt(hass.states[c.humidity], 0, '%'), cls: '' };
    }
    if (c.co2) {
      const v = hass.states[c.co2] ? parseFloat(hass.states[c.co2].state) : NaN;
      let cls = '';
      if (!isNaN(v) && v >= RK_CO2_ALERT) cls = 'alert';
      else if (!isNaN(v) && v >= RK_CO2_WARN) cls = 'warn';
      defs.co2 = { icon: 'mdi:molecule-co2', t: this._fmt(hass.states[c.co2], 0, ' ppm'), cls };
    }
    if (c.variant === 'chip' && c.light) {
      let t;
      if (count === 0) t = rkT(hass, 'off');
      else if (count === 1) t = rkT(hass, 'one_light');
      else t = rkT(hass, 'n_lights').replace('{n}', count);
      defs.light = { icon: 'mdi:lightbulb-outline', t, cls: count > 0 ? 'hot' : '' };
    }
    const chips = this._chipOrder().map((k) => defs[k]).filter(Boolean);

    el.chips.innerHTML = chips
      .map((x) => `<span class="chip${x.cls ? ' ' + x.cls : ''}"><ha-icon icon="${x.icon}"></ha-icon>${x.t}</span>`)
      .join('');
  }

  _fmt(state, decimals, unit) {
    const v = state ? parseFloat(state.state) : NaN;
    if (isNaN(v)) return '–';
    const sep = rkLang(this._hass) === 'de' ? ',' : '.';
    const s = decimals > 0
      ? v.toFixed(decimals).replace('.', sep)
      : String(Math.round(v));
    return s + unit;
  }

  _navigate() {
    const c = this._c;
    if (c.nav_path) {
      let path = c.nav_path;
      if (!path.startsWith('/')) {
        const parts = window.location.pathname.split('/');
        path = '/' + (parts[1] || 'lovelace') + '/' + path;
      }
      history.pushState(null, '', path);
      window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
    } else if (c.light) {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: c.light },
        bubbles: true,
        composed: true,
      }));
    }
  }
}

/* Backward-compatible alias for existing `custom:raum-karte` configs */
class RaumKarteAlias extends NavRoomCard {}

/* ------------------------------ Editor ------------------------------ */

function rkBuildSchema(hass) {
  return [
    { name: 'area', selector: { area: {} } },
    {
      type: 'grid',
      schema: [
        { name: 'light', selector: { entity: { domain: 'light' } } },
        { name: 'temp', selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
        { name: 'humidity', selector: { entity: { domain: 'sensor', device_class: 'humidity' } } },
        { name: 'co2', selector: { entity: { domain: 'sensor', device_class: 'carbon_dioxide' } } },
        {
          name: 'variant',
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                { value: 'badge', label: rkT(hass, 'variant_badge') },
                { value: 'chip', label: rkT(hass, 'variant_chip') },
                { value: 'pur', label: rkT(hass, 'variant_pur') },
              ],
            },
          },
        },
      ],
    },
    {
      type: 'expandable',
      title: rkT(hass, 'section_interaction'),
      schema: [
        { name: 'tap_action', selector: { ui_action: {} } },
        { name: 'hold_action', selector: { ui_action: {} } },
        { name: 'double_tap_action', selector: { ui_action: {} } },
        { name: 'power_action', selector: { ui_action: {} } },
      ],
    },
    {
      type: 'expandable',
      title: rkT(hass, 'section_overrides'),
      schema: [
        {
          type: 'grid',
          schema: [
            { name: 'name', selector: { text: {} } },
            { name: 'icon', selector: { icon: {} } },
          ],
        },
      ],
    },
    {
      type: 'expandable',
      title: rkT(hass, 'section_design'),
      schema: [
        {
          type: 'grid',
          schema: [
            { name: 'height', selector: { number: { min: 90, max: 220, step: 2, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'radius', selector: { number: { min: 0, max: 40, step: 1, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'icon_size', selector: { number: { min: 16, max: 40, step: 1, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'name_size', selector: { number: { min: 12, max: 26, step: 0.5, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'chip_height', selector: { number: { min: 18, max: 32, step: 1, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'chip_font', selector: { number: { min: 9, max: 15, step: 0.5, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'pwr_size', selector: { number: { min: 28, max: 52, step: 1, mode: 'slider', unit_of_measurement: 'px' } } },
            { name: 'badge_size', selector: { number: { min: 12, max: 26, step: 1, mode: 'slider', unit_of_measurement: 'px' } } },
          ],
        },
        { name: 'bg_tint', selector: { number: { min: 0, max: 0.4, step: 0.01, mode: 'slider' } } },
        { name: 'accent_fallback', selector: { text: {} } },
      ],
    },
  ];
}

const RK_ORDER_META = {
  temp: { labelKey: 'order_temp', icon: 'mdi:thermometer' },
  humidity: { labelKey: 'order_humidity', icon: 'mdi:water-percent' },
  co2: { labelKey: 'order_co2', icon: 'mdi:molecule-co2' },
  light: { labelKey: 'order_light', icon: 'mdi:lightbulb-outline' },
};

class NavRoomCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._render();
  }

  _currentOrder() {
    const raw = Array.isArray(this._config.chip_order) ? this._config.chip_order : [];
    const clean = raw.filter((k) => RK_CHIP_ORDER_DEFAULT.includes(k));
    RK_CHIP_ORDER_DEFAULT.forEach((k) => {
      if (!clean.includes(k)) clean.push(k);
    });
    return clean;
  }

  _fireConfig(config) {
    config.type = 'custom:navroom-card';
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _render() {
    if (!this._form) {
      const style = document.createElement('style');
      style.textContent = `
        .rk-order { margin-top: 20px; }
        .rk-order-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
          margin-bottom: 8px;
        }
        .rk-order-hint {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 10px;
        }
        .rk-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          margin-bottom: 6px;
          background: var(--card-background-color);
        }
        .rk-row ha-icon:first-child {
          --mdc-icon-size: 18px;
          color: var(--secondary-text-color);
        }
        .rk-row span {
          flex: 1;
          font-size: 14px;
          color: var(--primary-text-color);
        }
        .rk-row button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--secondary-text-color);
          border-radius: 6px;
          display: flex;
        }
        .rk-row button:hover:not(:disabled) {
          background: rgba(var(--rgb-primary-color, 100,100,255), 0.1);
          color: var(--primary-color);
        }
        .rk-row button:disabled { opacity: 0.25; cursor: default; }
        .rk-row button ha-icon { --mdc-icon-size: 20px; }
        .rk-reset {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
        }
        .rk-reset button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--divider-color);
          border-radius: 999px;
          background: none;
          color: var(--secondary-text-color);
          font: 500 13px Roboto, sans-serif;
          cursor: pointer;
          transition: all .15s ease;
        }
        .rk-reset button:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .rk-reset button ha-icon { --mdc-icon-size: 16px; }
      `;
      this.appendChild(style);

      this._form = document.createElement('ha-form');
      this._form.computeLabel = (s) => rkT(this._hass, s.name);
      this._form.addEventListener('value-changed', (ev) => {
        const config = { ...ev.detail.value };
        Object.keys(config).forEach((k) => {
          if (config[k] === '' || config[k] === null) delete config[k];
        });
        // Keep chip_order (managed by the sort list below)
        if (this._config.chip_order) config.chip_order = this._config.chip_order;
        this._fireConfig(config);
      });
      this.appendChild(this._form);

      this._orderBox = document.createElement('div');
      this._orderBox.className = 'rk-order';
      this._orderBox.innerHTML = `
        <div class="rk-order-title"></div>
        <div class="rk-order-hint"></div>
        <div class="rk-order-list"></div>
        <div class="rk-reset">
          <button type="button">
            <ha-icon icon="mdi:restore"></ha-icon>
            <span class="rk-reset-label"></span>
          </button>
        </div>
      `;
      this.appendChild(this._orderBox);
      this._orderList = this._orderBox.querySelector('.rk-order-list');

      this._orderBox.querySelector('.rk-reset button').addEventListener('click', () => {
        const config = { ...this._config };
        RK_DESIGN_KEYS.forEach((k) => delete config[k]);
        delete config.variant;
        this._fireConfig(config);
        this._render();
      });
    }

    this._orderBox.querySelector('.rk-order-title').textContent = rkT(this._hass, 'order_title');
    this._orderBox.querySelector('.rk-order-hint').textContent = rkT(this._hass, 'order_hint');
    this._orderBox.querySelector('.rk-reset-label').textContent = rkT(this._hass, 'reset');

    this._form.hass = this._hass;
    this._form.data = { ...RK_DEFAULTS, ...this._config };
    this._form.schema = rkBuildSchema(this._hass);
    this._renderOrder();
  }

  _renderOrder() {
    const order = this._currentOrder();
    this._orderList.innerHTML = '';
    order.forEach((key, idx) => {
      const meta = RK_ORDER_META[key];
      const row = document.createElement('div');
      row.className = 'rk-row';
      row.innerHTML = `
        <ha-icon icon="${meta.icon}"></ha-icon>
        <span>${rkT(this._hass, meta.labelKey)}</span>
        <button type="button" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <button type="button" data-dir="1" ${idx === order.length - 1 ? 'disabled' : ''}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
      `;
      row.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const dir = parseInt(btn.dataset.dir, 10);
          const next = [...order];
          const j = idx + dir;
          [next[idx], next[j]] = [next[j], next[idx]];
          this._fireConfig({ ...this._config, chip_order: next });
          this._renderOrder();
        });
      });
      this._orderList.appendChild(row);
    });
  }
}

/* ---------------------------- Registration ---------------------------- */

if (!customElements.get('navroom-card')) {
  customElements.define('navroom-card', NavRoomCard);
  customElements.define('navroom-card-editor', NavRoomCardEditor);
}
if (!customElements.get('raum-karte')) {
  customElements.define('raum-karte', RaumKarteAlias);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'navroom-card')) {
  window.customCards.push({
    type: 'navroom-card',
    name: 'NavRoom Card',
    description: RK_I18N.en.card_description,
    preview: true,
    documentationURL: 'https://github.com/smarthomebutbetter/navroom-card',
  });
}

console.info(
  `%c NAVROOM CARD %c v${RK_VERSION} `,
  'background:#ffbe78;color:#241a08;font-weight:800;border-radius:4px 0 0 4px;padding:2px 6px;',
  'background:#1b1e25;color:#ffbe78;font-weight:600;border-radius:0 4px 4px 0;padding:2px 6px;'
);
