/**
 * NavRoom Card – Custom Lovelace Card (v2.4.0)
 * Room overview card with area icon, light-color accent, power button,
 * sortable sensor chips (temperature, humidity, CO2) and three layout variants.
 *
 * v2.4.0:
 *  - New mobile-first editor: tabs (Content / Actions / Design), a sticky
 *    live preview, number fields with -/+ buttons instead of sliders and a
 *    color picker for the fallback color.
 *  - Automatic contrast: white/very light colors on light themes and very
 *    dark colors on dark themes are adjusted so icon and power button stay
 *    visible (`auto_contrast`, default on).
 *  - Windows chip: shows how many windows/doors in the room are open.
 *  - Heating chip: target temperature of the room thermostat, highlighted
 *    while heating.
 *  - Alarm state: smoke/heat/gas/CO/water sensors in the room turn the card
 *    red with a pulsing alarm icon.
 *  - Humidity warning: chip turns yellow from 65 %, orange from 70 %.
 *  - Optional area picture as card background (`show_picture`).
 *  - Presence dot on the room icon (occupancy/presence/motion sensor).
 *  - New chips: media playing, blinds position, room mode, room power,
 *    "ventilate" hint (high humidity/CO2 with all windows closed).
 *  - Windows chip turns orange when the thermostat heats with a window open.
 *  - Maintenance indicators: low battery and offline devices in the room.
 *  - Chip pages: at most `max_chips` (default 3) chips per row, justified or
 *    left-aligned (`chip_align`). More chips are split into balanced pages
 *    (4 -> 2+2, 5 -> 3+2) that gently cross-fade every `chip_rotate`
 *    seconds (default 6, 0 = off). No sideways scrolling any more.
 *  - Swedish, Danish, Norwegian, Finnish and Icelandic translations.
 *    Thanks @adnansarajlic (#3)
 *
 * v2.3.0:
 *  - Added `ignore_light_color` option: when enabled, the card always uses
 *    `accent_fallback` instead of the light's real color (fixes low-contrast
 *    white icons on light themes). Thanks @emartoni (#1, #4)
 *  - Added full Brazilian Portuguese (pt-BR) translation. Thanks @emartoni
 *  - Added haptic feedback on tap, double tap, hold and the power button,
 *    switchable with the new `haptics` option (default on). (#5)
 *  - Auto-discovery ignores diagnostic/config entities (e.g. device-internal
 *    temperatures of relays, wallboxes or water heaters).
 *  - A single chip can be switched off explicitly with `temp: none`
 *    (same for light, humidity, co2) – it no longer falls back to discovery.
 *  - New option `auto_discover` (default on). When off, only manually
 *    configured entities are used, so a cleared picker stays empty.
 *
 * v2.2.0:
 *  - Selecting an area in the editor now pre-fills the light and sensor
 *    pickers with the auto-discovered entities (visible and editable).
 *    Changing the area re-runs discovery and refills the pickers.
 *
 * v2.1.3:
 *  - Fixed preview rendering in HACS by using portable Markdown images.
 *
 * v2.1.2:
 *  - Added official HACS repository validation and store metadata.
 *
 * v2.1.1:
 *  - Added theme-aware dark-mode images and animations to the documentation.
 *
 * v2.1.0:
 *  - The power button got subtle depth (soft shadow + hairline ring) so it
 *    no longer visually drowns on light themes with bright accent colors.
 *
 * v2.0.0:
 *  - Auto-discovery: pick an area and the card finds the light (group
 *    preferred) and temperature/humidity/CO2 sensors on its own.
 *    Manual entity pickers always override auto-discovery.
 *  - Theme-adaptive: corner radius, border and shadow follow the active
 *    theme unless explicitly configured.
 *  - `custom:raum-karte` still renders as a backward-compatible alias,
 *    but is not offered in the card picker.
 *
 * https://github.com/smarthomebutbetter/navroom-card
 */

const RK_VERSION = '2.4.0';

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
  ignore_light_color: false,
  auto_discover: true,
  haptics: true,
  auto_contrast: true,
  show_picture: false,
  show_battery: true,
  show_offline: true,
  max_chips: 3,
  chip_rotate: 6,
  chip_align: 'justify',
};

const RK_DESIGN_KEYS = [
  'height', 'radius', 'padding', 'head_height', 'row_gap', 'icon_size',
  'name_size', 'name_weight', 'chip_height', 'chip_font', 'chip_pad',
  'chip_gap', 'pwr_size', 'pwr_icon', 'badge_size', 'bg_tint',
  'accent_fallback', 'ignore_light_color', 'auto_contrast', 'show_picture', 'chip_order',
  'max_chips', 'chip_rotate', 'chip_align',
];

const RK_VARIANTS = ['badge', 'chip', 'pur'];
const RK_CHIP_ORDER_DEFAULT = ['temp', 'humidity', 'windows', 'vent', 'climate', 'co2', 'media', 'covers', 'mode', 'power', 'light'];
const RK_HOLD_MS = 500;
const RK_DBL_MS = 250;
const RK_CO2_WARN = 1000;
const RK_CO2_ALERT = 1500;
const RK_HUM_WARN = 65;
const RK_HUM_ALERT = 70;
const RK_WINDOW_DC = ['window', 'door', 'garage_door'];
const RK_ALARM_DC = ['smoke', 'heat', 'gas', 'carbon_monoxide', 'moisture'];
const RK_PRESENCE_DC = ['occupancy', 'presence', 'motion'];
const RK_BATTERY_LOW = 15;
const RK_VENT_CO2 = 1000;
const RK_SLOT_MIN = 64;
const RK_FADE_MS = 700;

/* ------------------------------ i18n ------------------------------ */

const RK_I18N = {
  en: {
    area: 'Area',
    auto_discover: 'Auto-discover entities in this area',
    haptics: 'Haptic feedback',
    climate: 'Thermostat',
    windows: 'Windows & doors',
    alarms: 'Alarm sensors (smoke, heat, water)',
    auto_contrast: 'Automatic contrast',
    show_picture: 'Area picture as background',
    tab_content: 'Content',
    tab_actions: 'Actions',
    tab_design: 'Design',
    group_sizes: 'Sizes',
    group_look: 'Colors & look',
    preview: 'Preview',
    theme: 'Theme',
    bg_tint_pct: 'Background tint',
    order_climate: 'Heating',
    order_windows: 'Windows',
    n_open: '{n} open',
    heat_off: 'Off',
    presence: 'Presence / motion sensor',
    media: 'Media players',
    covers: 'Blinds / covers',
    mode: 'Room mode (select)',
    power: 'Power sensors',
    show_battery: 'Show low battery',
    show_offline: 'Show offline devices',
    order_vent: 'Ventilate hint',
    order_media: 'Media',
    order_covers: 'Blinds',
    order_mode: 'Mode',
    order_power: 'Power',
    open_heating: '{n} open · heating',
    ventilate: 'Ventilate',
    closed: 'Closed',
    battery_low: 'Low battery',
    max_chips: 'Max. chips side by side',
    chip_rotate: 'Next chips every',
    chip_align: 'Chip alignment',
    align_justify: 'Justified',
    align_left: 'Left',
    offline_n: '{n} offline',
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
    ignore_light_color: 'Ignore light color (always use fallback)',
    section_interaction: 'Interactions',
    section_overrides: 'Overrides (optional)',
    section_design: 'Design',
    order_title: 'Chip order',
    order_hint: 'Chips without a sensor are skipped.',
    discovery_hint: 'Fills in light and sensors from the area. Turn off to keep cleared fields empty.',
    order_temp: 'Temperature',
    order_humidity: 'Humidity',
    order_co2: 'CO2',
    order_light: 'Lights chip',
    reset: 'Reset design',
    off: 'Off',
    one_light: '1 light',
    n_lights: '{n} lights',
    error_area: 'Please select an area or set a name.',
    card_description: 'Room overview with auto-discovery per area, light-color accent, configurable power button, sortable sensor chips and three layout variants.',
  },
  de: {
    area: 'Bereich',
    auto_discover: 'Entitäten im Bereich automatisch erkennen',
    haptics: 'Haptisches Feedback',
    climate: 'Thermostat',
    windows: 'Fenster & Türen',
    alarms: 'Alarmmelder (Rauch, Hitze, Wasser)',
    auto_contrast: 'Automatischer Kontrast',
    show_picture: 'Raumbild als Hintergrund',
    tab_content: 'Inhalt',
    tab_actions: 'Aktionen',
    tab_design: 'Design',
    group_sizes: 'Größen',
    group_look: 'Farben & Aussehen',
    preview: 'Vorschau',
    theme: 'Theme',
    bg_tint_pct: 'Hintergrund-Einfärbung',
    order_climate: 'Heizung',
    order_windows: 'Fenster',
    n_open: '{n} offen',
    heat_off: 'Aus',
    presence: 'Präsenz- / Bewegungsmelder',
    media: 'Mediaplayer',
    covers: 'Rollos / Beschattung',
    mode: 'Raum-Modus (Auswahl)',
    power: 'Leistungssensoren',
    show_battery: 'Schwache Batterie anzeigen',
    show_offline: 'Offline-Geräte anzeigen',
    order_vent: 'Lüften-Hinweis',
    order_media: 'Medien',
    order_covers: 'Rollos',
    order_mode: 'Modus',
    order_power: 'Leistung',
    open_heating: '{n} offen · Heizung an',
    ventilate: 'Lüften',
    closed: 'Zu',
    battery_low: 'Batterie schwach',
    max_chips: 'Max. Chips nebeneinander',
    chip_rotate: 'Nächste Chips alle',
    chip_align: 'Chip-Ausrichtung',
    align_justify: 'Blocksatz',
    align_left: 'Linksbündig',
    offline_n: '{n} offline',
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
    ignore_light_color: 'Lichtfarbe ignorieren (immer Fallback nutzen)',
    section_interaction: 'Interaktion',
    section_overrides: 'Überschreiben (optional)',
    section_design: 'Design',
    order_title: 'Chip-Reihenfolge',
    order_hint: 'Chips ohne Sensor werden übersprungen.',
    discovery_hint: 'Trägt Licht und Sensoren aus dem Bereich ein. Aus, damit geleerte Felder leer bleiben.',
    order_temp: 'Temperatur',
    order_humidity: 'Luftfeuchtigkeit',
    order_co2: 'CO2',
    order_light: 'Lichter-Chip',
    reset: 'Design zurücksetzen',
    off: 'Aus',
    one_light: '1 Licht',
    n_lights: '{n} Lichter',
    error_area: 'Bitte einen Bereich wählen oder einen Namen setzen.',
    card_description: 'Raumübersicht mit Auto-Discovery pro Bereich, Lichtfarben-Akzent, konfigurierbarem Power-Button, sortierbaren Sensor-Chips und drei Layout-Varianten.',
  },
  pt: {
    area: 'Área',
    auto_discover: 'Detectar entidades da área automaticamente',
    haptics: 'Feedback tátil',
    climate: 'Termostato',
    windows: 'Janelas e portas',
    alarms: 'Sensores de alarme (fumaça, calor, água)',
    auto_contrast: 'Contraste automático',
    show_picture: 'Imagem da área como fundo',
    tab_content: 'Conteúdo',
    tab_actions: 'Ações',
    tab_design: 'Design',
    group_sizes: 'Tamanhos',
    group_look: 'Cores e aparência',
    preview: 'Pré-visualização',
    theme: 'Tema',
    bg_tint_pct: 'Tonalidade do fundo',
    order_climate: 'Aquecimento',
    order_windows: 'Janelas',
    n_open: '{n} abertas',
    heat_off: 'Desligado',
    presence: 'Sensor de presença / movimento',
    media: 'Reprodutores de mídia',
    covers: 'Persianas',
    mode: 'Modo do cômodo (seleção)',
    power: 'Sensores de potência',
    show_battery: 'Mostrar bateria fraca',
    show_offline: 'Mostrar dispositivos offline',
    order_vent: 'Aviso de ventilação',
    order_media: 'Mídia',
    order_covers: 'Persianas',
    order_mode: 'Modo',
    order_power: 'Potência',
    open_heating: '{n} abertas · aquecendo',
    ventilate: 'Ventilar',
    closed: 'Fechado',
    battery_low: 'Bateria fraca',
    max_chips: 'Máx. de chips lado a lado',
    chip_rotate: 'Próximos chips a cada',
    chip_align: 'Alinhamento dos chips',
    align_justify: 'Justificado',
    align_left: 'À esquerda',
    offline_n: '{n} offline',
    light: 'Luz (grupo ou luz única)',
    temp: 'Sensor de temperatura',
    humidity: 'Sensor de umidade',
    co2: 'Sensor de CO2',
    variant: 'Variante',
    variant_badge: 'Contador no botão de energia',
    variant_chip: 'Chip de luzes na linha de status',
    variant_pur: 'Simples – sem contador',
    tap_action: 'Cartão: toque',
    hold_action: 'Cartão: pressionar e segurar',
    double_tap_action: 'Cartão: toque duplo',
    power_action: 'Botão de energia: toque',
    name: 'Substituir nome',
    icon: 'Substituir ícone',
    height: 'Altura do cartão',
    radius: 'Raio das bordas',
    icon_size: 'Tamanho do ícone',
    name_size: 'Tamanho do nome',
    chip_height: 'Altura do chip',
    chip_font: 'Tamanho da fonte do chip',
    pwr_size: 'Tamanho do botão de energia',
    badge_size: 'Tamanho do contador',
    bg_tint: 'Tonalidade do fundo (0–0,4)',
    accent_fallback: 'Cor reserva (R,G,B)',
    ignore_light_color: 'Ignorar cor da luz (sempre usar cor reserva)',
    section_interaction: 'Interações',
    section_overrides: 'Substituições (opcional)',
    section_design: 'Design',
    order_title: 'Ordem dos chips',
    order_hint: 'Chips sem sensor são ignorados.',
    discovery_hint: 'Preenche luz e sensores a partir da área. Desative para manter campos limpos vazios.',
    order_temp: 'Temperatura',
    order_humidity: 'Umidade',
    order_co2: 'CO2',
    order_light: 'Chip de luzes',
    reset: 'Redefinir design',
    off: 'Desligado',
    one_light: '1 luz',
    n_lights: '{n} luzes',
    error_area: 'Selecione uma área ou defina um nome.',
    card_description: 'Visão geral do cômodo com descoberta automática por área, destaque de cor da luz, botão de energia configurável, chips de sensores ordenáveis e três variantes de layout.',
  },
  sv: {
    area: 'Område',
    light: 'Belysning (grupp eller enskild lampa)',
    temp: 'Temperatursensor',
    humidity: 'Luftfuktighetssensor',
    co2: 'CO2-sensor',
    variant: 'Variant',
    variant_badge: 'Räknar-badge på strömknapp',
    variant_chip: 'Lamp-chip i statusraden',
    variant_pur: 'Stilren – utan räknare',
    tap_action: 'Kort: Tryck',
    hold_action: 'Kort: Håll ned',
    double_tap_action: 'Kort: Dubbeltryck',
    power_action: 'Strömknapp: Tryck',
    name: 'Åsidosätt namn',
    icon: 'Åsidosätt ikon',
    height: 'Korthöjd',
    radius: 'Hörnradie',
    icon_size: 'Ikonstorlek',
    name_size: 'Namnstorlek',
    chip_height: 'Chip-höjd',
    chip_font: 'Chip-textstorlek',
    pwr_size: 'Strömknapp',
    badge_size: 'Badge',
    bg_tint: 'Bakgrundstoning (0–0.4)',
    accent_fallback: 'Fallback-färg (R,G,B)',
    section_interaction: 'Interaktioner',
    section_overrides: 'Åsidosättningar (valfritt)',
    section_design: 'Design',
    order_title: 'Chip-ordning',
    order_hint: 'Sortera med pilarna – sensorer som inte konfigurerats hoppas över automatiskt.',
    discovery_hint: 'Val av område fyller automatiskt i lampor och sensorer nedan – du kan ändra dem när som helst.',
    order_temp: 'Temperatur',
    order_humidity: 'Luftfuktighet',
    order_co2: 'CO2',
    order_light: 'Lamp-chip',
    reset: 'Återställ design',
    off: 'Av',
    one_light: '1 lampa',
    n_lights: '{n} lampor',
    error_area: 'Vänligen välj ett område eller ange ett namn.',
    card_description: 'Rumsöversikt med auto-discovery per område, ljusfärgsaccent, anpassningsbar strömknapp, sorterbara sensor-chips och tre layoutvarianter.',
  },
  da: {
    area: 'Område',
    light: 'Belysning (gruppe eller enkelt lys)',
    temp: 'Temperatursensor',
    humidity: 'Luftfugtighedssensor',
    co2: 'CO2-sensor',
    variant: 'Variant',
    variant_badge: 'Tæller-badge på tænd/sluk-knap',
    variant_chip: 'Lys-chip i statusrækken',
    variant_pur: 'Enkel – uden tæller',
    tap_action: 'Kort: Tryk',
    hold_action: 'Kort: Hold',
    double_tap_action: 'Kort: Dobbelttryk',
    power_action: 'Tænd/sluk-knap: Tryk',
    name: 'Tilsidesæt navn',
    icon: 'Tilsidesæt ikon',
    height: 'Korthøjde',
    radius: 'Hjørneradius',
    icon_size: 'Ikonstørrelse',
    name_size: 'Navnestørrelse',
    chip_height: 'Chip-højde',
    chip_font: 'Chip-skriftstørrelse',
    pwr_size: 'Tænd/sluk-knap',
    badge_size: 'Badge',
    bg_tint: 'Baggrundstone (0–0.4)',
    accent_fallback: 'Fallback-farve (R,G,B)',
    section_interaction: 'Interaktioner',
    section_overrides: 'Tilsidesættelser (valgfrit)',
    section_design: 'Design',
    order_title: 'Chip-rækkefølge',
    order_hint: 'Sorter med pilene – sensorer, der ikke er konfigureret, springes automatisk over.',
    discovery_hint: 'Valg af et område udfylder automatisk lys og sensorer nedenfor – du kan altid ændre dem.',
    order_temp: 'Temperatur',
    order_humidity: 'Luftfugtighed',
    order_co2: 'CO2',
    order_light: 'Lys-chip',
    reset: 'Nulstil design',
    off: 'Fra',
    one_light: '1 lys',
    n_lights: '{n} lys',
    error_area: 'Vælg venligst et område eller indtast et navn.',
    card_description: 'Rumoversigt med auto-discovery pr. område, lysfarve-accent, konfigurerbar tænd/sluk-knap, sorterbare sensor-chips og tre layoutvarianter.',
  },
  no: {
    area: 'Område',
    light: 'Belysning (gruppe eller enkeltlys)',
    temp: 'Temperatursensor',
    humidity: 'Luftfuktighetssensor',
    co2: 'CO2-sensor',
    variant: 'Variant',
    variant_badge: 'Teller-badge på strømknapp',
    variant_chip: 'Lys-chip i statusraden',
    variant_pur: 'Enkel – uten teller',
    tap_action: 'Kort: Trykk',
    hold_action: 'Kort: Hold',
    double_tap_action: 'Kort: Dobbelttrykk',
    power_action: 'Strømknapp: Trykk',
    name: 'Overstyr navn',
    icon: 'Overstyr ikon',
    height: 'Korthøyde',
    radius: 'Hjørneradius',
    icon_size: 'Ikonstørrelse',
    name_size: 'Navnestørrelse',
    chip_height: 'Chip-høyde',
    chip_font: 'Chip-skriftstørrelse',
    pwr_size: 'Strømknapp',
    badge_size: 'Badge',
    bg_tint: 'Bakgrunnstoning (0–0.4)',
    accent_fallback: 'Fallback-farge (R,G,B)',
    section_interaction: 'Interaksjoner',
    section_overrides: 'Overstyringer (valgfritt)',
    section_design: 'Design',
    order_title: 'Chip-rekkefølge',
    order_hint: 'Sorter med pilene – sensorer som ikke er konfigurert hoppes over automatisk.',
    discovery_hint: 'Valg av område fyller automatisk inn lys og sensorer nedenfor – du kan endre dem når som helst.',
    order_temp: 'Temperatur',
    order_humidity: 'Luftfuktighet',
    order_co2: 'CO2',
    order_light: 'Lys-chip',
    reset: 'Tilbakestill design',
    off: 'Av',
    one_light: '1 lys',
    n_lights: '{n} lys',
    error_area: 'Vennligst velg et område eller oppgi et navn.',
    card_description: 'Romoverblikk med auto-discovery per område, lysfarge-aksent, konfigurerbar strømknapp, sorterbare sensor-chips og tre layoutvarianter.',
  },
  fi: {
    area: 'Alue',
    light: 'Valaistus (ryhmä tai yksittäinen valo)',
    temp: 'Lämpötila-anturi',
    humidity: 'Kosteusanturi',
    co2: 'CO2-anturi',
    variant: 'Variantti',
    variant_badge: 'Laskurimerkki virtapainikkeessa',
    variant_chip: 'Valosiru tilarivillä',
    variant_pur: 'Pelkistetty – ei laskuria',
    tap_action: 'Kortti: Napauta',
    hold_action: 'Kortti: Pidä painettuna',
    double_tap_action: 'Kortti: Kaksoisnapauta',
    power_action: 'Virtapainike: Napauta',
    name: 'Korvaa nimi',
    icon: 'Korvaa kuvake',
    height: 'Kortin korkeus',
    radius: 'Kulman säde',
    icon_size: 'Kuvakekoko',
    name_size: 'Nimen koko',
    chip_height: 'Sirun korkeus',
    chip_font: 'Sirun kirjasinkoko',
    pwr_size: 'Virtapainike',
    badge_size: 'Merkki',
    bg_tint: 'Taustasävy (0–0.4)',
    accent_fallback: 'Varaväri (R,G,B)',
    section_interaction: 'Vuorovaikutus',
    section_overrides: 'Ohitukset (valinnainen)',
    section_design: 'Ulkoasu',
    order_title: 'Sirujen järjestys',
    order_hint: 'Järjestä nuolilla – määrittämättömät anturit ohitetaan automaattisesti.',
    discovery_hint: 'Alueen valitseminen täyttää valot ja anturit automaattisesti alle – voit muokata niitä milloin vain.',
    order_temp: 'Lämpötila',
    order_humidity: 'Kosteus',
    order_co2: 'CO2',
    order_light: 'Valosiru',
    reset: 'Palauta ulkoasu',
    off: 'Pois',
    one_light: '1 valo',
    n_lights: '{n} valoa',
    error_area: 'Valitse alue tai anna nimi.',
    card_description: 'Huonenäkymä automaattisella aluehavainnoinnilla, valon värikorostuksella, muokattavalla virtapainikkeella, järjestettävillä anturisiruilla ja kolmella asetteluvaihtoehdolla.',
  },
  is: {
    area: 'Svæði',
    light: 'Lýsing (hópur eða stakt ljós)',
    temp: 'Hitaskynjari',
    humidity: 'Rakaskynjari',
    co2: 'CO2-skynjari',
    variant: 'Útgáfa',
    variant_badge: 'Talningarmerki á aflhnappi',
    variant_chip: 'Ljósa-flaga í stöðustiku',
    variant_pur: 'Einfalt – enginn teljari',
    tap_action: 'Spjald: Ýta',
    hold_action: 'Spjald: Halda',
    double_tap_action: 'Spjald: Tvíýta',
    power_action: 'Aflhnappur: Ýta',
    name: 'Hnekkja nafni',
    icon: 'Hnekkja tákni',
    height: 'Hæð spjalds',
    radius: 'Hornaradíus',
    icon_size: 'Táknstærð',
    name_size: 'Nafnstærð',
    chip_height: 'Hæð flögu',
    chip_font: 'Leturstærð flögu',
    pwr_size: 'Aflhnappur',
    badge_size: 'Merki',
    bg_tint: 'Bakgrunnsblær (0–0.4)',
    accent_fallback: 'Varalitur (R,G,B)',
    section_interaction: 'Samskipti',
    section_overrides: 'Hnekkingar (valfrjálst)',
    section_design: 'Útlit',
    order_title: 'Röðun flagna',
    order_hint: 'Raðaðu með örvunum – skynjurum sem ekki eru stilltir er sjálfkrafa sleppt.',
    discovery_hint: 'Val á svæði fyllir sjálfkrafa út ljós og skynjara hér að neðan – þú getur breytt þeim hvenær sem er.',
    order_temp: 'Hitastig',
    order_humidity: 'Raki',
    order_co2: 'CO2',
    order_light: 'Ljósa-flaga',
    reset: 'Endurstilla útlit',
    off: 'Slökkt',
    one_light: '1 ljós',
    n_lights: '{n} ljós',
    error_area: 'Vinsamlegast veldu svæði eða skráðu heiti.',
    card_description: 'Herbergisyfirlit með sjálfvirkri svæðagreiningu, ljóslitaskreytingu, stillanlegum aflhnappi, röðanlegum skynjaraflögum og þremur útlitsútgáfum.',
  },
};

function rkLang(hass) {
  const raw = String((hass && hass.locale && hass.locale.language) || (hass && hass.language) || 'en').toLowerCase().replace('_', '-');
  const base = raw.split('-')[0];
  if (base === 'nb' || base === 'nn') return 'no';
  if (RK_I18N[base]) return base;
  return 'en';
}

function rkT(hass, key) {
  const lang = rkLang(hass);
  return (RK_I18N[lang] && RK_I18N[lang][key]) || RK_I18N.en[key] || key;
}

/* -------------------- Auto-discovery (shared) -------------------- */

function rkDiscover(hass, areaId) {
  if (!hass || !areaId || !hass.entities) return {};

  const inArea = (e) => {
    if (e.area_id) return e.area_id === areaId;
    if (e.device_id && hass.devices && hass.devices[e.device_id]) {
      return hass.devices[e.device_id].area_id === areaId;
    }
    return false;
  };

  const lights = [];
  let temp = null;
  let humidity = null;
  let co2 = null;
  let climate = null;
  const windows = [];
  const alarms = [];
  const presence = [];
  const media = [];
  const covers = [];
  const power = [];
  const all = [];

  Object.values(hass.entities).forEach((e) => {
    if (e.disabled_by || e.hidden_by) return;
    if (!inArea(e)) return;
    const id = e.entity_id;
    const st = hass.states[id];
    if (!st) return;
    // every visible entity of the room (incl. diagnostics) – for battery / offline
    all.push(id);
    if (e.entity_category) return;
    const domain = id.split('.')[0];
    if (domain === 'media_player') {
      media.push(id);
      return;
    }
    if (domain === 'cover') {
      covers.push(st);
      return;
    }
    if (domain === 'light') {
      lights.push(st);
      return;
    }
    if (domain === 'climate') {
      if (!climate) climate = id;
      return;
    }
    if (domain === 'binary_sensor') {
      const bdc = st.attributes && st.attributes.device_class;
      if (RK_WINDOW_DC.includes(bdc)) windows.push(id);
      else if (RK_ALARM_DC.includes(bdc)) alarms.push(id);
      else if (RK_PRESENCE_DC.includes(bdc)) presence.push({ id, dc: bdc });
      return;
    }
    if (domain === 'sensor') {
      const dc = st.attributes && st.attributes.device_class;
      if (dc === 'temperature' && !temp) temp = id;
      else if (dc === 'humidity' && !humidity) humidity = id;
      else if (dc === 'carbon_dioxide' && !co2) co2 = id;
      else if (dc === 'power') power.push(id);
    }
  });

  // Prefer a light group (the one with the most members), otherwise the first light
  let light = null;
  const groups = lights.filter(
    (s) => s.attributes && Array.isArray(s.attributes.entity_id) && s.attributes.entity_id.length
  );
  if (groups.length) {
    groups.sort((a, b) => b.attributes.entity_id.length - a.attributes.entity_id.length);
    light = groups[0].entity_id;
  } else if (lights.length) {
    light = lights[0].entity_id;
  }

  // Presence: occupancy/presence beats motion
  presence.sort((a, b) => RK_PRESENCE_DC.indexOf(a.dc) - RK_PRESENCE_DC.indexOf(b.dc));
  // Blinds: a cover group replaces its members
  const coverGroups = covers.filter((c) => c.attributes && Array.isArray(c.attributes.entity_id) && c.attributes.entity_id.length);
  const coverIds = coverGroups.length ? [coverGroups[0].entity_id] : covers.map((c) => c.entity_id);

  return {
    light, temp, humidity, co2, climate, windows, alarms,
    presence: presence.length ? presence[0].id : null,
    media, covers: coverIds, power, all,
  };
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
      throw new Error(RK_I18N.en.error_area + ' / ' + RK_I18N.de.error_area + ' / ' + RK_I18N.pt.error_area);
    }
    this._userKeys = new Set(Object.keys(config));
    this._c = { ...RK_DEFAULTS, ...config };
    if (Array.isArray(this._c.accent_fallback)) this._c.accent_fallback = this._c.accent_fallback.join(',');
    if (this._c.variant === 'zaehler') this._c.variant = 'badge';
    if (!RK_VARIANTS.includes(this._c.variant)) this._c.variant = 'badge';
    this._discFor = null;
    this._built = false;
    if (this._hass) this._build();
    if (this.isConnected) this._startRotation();
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

  _discover() {
    const hass = this._hass;
    const areaId = this._c.area;
    if (!hass || !areaId || !hass.entities) return {};
    if (this._discFor === hass.entities && this._discArea === areaId) return this._disc;
    this._disc = rkDiscover(hass, areaId);
    this._discFor = hass.entities;
    this._discArea = areaId;
    return this._disc;
  }

  /* Effective entities: manual config wins over auto-discovery */
  _eff() {
    const c = this._c;
    const d = c.auto_discover === false ? {} : this._discover();
    const pick = (k) => {
      const v = c[k];
      if (v === 'none' || v === false) return '';
      return v || d[k] || '';
    };
    const list = (k) => {
      const v = c[k];
      if (v === 'none' || v === false) return [];
      if (Array.isArray(v) && v.length) return v;
      if (typeof v === 'string' && v) return [v];
      return Array.isArray(d[k]) ? d[k] : [];
    };
    return {
      light: pick('light'),
      temp: pick('temp'),
      humidity: pick('humidity'),
      co2: pick('co2'),
      climate: pick('climate'),
      windows: list('windows'),
      alarms: list('alarms'),
      presence: pick('presence'),
      mode: c.mode && c.mode !== 'none' ? c.mode : '',
      media: list('media'),
      covers: list('covers'),
      power: list('power'),
      all: Array.isArray(d.all) ? d.all : (this._discover().all || []),
    };
  }

  /* Haptic feedback via the Home Assistant frontend (Companion app) */
  _haptic(type) {
    if (this._c.haptics === false) return;
    const ev = new Event('haptic', { bubbles: true, composed: true });
    ev.detail = type;
    window.dispatchEvent(ev);
  }

  _watchedIds() {
    const e = this._eff();
    const ids = [];
    if (e.light) {
      ids.push(e.light);
      const st = this._hass && this._hass.states[e.light];
      const members = st && st.attributes ? st.attributes.entity_id : null;
      if (Array.isArray(members)) ids.push(...members);
    }
    if (e.temp) ids.push(e.temp);
    if (e.humidity) ids.push(e.humidity);
    if (e.co2) ids.push(e.co2);
    if (e.climate) ids.push(e.climate);
    if (e.presence) ids.push(e.presence);
    if (e.mode) ids.push(e.mode);
    ids.push(...e.windows, ...e.alarms, ...e.media, ...e.covers, ...e.power, ...e.all);
    return ids;
  }

  _statesChanged(a, b) {
    if (!a) return true;
    if (a.entities !== b.entities) return true;
    return this._watchedIds().some((id) => a.states[id] !== b.states[id]);
  }

  _build() {
    const c = this._c;
    const chipIcon = Math.round(c.chip_font + 3);
    // Theme-adaptive defaults: only force values the user explicitly configured
    const radius = this._userKeys.has('radius')
      ? `${c.radius}px`
      : 'var(--ha-card-border-radius, 12px)';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          position: relative;
          height: ${c.height}px;
          padding: ${c.padding}px;
          border-radius: ${radius};
          border: var(--ha-card-border-width, 0px) solid var(--ha-card-border-color, transparent);
          box-shadow: var(--ha-card-box-shadow, none);
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
        .icwrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        #pres {
          position: absolute;
          left: ${Math.round(c.icon_size - 5)}px;
          top: -2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--success-color, #43a047);
          box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color));
          display: none;
        }
        #pres.show { display: block; }
        #ind {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        #ind ha-icon { --mdc-icon-size: 16px; }
        #ind .bat { color: var(--rk-c-open); }
        #ind .off { color: var(--secondary-text-color); opacity: 0.8; }
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
          box-shadow: var(--rk-pwr-shadow, none);
          transition: transform .15s ease, background .25s ease, box-shadow .25s ease;
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
          height: ${c.chip_height}px;
          min-width: 0;
        }
        #chips { transition: opacity ${RK_FADE_MS}ms ease; }
        #chips.fade { opacity: 0; }
        .slot {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
        }
        .slot .chip { width: 100%; min-width: 0; box-sizing: border-box; }
        #chips.left .slot { flex: 0 1 auto; }
        #chips.left .slot .chip { width: auto; }
        .chip .tx {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
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
          flex: 0 0 auto;
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
        .chip.open {
          color: var(--rk-c-open);
          background: rgba(255, 193, 7, 0.18);
        }
        .chip.wet {
          color: var(--rk-c-wet);
          background: rgba(3, 169, 244, 0.14);
        }
        .chip.wet2 {
          color: var(--rk-c-wet);
          background: rgba(3, 169, 244, 0.26);
        }
        .chip.heat, .chip.conflict {
          color: var(--rk-c-heat);
          background: rgba(255, 87, 34, 0.15);
        }
        .chip.conflict { font-weight: 700; }
        ha-card.pic {
          background:
            linear-gradient(var(--rk-overlay), var(--rk-overlay)),
            var(--rk-pic) center / cover no-repeat,
            var(--ha-card-background, var(--card-background-color));
        }
        ha-card.pic.on {
          background:
            linear-gradient(0deg, rgba(var(--rk-accent), ${c.bg_tint}), rgba(var(--rk-accent), ${c.bg_tint})),
            linear-gradient(var(--rk-overlay), var(--rk-overlay)),
            var(--rk-pic) center / cover no-repeat,
            var(--ha-card-background, var(--card-background-color));
        }
        ha-card.alarm {
          box-shadow: inset 0 0 0 2px #e53935, var(--ha-card-box-shadow, none);
        }
        ha-card.alarm #ic {
          color: #e53935;
          animation: rk-pulse 1.2s ease-in-out infinite;
        }
        @keyframes rk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          ha-card, #pwr, #ic, .chip { transition: none; }
          ha-card.alarm #ic { animation: none; }
          #chips { transition: none; }
        }
      </style>
      <ha-card>
        <div class="head">
          <div class="icwrap">
            <ha-icon id="ic"></ha-icon>
            <span id="pres"></span>
            <div id="ind"></div>
          </div>
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
      pres: this.shadowRoot.getElementById('pres'),
      ind: this.shadowRoot.getElementById('ind'),
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
        config: { entity: this._eff().light, tap_action: actionConfig },
        action: 'tap',
      },
      bubbles: true,
      composed: true,
    }));
  }

  _handleAction(action) {
    this._haptic(action === 'hold' ? 'medium' : 'light');
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
    this._haptic('light');
    const cfg = this._c.power_action;
    if (cfg && cfg.action) {
      if (cfg.action === 'none') return;
      this._fireHassAction(cfg);
      return;
    }
    const light = this._eff().light;
    if (light && this._hass) {
      this._hass.callService('light', 'toggle', { entity_id: light });
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

    const eff = this._eff();

    // Theme-independent neutral tones (dark/light)
    const dark = !!(hass.themes && hass.themes.darkMode);
    el.card.style.setProperty('--rk-neutral', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
    el.card.style.setProperty('--rk-c-open', dark ? 'var(--amber-color, #ffc107)' : '#a87800');
    el.card.style.setProperty('--rk-c-wet', dark ? 'var(--light-blue-color, #03a9f4)' : '#0277bd');
    el.card.style.setProperty('--rk-c-heat', dark ? 'var(--deep-orange-color, #ff5722)' : '#d84315');
    // Subtle depth for the power button – keeps it visible on light themes
    // even when the accent color is very bright
    el.card.style.setProperty(
      '--rk-pwr-shadow',
      dark
        ? '0 2px 5px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
        : '0 1px 4px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)'
    );

    // Name & icon from the area registry (with overrides)
    const area = c.area && hass.areas ? hass.areas[c.area] : null;
    el.name.textContent = c.name || (area && area.name) || c.area || '';
    const alarmOn = eff.alarms.some((id) => hass.states[id] && hass.states[id].state === 'on');
    el.card.classList.toggle('alarm', alarmOn);
    el.ic.setAttribute('icon', alarmOn ? 'mdi:alarm-light' : (c.icon || (area && area.icon) || 'mdi:home-outline'));

    // Optional area picture as background
    const pic = c.show_picture && area && area.picture ? area.picture : '';
    el.card.classList.toggle('pic', !!pic);
    if (pic) {
      el.card.style.setProperty('--rk-pic', `url("${String(pic).replace(/"/g, '%22')}")`);
      el.card.style.setProperty('--rk-overlay', dark ? 'rgba(18,18,22,0.62)' : 'rgba(255,255,255,0.74)');
    }

    // Presence dot
    const pst = eff.presence ? hass.states[eff.presence] : null;
    el.pres.classList.toggle('show', !!(pst && pst.state === 'on'));

    // Maintenance indicators: low battery / offline devices
    let ind = '';
    if (c.show_battery !== false) {
      const low = eff.all.filter((id) => {
        const s = hass.states[id];
        const dc = s && s.attributes && s.attributes.device_class;
        if (dc !== 'battery') return false;
        if (id.startsWith('binary_sensor.')) return s.state === 'on';
        const v = parseFloat(s.state);
        return !isNaN(v) && v < RK_BATTERY_LOW;
      });
      if (low.length) ind += `<ha-icon class="bat" icon="mdi:battery-alert-variant-outline" title="${rkT(hass, 'battery_low')}"></ha-icon>`;
    }
    if (c.show_offline !== false) {
      const devs = new Set();
      eff.all.forEach((id) => {
        const s = hass.states[id];
        if (!s || s.state !== 'unavailable') return;
        const reg = hass.entities && hass.entities[id];
        devs.add((reg && reg.device_id) || id);
      });
      if (devs.size) ind += `<ha-icon class="off" icon="mdi:lan-disconnect" title="${rkT(hass, 'offline_n').replace('{n}', devs.size)}"></ha-icon>`;
    }
    if (el.ind.innerHTML !== ind) el.ind.innerHTML = ind;

    // Light state & accent color (average of RGB colors of lights that are on)
    const light = eff.light ? hass.states[eff.light] : null;
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
    // When `ignore_light_color` is enabled, always use the fallback color,
    // regardless of the actual light color (fixes white-on-white contrast
    // issues on light themes).
    if (!c.ignore_light_color && cols.length) {
      accent = [0, 1, 2]
        .map((i) => Math.round(cols.reduce((a, x) => a + x[i], 0) / cols.length))
        .join(',');
    }
    if (c.auto_contrast !== false) accent = this._contrastSafe(accent, dark);
    el.card.style.setProperty('--rk-accent', accent);
    el.card.classList.toggle('on', on);

    // Power button & badge (badge only in "badge" variant)
    el.pwr.classList.toggle('show', !!eff.light);
    el.badge.textContent = String(count);
    el.badge.classList.toggle('show', c.variant === 'badge' && count > 0);

    // Chips: build and sort by configured order
    const defs = {};
    if (eff.temp) {
      defs.temp = { icon: 'mdi:thermometer', t: this._fmt(hass.states[eff.temp], 1, '°'), cls: '' };
    }
    if (eff.humidity) {
      const hv = hass.states[eff.humidity] ? parseFloat(hass.states[eff.humidity].state) : NaN;
      let hcls = '';
      if (!isNaN(hv) && hv >= RK_HUM_ALERT) hcls = 'wet2';
      else if (!isNaN(hv) && hv >= RK_HUM_WARN) hcls = 'wet';
      defs.humidity = { icon: 'mdi:water-percent', t: this._fmt(hass.states[eff.humidity], 0, '%'), cls: hcls };
    }
    if (eff.climate && hass.states[eff.climate]) {
      const cs = hass.states[eff.climate];
      const off = cs.state === 'off' || cs.state === 'unavailable';
      const heating = cs.attributes && cs.attributes.hvac_action === 'heating';
      const target = cs.attributes ? cs.attributes.temperature : undefined;
      defs.climate = {
        icon: 'mdi:thermostat',
        t: off ? rkT(hass, 'heat_off') : this._fmt({ state: target }, 1, '°'),
        cls: heating ? 'heat' : '',
      };
    }
    const open = eff.windows.filter((id) => hass.states[id] && hass.states[id].state === 'on').length;
    const cst = eff.climate ? hass.states[eff.climate] : null;
    const heatingOn = !!(cst && (cst.state === 'heat' || (cst.attributes && cst.attributes.hvac_action === 'heating')));
    if (open > 0) {
      defs.windows = heatingOn
        ? { icon: 'mdi:window-open-variant', t: rkT(hass, 'open_heating').replace('{n}', open), cls: 'conflict' }
        : { icon: 'mdi:window-open-variant', t: rkT(hass, 'n_open').replace('{n}', open), cls: 'open' };
    }
    // Ventilate hint: stuffy air and every window closed
    {
      const hv = eff.humidity && hass.states[eff.humidity] ? parseFloat(hass.states[eff.humidity].state) : NaN;
      const cv = eff.co2 && hass.states[eff.co2] ? parseFloat(hass.states[eff.co2].state) : NaN;
      const stuffy = (!isNaN(hv) && hv >= RK_HUM_ALERT) || (!isNaN(cv) && cv >= RK_VENT_CO2);
      if (stuffy && open === 0) defs.vent = { icon: 'mdi:weather-windy', t: rkT(hass, 'ventilate'), cls: 'wet' };
    }
    // Media playing
    {
      const playing = eff.media.map((id) => hass.states[id]).find((s) => s && s.state === 'playing');
      if (playing) {
        const nm = (playing.attributes && playing.attributes.friendly_name) || playing.entity_id;
        defs.media = { icon: 'mdi:play', t: nm, cls: 'hot' };
      }
    }
    // Blinds: only when not fully open
    {
      const cs = eff.covers.map((id) => hass.states[id]).filter((s) => s && s.state !== 'unavailable');
      if (cs.length) {
        const pos = cs.map((s) => (s.attributes && typeof s.attributes.current_position === 'number')
          ? s.attributes.current_position : (s.state === 'closed' ? 0 : 100));
        const avg = Math.round(pos.reduce((a, b) => a + b, 0) / pos.length);
        if (avg < 100) {
          defs.covers = avg === 0
            ? { icon: 'mdi:roller-shade-closed', t: rkT(hass, 'closed'), cls: '' }
            : { icon: 'mdi:roller-shade', t: avg + ' %', cls: '' };
        }
      }
    }
    // Room mode
    if (eff.mode && hass.states[eff.mode]) {
      const m = hass.states[eff.mode].state;
      if (!['aus', 'off', 'none', 'unknown', 'unavailable', ''].includes(String(m).toLowerCase())) {
        defs.mode = { icon: 'mdi:tune-variant', t: m, cls: '' };
      }
    }
    // Room power
    {
      let w = 0;
      eff.power.forEach((id) => {
        const s = hass.states[id];
        const v = s ? parseFloat(s.state) : NaN;
        if (isNaN(v)) return;
        const unit = s.attributes && s.attributes.unit_of_measurement;
        w += unit === 'kW' ? v * 1000 : v;
      });
      if (w >= 1) {
        const txt = w >= 1000 ? this._fmt({ state: w / 1000 }, 1, ' kW') : Math.round(w) + ' W';
        defs.power = { icon: 'mdi:flash', t: txt, cls: '' };
      }
    }
    if (eff.co2) {
      const v = hass.states[eff.co2] ? parseFloat(hass.states[eff.co2].state) : NaN;
      let cls = '';
      if (!isNaN(v) && v >= RK_CO2_ALERT) cls = 'alert';
      else if (!isNaN(v) && v >= RK_CO2_WARN) cls = 'warn';
      defs.co2 = { icon: 'mdi:molecule-co2', t: this._fmt(hass.states[eff.co2], 0, ' ppm'), cls };
    }
    if (c.variant === 'chip' && eff.light) {
      let t;
      if (count === 0) t = rkT(hass, 'off');
      else if (count === 1) t = rkT(hass, 'one_light');
      else t = rkT(hass, 'n_lights').replace('{n}', count);
      defs.light = { icon: 'mdi:lightbulb-outline', t, cls: count > 0 ? 'hot' : '' };
    }
    this._chipList = this._chipOrder().filter((k) => defs[k]).map((k) => ({ k, ...defs[k] }));
    this._layoutChips(false);
  }

  /* ---------- Chip slots ---------- */

  _chipHtml(x) {
    return `<div class="slot"><span class="chip${x.cls ? ' ' + x.cls : ''}" data-k="${x.k}"><ha-icon icon="${x.icon}"></ha-icon><span class="tx">${x.t}</span></span></div>`;
  }

  /* At most `max_chips` per page (fewer on narrow cards). More chips are split
     into balanced pages which cross-fade gently. */
  _pageItems() {
    const box = this._el.chips;
    const list = this._chipList || [];
    const c = this._c;
    const W = box.clientWidth;
    const max = Math.max(1, parseInt(c.max_chips, 10) || 3);
    const byWidth = W ? Math.max(1, Math.floor((W + c.chip_gap) / (RK_SLOT_MIN + c.chip_gap))) : max;
    const per = Math.max(1, Math.min(max, byWidth));
    const pages = Math.max(1, Math.ceil(list.length / per));
    const base = Math.floor(list.length / pages);
    const extra = list.length % pages;
    const bounds = [];
    let from = 0;
    for (let p = 0; p < pages; p++) {
      const size = base + (p < extra ? 1 : 0);
      bounds.push([from, from + size]);
      from += size;
    }
    this._rotating = pages > 1;
    const p = (this._page || 0) % pages;
    return list.slice(bounds[p][0], bounds[p][1]);
  }

  _renderChips() {
    const box = this._el.chips;
    box.classList.toggle('left', this._c.chip_align === 'left');
    const html = this._pageItems().map((x) => this._chipHtml(x)).join('');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  _layoutChips(animate) {
    const box = this._el && this._el.chips;
    if (!box) return;
    if (!this._ro && window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._layoutChips(false));
      this._ro.observe(box);
    }
    if (!animate) {
      if (!this._fading) this._renderChips();
      return;
    }
    this._fading = true;
    box.classList.add('fade');
    setTimeout(() => {
      this._renderChips();
      box.classList.remove('fade');
      setTimeout(() => { this._fading = false; }, RK_FADE_MS);
    }, RK_FADE_MS);
  }

  _startRotation() {
    this._stopRotation();
    const sec = parseFloat(this._c && this._c.chip_rotate);
    if (!sec || sec <= 0) return;
    this._rotTimer = setInterval(() => {
      if (!this._rotating || document.hidden) return;
      this._page = (this._page || 0) + 1;
      this._layoutChips(true);
    }, Math.max(3, sec) * 1000 + 2 * RK_FADE_MS);
  }

  _stopRotation() {
    if (this._rotTimer) clearInterval(this._rotTimer);
    this._rotTimer = null;
  }

  connectedCallback() {
    if (this._c) this._startRotation();
  }

  disconnectedCallback() {
    this._stopRotation();
  }

  /* Keep the accent readable against the card background */
  _contrastSafe(accent, dark) {
    const rgb = String(accent).split(',').map((x) => parseInt(x, 10));
    if (rgb.length !== 3 || rgb.some((x) => isNaN(x))) return accent;
    const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    if (!dark) {
      // (Near-)white: no usable hue -> use the configured fallback color
      if (Math.min(...rgb) >= 200 && accent !== this._c.accent_fallback) {
        return this._contrastSafe(this._c.accent_fallback, dark);
      }
      if (lum > 0.76) {
        const f = 0.76 / lum;
        return rgb.map((x) => Math.round(x * f * 0.85)).join(',');
      }
      return accent;
    }
    if (lum < 0.18) {
      return rgb.map((x) => Math.round(x + (255 - x) * 0.45)).join(',');
    }
    return accent;
  }

  _fmt(state, decimals, unit) {
    const v = state ? parseFloat(state.state) : NaN;
    if (isNaN(v)) return '–';
    const sep = rkLang(this._hass) === 'de' ? ',' : (rkLang(this._hass) === 'pt' ? ',' : '.');
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
    } else {
      const light = this._eff().light;
      if (light) {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId: light },
          bubbles: true,
          composed: true,
        }));
      }
    }
  }
}

/* Backward-compatible alias element for existing `custom:raum-karte` configs
   (renders identically, but is not offered in the card picker) */
class RaumKarteAlias extends NavRoomCard {}

/* ------------------------------ Editor ------------------------------ */

const RK_ENTITY_KEYS = ['light', 'temp', 'humidity', 'co2', 'climate', 'windows', 'alarms', 'presence', 'media', 'covers'];
const RK_PRESENCE_FILTER = RK_PRESENCE_DC.map((dc) => ({ domain: 'binary_sensor', device_class: dc }));

const RK_WINDOW_FILTER = ['window', 'door', 'garage_door'].map((dc) => ({ domain: 'binary_sensor', device_class: dc }));
const RK_ALARM_FILTER = ['smoke', 'heat', 'gas', 'carbon_monoxide', 'moisture'].map((dc) => ({ domain: 'binary_sensor', device_class: dc }));

function rkContentSchema(hass) {
  return [
    { name: 'area', selector: { area: {} } },
    { name: 'auto_discover', selector: { boolean: {} } },
    { name: 'light', selector: { entity: { domain: 'light' } } },
    { name: 'temp', selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
    { name: 'humidity', selector: { entity: { domain: 'sensor', device_class: 'humidity' } } },
    { name: 'co2', selector: { entity: { domain: 'sensor', device_class: 'carbon_dioxide' } } },
    { name: 'climate', selector: { entity: { domain: 'climate' } } },
    { name: 'windows', selector: { entity: { multiple: true, filter: RK_WINDOW_FILTER } } },
    { name: 'alarms', selector: { entity: { multiple: true, filter: RK_ALARM_FILTER } } },
    { name: 'presence', selector: { entity: { filter: RK_PRESENCE_FILTER } } },
    { name: 'media', selector: { entity: { multiple: true, domain: 'media_player' } } },
    { name: 'covers', selector: { entity: { multiple: true, domain: 'cover' } } },
    { name: 'mode', selector: { entity: { domain: ['input_select', 'select'] } } },
    { name: 'power', selector: { entity: { multiple: true, domain: 'sensor', device_class: 'power' } } },
    { name: 'show_battery', selector: { boolean: {} } },
    { name: 'show_offline', selector: { boolean: {} } },
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
    { name: 'name', selector: { text: {} } },
    { name: 'icon', selector: { icon: {} } },
  ];
}

function rkActionSchema() {
  return [
    { name: 'tap_action', selector: { ui_action: {} } },
    { name: 'hold_action', selector: { ui_action: {} } },
    { name: 'double_tap_action', selector: { ui_action: {} } },
    { name: 'power_action', selector: { ui_action: {} } },
    { name: 'haptics', selector: { boolean: {} } },
  ];
}

function rkLookSchema(hass) {
  return [
    {
      name: 'chip_align',
      selector: {
        select: {
          mode: 'box',
          options: [
            { value: 'justify', label: rkT(hass, 'align_justify') },
            { value: 'left', label: rkT(hass, 'align_left') },
          ],
        },
      },
    },
    { name: 'accent_fallback', selector: { color_rgb: {} } },
    { name: 'auto_contrast', selector: { boolean: {} } },
    { name: 'ignore_light_color', selector: { boolean: {} } },
    { name: 'show_picture', selector: { boolean: {} } },
  ];
}

const RK_STEPPERS = [
  { key: 'height', min: 90, max: 220, step: 2, unit: 'px' },
  { key: 'radius', min: 0, max: 40, step: 1, unit: 'px', theme: true },
  { key: 'icon_size', min: 16, max: 40, step: 1, unit: 'px' },
  { key: 'name_size', min: 12, max: 26, step: 0.5, unit: 'px' },
  { key: 'chip_height', min: 18, max: 32, step: 1, unit: 'px' },
  { key: 'chip_font', min: 9, max: 15, step: 0.5, unit: 'px' },
  { key: 'pwr_size', min: 28, max: 52, step: 1, unit: 'px' },
  { key: 'badge_size', min: 12, max: 26, step: 1, unit: 'px' },
  { key: 'bg_tint', min: 0, max: 40, step: 1, unit: '%', scale: 100 },
  { key: 'max_chips', min: 1, max: 5, step: 1, unit: '' },
  { key: 'chip_rotate', min: 0, max: 60, step: 1, unit: 's' },
];

const RK_ORDER_META = {
  temp: { labelKey: 'order_temp', icon: 'mdi:thermometer' },
  humidity: { labelKey: 'order_humidity', icon: 'mdi:water-percent' },
  co2: { labelKey: 'order_co2', icon: 'mdi:molecule-co2' },
  climate: { labelKey: 'order_climate', icon: 'mdi:thermostat' },
  windows: { labelKey: 'order_windows', icon: 'mdi:window-open-variant' },
  vent: { labelKey: 'order_vent', icon: 'mdi:weather-windy' },
  media: { labelKey: 'order_media', icon: 'mdi:play' },
  covers: { labelKey: 'order_covers', icon: 'mdi:roller-shade' },
  mode: { labelKey: 'order_mode', icon: 'mdi:tune-variant' },
  power: { labelKey: 'order_power', icon: 'mdi:flash' },
  light: { labelKey: 'order_light', icon: 'mdi:lightbulb-outline' },
};

function rkRgbArray(v) {
  if (Array.isArray(v)) return v;
  const a = String(v || '').split(',').map((x) => parseInt(x, 10));
  return a.length === 3 && !a.some(isNaN) ? a : undefined;
}

class NavRoomCardEditor extends HTMLElement {
  constructor() {
    super();
    this._tab = 'content';
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._root) this._refresh();
  }

  /* ---------- config helpers ---------- */

  _fireConfig(config) {
    config.type = 'custom:navroom-card';
    this._config = config;
    this._updatePreview();
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  /* Apply the values of one ha-form. Only the keys of that form are touched,
     so a cleared field really disappears from the config. */
  _applyForm(value, keys) {
    const prev = this._config;
    const config = { ...prev };
    keys.forEach((k) => {
      let v = value[k];
      if (k === 'accent_fallback' && Array.isArray(v)) v = v.join(',');
      const empty = v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length);
      const isDefault = k in RK_DEFAULTS && !(k in prev) && JSON.stringify(v) === JSON.stringify(RK_DEFAULTS[k]);
      if (empty || isDefault) delete config[k];
      else config[k] = v;
    });
    return config;
  }

  _fillDiscovery(config) {
    const d = rkDiscover(this._hass, config.area);
    RK_ENTITY_KEYS.forEach((k) => {
      const v = d[k];
      if (Array.isArray(v) ? v.length : v) config[k] = v;
      else delete config[k];
    });
    this._matForArea = config.area;
    return config;
  }

  /* ---------- rendering ---------- */

  _render() {
    if (!this._root) this._build();
    this._refresh();
  }

  _build() {
    const style = document.createElement('style');
    style.textContent = `
      .rk-ed { display: block; }
      .rk-head {
        position: sticky;
        top: 0;
        z-index: 3;
        padding: 4px 0 14px;
        margin-bottom: 8px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--ha-dialog-surface-background, var(--mdc-theme-surface, var(--card-background-color)));
      }
      .rk-prev { padding-top: 12px; }
      .rk-prev-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 0 0 6px 2px;
      }
      .rk-prev-card {
        width: min(100%, 260px);
        margin: 0 auto;
        pointer-events: none;
      }
      .rk-tabs {
        display: flex;
        border: 1px solid var(--outline-color, var(--divider-color));
        border-radius: 999px;
        overflow: hidden;
        margin: 0;
      }
      .rk-tabs button {
        flex: 1;
        min-height: 44px;
        border: none;
        background: none;
        color: var(--primary-text-color);
        font: 500 14px Roboto, sans-serif;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .rk-tabs button + button { border-left: 1px solid var(--outline-color, var(--divider-color)); }
      .rk-tabs button.active {
        background: rgba(var(--rgb-primary-color, 3,169,244), 0.16);
        color: var(--primary-color);
      }
      .rk-pane[hidden] { display: none; }
      .rk-group-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin: 20px 0 8px;
      }
      .rk-step {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 56px;
        border-bottom: 1px solid var(--divider-color);
      }
      .rk-step:last-child { border-bottom: none; }
      .rk-step label {
        flex: 1;
        font-size: 15px;
        color: var(--primary-text-color);
      }
      .rk-step button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--outline-color, var(--divider-color));
        background: none;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        flex: 0 0 auto;
      }
      .rk-step button:active { background: rgba(var(--rgb-primary-color, 3,169,244), 0.16); }
      .rk-step button ha-icon { --mdc-icon-size: 20px; }
      .rk-step .rk-val {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        width: 96px;
        height: 40px;
        border-radius: 12px;
        background: var(--input-fill-color, rgba(127,127,127,0.1));
        box-sizing: border-box;
        padding: 0 8px;
      }
      .rk-step input {
        width: 3.2ch;
        min-width: 0;
        padding: 0;
        border: none;
        background: none;
        outline: none;
        text-align: right;
        font: 500 20px Roboto, sans-serif;
        color: var(--primary-text-color);
        line-height: 40px;
        -moz-appearance: textfield;
      }
      .rk-step input::-webkit-outer-spin-button,
      .rk-step input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .rk-step input::placeholder { color: var(--secondary-text-color); font-size: 13px; }
      .rk-step .rk-unit { font-size: 13px; color: var(--secondary-text-color); padding-top: 3px; }
      .rk-order-hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 10px;
      }
      .rk-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 0 8px 0 14px;
        border: 1px solid var(--divider-color);
        border-radius: 14px;
        margin-bottom: 6px;
      }
      .rk-row > ha-icon {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
      }
      .rk-row span {
        flex: 1;
        font-size: 15px;
        color: var(--primary-text-color);
      }
      .rk-row button {
        width: 40px;
        height: 40px;
        background: none;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rk-row button:disabled { opacity: 0.25; cursor: default; }
      .rk-row button ha-icon { --mdc-icon-size: 22px; }
      .rk-reset {
        margin: 20px 0 8px;
        display: flex;
        justify-content: center;
      }
      .rk-reset button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 20px;
        border: 1px solid var(--outline-color, var(--divider-color));
        border-radius: 999px;
        background: none;
        color: var(--primary-text-color);
        font: 500 14px Roboto, sans-serif;
        cursor: pointer;
      }
      .rk-reset button ha-icon { --mdc-icon-size: 18px; }
    `;
    this.appendChild(style);

    const root = document.createElement('div');
    root.className = 'rk-ed';
    this._root = root;

    /* Sticky live preview */
    this._prevWrap = document.createElement('div');
    this._prevWrap.className = 'rk-prev';
    this._prevLabel = document.createElement('div');
    this._prevLabel.className = 'rk-prev-label';
    const pc = document.createElement('div');
    pc.className = 'rk-prev-card';
    this._prevCard = document.createElement('navroom-card');
    pc.appendChild(this._prevCard);
    this._prevWrap.append(this._prevLabel, pc);
    /* Tabs */
    const tabs = document.createElement('div');
    tabs.className = 'rk-tabs';
    this._tabBtns = {};
    ['content', 'actions', 'design'].forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => {
        this._tab = t;
        this._refreshTabs();
      });
      this._tabBtns[t] = b;
      tabs.appendChild(b);
    });
    const head = document.createElement('div');
    head.className = 'rk-head';
    head.append(tabs, this._prevWrap);
    root.appendChild(head);

    /* Panes */
    this._panes = {};
    ['content', 'actions', 'design'].forEach((t) => {
      const p = document.createElement('div');
      p.className = 'rk-pane';
      this._panes[t] = p;
      root.appendChild(p);
    });

    // Content
    this._contentForm = this._makeForm((value) => {
      const prevArea = this._config.area;
      let config = this._applyForm(value, rkContentSchema(this._hass).map((s) => s.name));
      if (config.area && config.area !== prevArea && config.auto_discover !== false) {
        config = this._fillDiscovery(config);
        this._fireConfig(config);
        this._refresh();
        return;
      }
      this._fireConfig(config);
    });
    this._panes.content.appendChild(this._contentForm);

    // Actions
    this._actionForm = this._makeForm((value) => {
      this._fireConfig(this._applyForm(value, rkActionSchema().map((s) => s.name)));
    });
    this._panes.actions.appendChild(this._actionForm);

    // Design: size steppers
    this._sizeTitle = document.createElement('div');
    this._sizeTitle.className = 'rk-group-title';
    this._panes.design.appendChild(this._sizeTitle);
    this._steppers = {};
    const box = document.createElement('div');
    RK_STEPPERS.forEach((def) => {
      const row = document.createElement('div');
      row.className = 'rk-step';
      row.innerHTML = `
        <label></label>
        <button type="button" data-d="-1"><ha-icon icon="mdi:minus"></ha-icon></button>
        <div class="rk-val"><input type="number" inputmode="decimal" step="${def.step}"><span class="rk-unit">${def.unit}</span></div>
        <button type="button" data-d="1"><ha-icon icon="mdi:plus"></ha-icon></button>
      `;
      const input = row.querySelector('input');
      row.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cur = this._stepValue(def);
          this._setStep(def, cur + parseInt(btn.dataset.d, 10) * def.step);
        });
      });
      input.addEventListener('change', () => {
        if (input.value === '' && def.theme) {
          const config = { ...this._config };
          delete config[def.key];
          this._fireConfig(config);
          this._refreshSteppers();
          return;
        }
        this._setStep(def, parseFloat(String(input.value).replace(',', '.')));
      });
      this._steppers[def.key] = { row, input, label: row.querySelector('label') };
      box.appendChild(row);
    });
    this._panes.design.appendChild(box);

    // Design: colors & toggles
    this._lookTitle = document.createElement('div');
    this._lookTitle.className = 'rk-group-title';
    this._panes.design.appendChild(this._lookTitle);
    this._lookForm = this._makeForm((value) => {
      this._fireConfig(this._applyForm(value, rkLookSchema(this._hass).map((s) => s.name)));
    });
    this._panes.design.appendChild(this._lookForm);

    // Design: chip order
    this._orderTitle = document.createElement('div');
    this._orderTitle.className = 'rk-group-title';
    this._orderHint = document.createElement('div');
    this._orderHint.className = 'rk-order-hint';
    this._orderList = document.createElement('div');
    this._panes.design.append(this._orderTitle, this._orderHint, this._orderList);

    // Design: reset
    const reset = document.createElement('div');
    reset.className = 'rk-reset';
    reset.innerHTML = '<button type="button"><ha-icon icon="mdi:restore"></ha-icon><span></span></button>';
    this._resetLabel = reset.querySelector('span');
    reset.querySelector('button').addEventListener('click', () => {
      const config = { ...this._config };
      RK_DESIGN_KEYS.forEach((k) => delete config[k]);
      delete config.variant;
      this._fireConfig(config);
      this._refresh();
    });
    this._panes.design.appendChild(reset);

    this.appendChild(root);
  }

  _makeForm(onChange) {
    const f = document.createElement('ha-form');
    f.computeLabel = (s) => rkT(this._hass, s.name);
    f.computeHelper = (s) => (s.name === 'auto_discover' ? rkT(this._hass, 'discovery_hint') : undefined);
    f.addEventListener('value-changed', (ev) => onChange(ev.detail.value || {}));
    return f;
  }

  _formData() {
    const data = { ...RK_DEFAULTS, ...this._config };
    data.accent_fallback = rkRgbArray(data.accent_fallback);
    return data;
  }

  _refresh() {
    if (!this._root) return;
    const h = this._hass;
    this._prevLabel.textContent = rkT(h, 'preview');
    this._tabBtns.content.textContent = rkT(h, 'tab_content');
    this._tabBtns.actions.textContent = rkT(h, 'tab_actions');
    this._tabBtns.design.textContent = rkT(h, 'tab_design');
    this._sizeTitle.textContent = rkT(h, 'group_sizes');
    this._lookTitle.textContent = rkT(h, 'group_look');
    this._orderTitle.textContent = rkT(h, 'order_title');
    this._orderHint.textContent = rkT(h, 'order_hint');
    this._resetLabel.textContent = rkT(h, 'reset');

    const data = this._formData();
    [[this._contentForm, rkContentSchema(h)], [this._actionForm, rkActionSchema()], [this._lookForm, rkLookSchema(h)]].forEach(([f, schema]) => {
      f.hass = h;
      f.data = data;
      f.schema = schema;
    });

    this._maybeMaterialize();
    this._refreshTabs();
    this._refreshSteppers();
    this._renderOrder();
    this._updatePreview();
  }

  _refreshTabs() {
    Object.keys(this._panes).forEach((t) => {
      this._panes[t].hidden = t !== this._tab;
      this._tabBtns[t].classList.toggle('active', t === this._tab);
    });
  }

  _stepValue(def) {
    const raw = this._config[def.key];
    const v = raw === undefined ? RK_DEFAULTS[def.key] : parseFloat(raw);
    return def.scale ? Math.round(v * def.scale) : v;
  }

  _setStep(def, v) {
    if (isNaN(v)) {
      this._refreshSteppers();
      return;
    }
    v = Math.min(def.max, Math.max(def.min, v));
    v = +(Math.round(v / def.step) * def.step).toFixed(2);
    const stored = def.scale ? +(v / def.scale).toFixed(3) : v;
    this._fireConfig({ ...this._config, [def.key]: stored });
    this._refreshSteppers();
  }

  _refreshSteppers() {
    const h = this._hass;
    RK_STEPPERS.forEach((def) => {
      const s = this._steppers[def.key];
      s.label.textContent = rkT(h, def.key === 'bg_tint' ? 'bg_tint_pct' : def.key);
      if (def.theme && this._config[def.key] === undefined) {
        s.input.value = '';
        s.input.placeholder = rkT(h, 'theme');
      } else {
        s.input.value = String(this._stepValue(def));
      }
      const len = Math.max(2, (s.input.value || s.input.placeholder || '').length);
      s.input.style.width = `${len + 0.4}ch`;
    });
  }

  _updatePreview() {
    if (!this._prevCard) return;
    const c = this._config || {};
    if (!c.area && !c.name) {
      this._prevWrap.hidden = true;
      return;
    }
    this._prevWrap.hidden = false;
    try {
      this._prevCard.setConfig({ ...c, haptics: false });
    } catch (e) {
      this._prevWrap.hidden = true;
      return;
    }
    if (this._hass) this._prevCard.hass = this._hass;
  }

  /* Pre-fill the pickers when the editor opens with an area but no entities
     yet (e.g. a freshly added card). Runs once per area. */
  _maybeMaterialize() {
    const c = this._config;
    if (!this._hass || !c.area || c.auto_discover === false) return;
    if (RK_ENTITY_KEYS.some((k) => c[k])) return;
    if (this._matForArea === c.area) return;
    const config = this._fillDiscovery({ ...c });
    if (RK_ENTITY_KEYS.some((k) => config[k])) {
      this._fireConfig(config);
      const data = this._formData();
      [this._contentForm, this._actionForm, this._lookForm].forEach((f) => { f.data = data; });
    }
  }

  _currentOrder() {
    const raw = Array.isArray(this._config.chip_order) ? this._config.chip_order : [];
    const clean = raw.filter((k) => RK_CHIP_ORDER_DEFAULT.includes(k));
    RK_CHIP_ORDER_DEFAULT.forEach((k) => {
      if (!clean.includes(k)) clean.push(k);
    });
    return clean;
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
