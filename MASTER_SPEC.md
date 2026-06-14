# NightShade — Master Specification

> A precision screen filter for Android. Not a wellness app. Not a meditation tool. A light control instrument.


## 1. What It Is

NightShade places a colored, semi-transparent overlay on top of the entire Android display using the system-level `WindowManager`. The overlay persists across apps, survives device rotation, and can run beyond the screen's minimum brightness by stacking multiple transparent layers on top of each other.

The user picks a color (amber for sleep, red for astronomy, blue for focus — or any of 18 built-in presets), sets an opacity from 0% to 180%, and the overlay dims or tints everything on screen in real time.

That is the entire product. One job. Done precisely.


## 2. Core Technical Fact

**How extended brightness works:** Android `WindowManager` views support `alpha` from 0.0 to 1.0. That caps a single overlay at 100% dim. NightShade creates a **second overlay** on top of the first when the user sets opacity above 1.0. At 180% (the safety cap), two full-black overlays stack: the primary at `alpha=1.0` and the secondary at `alpha=0.8`. This produces a combined opacity that goes far below what the system brightness slider can achieve, without root access.

**Safety mechanism:** `MAX_SAFE_OPACITY = 1.80`. Every code path — slider, notification buttons, floating bubble, quick tile — clamps to this value. An emergency reset broadcast (`ACTION_EMERGENCY_RESET`) drops the overlay to 50% and re-enables it if the user gets locked out.

**Touch pass-through:** The overlay uses `FLAG_NOT_TOUCHABLE` and `FLAG_NOT_TOUCH_MODAL` so taps pass through to the app underneath. The user never loses the ability to interact with their device, even at maximum dim.


## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Native Layer                  │
│                                                      │
│  HomeScreen ──► OverlayStateStore ◄── SettingsScreen │
│                     │          ▲                      │
│  PresetsScreen ─────┘          │                      │
│                     │          │                      │
│            OverlayService.ts ──┘                      │
│              (NativeModules bridge)                   │
└────────────────────────┬─────────────────────────────┘
                         │ @ReactMethod calls
┌────────────────────────▼─────────────────────────────┐
│                   Kotlin Native Layer                 │
│                                                      │
│  OverlayModule.kt ──► OverlayService.kt              │
│       │                    │                          │
│       │              WindowManager overlay            │
│       │              (primary + secondary views)      │
│       │                                               │
│       ├──► FloatingBubbleService.kt                   │
│       ├──► PrivacyOverlayService.kt                   │
│       └──► FilterTileService.kt                       │
│                                                      │
│  BootReceiver.kt ──► Restores overlay after reboot   │
└──────────────────────────────────────────────────────┘
```

**State flow:**
1. User moves slider on `HomeScreen`
2. `OverlayStateStore.setOpacity()` checks overlay permission, clamps to 1.80
3. Calls `NativeModules.OverlayModule.updateOverlay()`
4. `OverlayModule` sends intent to `OverlayService` (foreground service)
5. `OverlayService` updates the `WindowManager` view(s)
6. `OverlayService` persists state to `SharedPreferences`
7. `OverlayModule` emits `NightShadeStateUpdate` device event
8. All subscribers (HomeScreen, bubble, notification) re-render

**Single source of truth:** `OverlayStateStore` on the JS side. Every screen reads from it. Every screen writes through it. No screen holds independent overlay state.


## 4. Design System — Void Architecture

One palette. Dark. No light mode.

### 4.1 Colors

| Token | Hex | Role |
|---|---|---|
| `voidBlack` | `#08090B` | Deepest background. Never pure `#000` |
| `voidDeep` | `#0D0F14` | Card surface |
| `voidMid` | `#14171F` | Elevated card |
| `voidRim` | `#1C2030` | Border, separator |
| `voidGhost` | `#2A2E3E` | Muted surface, input fields |
| `textPrimary` | `#F0F2F7` | Main text. Never pure `#FFF` |
| `textSecondary` | `#8A90A8` | Subtext, labels |
| `textMuted` | `#4A5068` | Disabled, hint text |
| `accentAmber` | `#E8A040` | Primary accent |
| `accentAmberDim` | `#A86820` | Secondary accent state |
| `accentIce` | `#5BB8D4` | Cool accent, contrast pair |
| `statusOn` | `#3DDC84` | Filter active (Android green) |
| `statusOff` | `#4A5068` | Filter inactive |
| `danger` | `#E85540` | Emergency reset, warnings |

Rules:
- No raw hex in any component file. All colors come from `theme/index.ts` tokens.
- Surfaces are solid matte. No glassmorphism, no `backdrop-filter: blur()`, no frosted panels.
- Elevation is expressed through a single shadow layer, never stacked.
- No gradients on any surface. No gradient text. No neon outlines.

### 4.2 Typography

Font family: Inter. Fallback chain: SF Pro Display (iOS) → Roboto (Android).

| Role | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| `displayXl` | 64 | 300 | -1.5px | Brightness percentage number |
| `displayLg` | 48 | 300 | -1.0px | Large metric display |
| `heading1` | 28 | 500 | -0.3px | Screen titles |
| `heading2` | 20 | 500 | 0 | Card headers, section labels |
| `bodyLg` | 16 | 400 | 0 | Primary body copy |
| `bodySm` | 13 | 400 | 0.1px | Secondary body, descriptions |
| `labelLg` | 12 | 600 | 0.8px | ALL CAPS labels, category tags |
| `labelSm` | 11 | 500 | 0.5px | Annotation, units |
| `monoNum` | 18 | 500 | -0.2px | Number readouts (monospace) |

Rules:
- Percentage values always use `displayXl`. They are the hero of the home screen.
- Section labels use `labelLg` in ALL CAPS with `textMuted` color.
- Never bold body copy for emphasis. Use `textSecondary` vs `textPrimary` contrast instead.
- Slider tick marks (0%, 100%, 180%) use `labelSm` in `textMuted`.

### 4.3 Spacing

8dp grid. All spacing is a multiple of 4dp.

| Token | Value | Typical Use |
|---|---|---|
| `s1` | 4dp | Hairline gaps |
| `s2` | 8dp | Tight inner padding |
| `s3` | 12dp | Compact spacing |
| `s4` | 16dp | Default inner padding |
| `s6` | 24dp | Card padding, section padding |
| `s8` | 32dp | Section separation |
| `s10` | 40dp | Large separation |
| `s12` | 48dp | Major vertical rhythm |
| `s16` | 64dp | Full-screen section height |

### 4.4 Shape

| Token | Value | Use |
|---|---|---|
| `radiusXs` | 4dp | Small elements |
| `radiusSm` | 8dp | Buttons |
| `radiusMd` | 12dp | Cards |
| `radiusLg` | 16dp | Standard card, top corners of zone 2 |
| `radiusXl` | 24dp | Large pill, action cards |
| `radiusPill` | 9999dp | Toggle track, chips, STOP button |

### 4.5 Elevation

Two shadow levels. Never stack both on the same surface.

```
elevation1: 0px 2px 8px rgba(0,0,0,0.35)
elevation2: 0px 4px 16px rgba(0,0,0,0.45)
```


## 5. Screens

### 5.1 HomeScreen

The signature screen. Two zones, no scrolling in zone 1.

**Zone 1 — Command Strip (top 40%)**

```
┌─────────────────────────────────────────┐
│ NIGHTSHADE              [○ moon/sun]    │  ← brand label (labelLg, muted) + circle toggle (48×48)
│                                         │
│ 72                                      │  ← displayXl, weight 300
│ %                                       │  ← heading2
│                                         │
│ FILTER ACTIVE                           │  ← labelLg, statusOn green
│ Cinema · Orange & Teal                  │  ← bodyLg, textSecondary
│                                         │
│              [ STOP ]                   │  ← danger pill button
└─────────────────────────────────────────┘
```

Background: **Live Canvas** — the current filter color blended at current opacity over `voidBlack`. Computed by `blendFilterOverBlack(color, opacity)`, clamped to 0.60 opacity for the background so text stays readable. Updates every frame. When the filter is off, background is plain `voidBlack`.

**Zone 2 — Controls (bottom 60%)**

Rounded top corners (`radiusLg`), scrollable, `voidBlack` background. Contains four sections:

1. **Brightness Control** — "DIM LEVEL" label + percentage value. Full-width slider (0–1.80, step 0.01). Three tick marks below: 0%, 100%, 180%.

2. **Filter Strip** — Horizontal scroll of 8 color chips (48×48 circles). Each shows the actual filter color. Selected chip gets a `voidRim` border. Last chip is "+" for custom color picker. Long-press shows tooltip with name and hex.

3. **Presets Row** — "PRESETS" label. Horizontal scroll of preset cards (80×100dp). Each card: color swatch on top (64px tall), name below in `bodySm`. Active preset gets `accentAmber` border. Shows first 12 presets.

4. **Quick Actions** — Three pill buttons in a row: "Night Reading", "Sleep", "Custom". Equal width, `voidMid` background, `voidRim` border.

### 5.2 PresetsScreen

2-column grid of filter cards.

```
┌───────────────┐ ┌───────────────┐
│               │ │               │
│  COLOR SWATCH │ │  COLOR SWATCH │
│  (60% height) │ │  (60% height) │
│───────────────│ │───────────────│
│ PRESET NAME   │ │ PRESET NAME   │
│ 20% · Cinema  │ │ 48% · Cinema  │
└───────────────┘ └───────────────┘
```

- Card width: `(screenWidth - 48dp) / 2`, height: `160dp`
- Swatch fills top 60%, rounded top corners only
- Name: `bodySm`, weight 500, white
- Opacity + Category: `labelSm`, `textMuted`
- Selected: `accentAmber` 2dp border

**Category filter row** at top: horizontally scrollable pills — All, Cinema, Clarity, Warm, Deep, Cool, Custom. Each pill shows category label + count. Active pill: `accentAmber` background. Default: All.

### 5.3 SettingsScreen

Clean grouped list. No card wrappers. Sections separated by 32dp vertical space + 1px `voidRim` separator.

| Section | Settings |
|---|---|
| APPEARANCE | Theme picker (System / Light / Dark) |
| OVERLAY CONTROLS | Floating Bubble toggle, Notification Controls toggle |
| PRIVACY | Privacy Filter toggle, Density selector (Subtle / Standard / Strong), Wall Opacity slider (40%–90%) |
| STARTUP | Start on Boot, Restore Previous Filter |
| ADVANCED | OEM battery guides (Samsung, Xiaomi, Oppo, Vivo, Huawei), Open Battery Settings, Check Overlay Permission |
| ABOUT | Version info |

Each setting row: label left (`bodyLg`, `textPrimary`), control right (toggle or chevron). Minimum 52dp height. Tap ripple: `voidGhost`.

### 5.4 CreateFilterScreen

Color picker with the new design tokens applied. No glassmorphism or gradient decoration. Saves custom presets to AsyncStorage.

### 5.5 PermissionScreen (Onboarding)

Single sentence: "NightShade draws a color filter over your screen. It needs permission to appear over other apps." That is the entire explanation. One button to open system overlay permission settings.


## 6. Filter Presets

18 built-in presets across 5 categories. Each has: name, hex color, opacity (0.0–1.80), category, description (max 80 chars).

### Cinema (6)

| Preset | Color | Opacity | Description |
|---|---|---|---|
| Orange & Teal | `#C45B1A` | 0.20 | Hollywood color grade. Warm highlights, teal-shifted shadows. |
| Cinematic Black | `#050B18` | 0.48 | Dark viewing room simulation. Crushes blacks, lifts perceived contrast. |
| Anamorphic Night | `#0A1428` | 0.35 | Simulates anamorphic lens rendering. Deep blue cast in shadow zones. |
| Kodak Vision3 250D | `#D4A855` | 0.18 | Daylight film stock. Golden-amber midtones, lifted shadow floor. |
| Blade Runner Amber | `#C45000` | 0.40 | High-opacity amber. Atmospheric haze. Designed for late-night reading. |
| Noir Veil | `#0F0F12` | 0.58 | Near-black neutral. Maximum shadow depth. Classic film noir light ratio. |

### Clarity (3)

| Preset | Color | Opacity | Description |
|---|---|---|---|
| 4K Reference | `#1A2840` | 0.10 | Minimal cool overlay. Increases perceived micro-contrast. Near-transparent. |
| 8K HDR | `#12182E` | 0.12 | Deep indigo shadow boost. Simulates HDR expanded shadow range. |
| Arctic Monitor | `#C8E8FF` | 0.12 | Ice-cold white point. Reduces perceived amber cast on warm displays. |

### Warm (4)

| Preset | Color | Opacity | Description |
|---|---|---|---|
| Night Reading | `#FFB74D` | 0.35 | Amber-shifted for melatonin preservation. 2700K equivalent. |
| Sleep Mode | `#FF6A40` | 0.55 | Deep orange. Eliminates blue spectrum for sleep preparation. |
| Golden Hour | `#FFB03A` | 0.22 | Magic-hour photography warmth. Flattering on all display types. |
| Tobacco | `#C8903A` | 0.18 | Vintage Fujifilm warmth. Slightly desaturated amber cast. |

### Deep (3)

| Preset | Color | Opacity | Description |
|---|---|---|---|
| Ultra Dark | `#000000` | 0.65 | Single-layer maximum dim. Near-off state for dark adaptation. |
| Midnight Oil | `#0A0505` | 1.10 | Dual-layer extreme dim. For dark-adapted eyes only. Red-tinted void. |
| Observatory | `#1A0000` | 0.80 | Deep red-black. Preserves scotopic vision for stargazing. |

### Cool (2)

| Preset | Color | Opacity | Description |
|---|---|---|---|
| Focus Mode | `#5BB8D4` | 0.12 | Subtle cool tint that promotes alertness and concentration. |
| Red Light | `#D32F2F` | 0.40 | Deep red filter for astronomy and night vision preservation. |


## 7. Privacy Filter

A software approximation of a hardware micro-louver privacy screen.

**How it works:** A `Canvas` view draws a repeating horizontal stripe pattern — N pixels of full transparency (gap rows) followed by 1 pixel of semi-opaque black (wall rows). When viewed head-on, the pattern is nearly invisible. When viewed from an oblique angle (>30 degrees), the black wall rows merge optically with the transparent gaps due to the non-zero viewing angle and pixel substructure, reducing side-angle readability by approximately 30–50%.

**Density modes:**

| Mode | Gap rows | Wall rows | Head-on effect | Side effect |
|---|---|---|---|---|
| Subtle | 4px | 1px | ~7% light reduction | Moderate side blocking |
| Standard | 2px | 1px | ~17% light reduction | Good side blocking |
| Strong | 1px | 1px | ~25% light reduction | Strong side blocking |

Default: Standard. Wall opacity slider: 40%–90%.

Implementation: `PrivacyOverlayService.kt` creates a tiled `BitmapShader` from a 1×pitch pixel bitmap, rendered with hardware acceleration (`LAYER_TYPE_HARDWARE`). This is efficient and does not re-allocate on each frame.

Limitation note shown in UI: "Software approximation only. Effect varies with ambient lighting and distance."


## 8. Android Services

| Service | Type | Purpose |
|---|---|---|
| `OverlayService` | Foreground (specialUse) | Main filter overlay. Persistent notification required. |
| `FloatingBubbleService` | Foreground (specialUse) | Draggable bubble for quick brightness control. |
| `FilterTileService` | Quick Settings Tile | Toggle filter from notification shade. |
| `BootReceiver` | BroadcastReceiver | Restores overlay after device reboot. |

**Permissions:** `SYSTEM_ALERT_WINDOW`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `RECEIVE_BOOT_COMPLETED`, `INTERNET`.

**Notification:** Shows filter status (Active/Inactive/Paused), brightness percentage, and preset quick-buttons (25%, 50%, 100%). Uses `ic_stat_nightshade` white silhouette icon. Channel: `nightshade_filter_channel`, importance low, silent.

**Floating bubble:** 56dp draggable circle with the iris mark icon. Expands to a panel (240×320dp) with a brightness SeekBar (0–180) and preset buttons. Panel background: `voidDeep (#0D0F14)`. Text: `textPrimary (#F0F2F7)`.


## 9. Icon System — The Iris Filter

The app icon is a camera iris aperture, partially closed. Not a moon, not a sun, not an eye.

**Foreground:** Aperture blades as geometric arcs in `voidGhost (#2A2E3E)`. Center opening: radial gradient from `accentAmber (#E8A040)` to `voidBlack (#08090B)`. One thin arc segment in `#FFD580` (light gold) traces 40 degrees at the upper-right — the only glow element, and it is crisp, not blurred.

**Background:** Solid `voidBlack (#08090B)`.

**Safe zone:** Mark fits within a 66dp diameter circle centered in the 108dp artboard. The outer 21dp on each side is the bleed zone.

| Asset | Size | Format | Use |
|---|---|---|---|
| `ic_launcher_foreground.xml` | 108dp | VectorDrawable | Adaptive icon foreground |
| `ic_launcher_background.xml` | — | Shape (solid `#08090B`) | Adaptive icon background |
| `ic_launcher.xml` | — | Adaptive-icon | Android 8+ launcher |
| `ic_launcher_round.xml` | — | Adaptive-icon | Round launcher variant |
| `ic_stat_nightshade.xml` | 24dp | VectorDrawable (white only) | Notification bar icon |
| `ic_tile_filter.xml` | 24dp | VectorDrawable (white only) | Quick settings tile |
| `ic_bubble_nightshade.xml` | 48dp | VectorDrawable (full color) | Floating bubble |
| `ic_notification.xml` | 24dp | VectorDrawable (white only) | Notification expanded view |

Legacy PNGs exist in all mipmap folders (mdpi through xxxhdpi) for Android < 8.0 compatibility.


## 10. State Persistence

| What | Where | When |
|---|---|---|
| Overlay enabled/opacity/color | `SharedPreferences` (Kotlin) | Every state change |
| Overlay enabled/opacity/color/presetId | `AsyncStorage` (JS) | Debounced 300ms after change |
| Built-in presets | `AsyncStorage` | First app launch (seeded) |
| Custom presets | `AsyncStorage` | Created/deleted by user |
| Privacy filter density/opacity | `AsyncStorage` | Changed by user |
| Boot restore | `SharedPreferences` → `OverlayService` | `BOOT_COMPLETED` broadcast |

**Preset ID format:** `ns_builtin_{index}_{slugified_name}` for built-in presets, `ns_custom_{timestamp}_{slugified_name}` for user-created. Migration maps handle legacy ID formats (`builtin_2`, `preset_builtin_2`, `preset-builtin_2`).

**Deduplication:** `StorageService.getPresets()` uses a `Set<string>` to filter duplicate IDs on read, preventing React key warnings from concurrent storage access.


## 11. Permission Enforcement

Three layers prevent the filter from silently failing when the user revokes overlay permission:

1. **OverlayStateStore** — `setEnabled()`, `setOpacity()`, `applyPreset()` all check `hasOverlayPermission()` before calling native. Return `false` if denied.

2. **UI Alert** — When a store method returns `false`, the calling screen shows an Alert with "Open Settings" button that links to the system overlay permission screen.

3. **AppState Hook** — `useOverlayPermission` monitors `AppState` changes. When the app returns to foreground, it re-checks permission. If lost, it disables the overlay and shows the permission prompt.

Error message format: "Overlay permission required. Open Settings → Apps → NightShade → Permissions." Specific. Actionable. No vague "permission needed" messages.


## 12. Copy Style Guide

**Use specific numbers, not vague labels:**
- "72% dim · Night Reading" not "Strong · Active"

**Use plain verbs, not marketing verbs:**
- "Apply preset" / "Clear filter" / "Set opacity" not "Activate" / "Unlock" / "Enable your night experience"

**Error messages say what happened and what to do:**
- "Overlay permission required. Open Settings → Apps → NightShade → Permissions." not "Permission needed to continue."

**Empty states are honest:**
- "No custom presets yet. Tap + to create one." not "Your preset collection is empty — let's get started!"

**Forbidden:**
- Emoji in UI labels or section headers
- Buzzwords: "unlock", "supercharge", "streamline", "seamless", "effortless", "powerful"
- Gradient text
- Neon outlines


## 13. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85.3 |
| Language (JS) | TypeScript |
| Language (Native) | Kotlin |
| Navigation | @react-navigation/native 7.2.5 |
| Slider | @react-native-community/slider 5.2.0 |
| Icons | react-native-vector-icons 10.3.0 (MaterialCommunityIcons) |
| Storage | @react-native-async-storage/async-storage 3.1.1 |
| Engine | Hermes |
| Architecture | New Architecture (Fabric + TurboModules) |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 36 (Android 16) |
| Build | Gradle 8.13, JDK 21, NDK 27.1 |
| Splash | androidx.core:core-splashscreen 1.0.1 |


## 14. File Structure

```
ScreenFilterApp/
├── android/app/src/main/
│   ├── java/com/screenfilterapp/
│   │   ├── MainActivity.kt                  ← Splash + edge-to-edge
│   │   ├── MainApplication.kt               ← ReactNativeHost
│   │   ├── overlay/
│   │   │   ├── OverlayService.kt            ← Main filter engine
│   │   │   ├── OverlayModule.kt             ← React Native bridge
│   │   │   ├── FloatingBubbleService.kt     ← Quick control bubble
│   │   │   └── PrivacyOverlayService.kt     ← Micro-louver privacy
│   │   ├── tile/
│   │   │   └── FilterTileService.kt         ← Quick settings tile
│   │   └── receiver/
│   │       └── BootReceiver.kt              ← Restore on reboot
│   ├── res/
│   │   ├── drawable/                        ← VectorDrawables (icons)
│   │   ├── mipmap-anydpi-v26/               ← Adaptive icons
│   │   ├── mipmap-{hdpi,mdpi,...}/          ← Legacy PNG icons
│   │   ├── layout/                          ← Notification expanded layout
│   │   └── values/                          ← colors.xml, strings.xml, styles.xml
│   └── AndroidManifest.xml
├── src/
│   ├── theme/
│   │   ├── index.ts                         ← Void Architecture design system
│   │   └── colors.ts                        ← Color mode utilities
│   ├── types/
│   │   └── index.ts                         ← TypeScript interfaces
│   ├── utils/
│   │   └── helpers.ts                       ← blendFilterOverBlack, hexToRgb, etc.
│   ├── services/
│   │   ├── OverlayStateStore.ts             ← Single source of truth
│   │   ├── OverlayService.ts                ← Native bridge wrapper
│   │   ├── StorageService.ts                ← AsyncStorage persistence
│   │   └── PrivacyFilterService.ts          ← Privacy filter bridge
│   ├── context/
│   │   └── ThemeContext.tsx                  ← Theme provider
│   ├── hooks/
│   │   └── useOverlayPermission.ts          ← Permission guard hook
│   ├── screens/
│   │   ├── HomeScreen.tsx                   ← Command Strip + Controls
│   │   ├── PresetsScreen.tsx                ← 2-column grid
│   │   ├── SettingsScreen.tsx               ← Grouped settings
│   │   ├── CreateFilterScreen.tsx           ← Custom preset editor
│   │   └── PermissionScreen.tsx             ← Onboarding
│   ├── components/
│   │   └── AppComponents.tsx                ← Shared UI components
│   └── navigation/
│       └── AppNavigator.tsx                 ← Bottom tab navigator
├── NIGHTSHADE_REVAMP_PROMPT.md              ← Revamp specification
├── APP_DEFINITION.md                        ← Previous spec document
└── package.json
```


## 15. Landing Page Reference

For anyone building a web landing page for NightShade, here are the rules:

### Palette

Use the Void Architecture tokens directly. No invented colors.

| CSS Variable | Value | Use On Web |
|---|---|---|
| `--void-black` | `#08090B` | Page background |
| `--void-deep` | `#0D0F14` | Card backgrounds |
| `--void-mid` | `#14171F` | Elevated surfaces |
| `--void-rim` | `#1C2030` | Borders |
| `--void-ghost` | `#2A2E3E` | Muted backgrounds |
| `--text-primary` | `#F0F2F7` | Headings, body |
| `--text-secondary` | `#8A90A8` | Subtext |
| `--text-muted` | `#4A5068` | Labels, captions |
| `--accent-amber` | `#E8A040` | Primary CTA, links, highlights |
| `--accent-ice` | `#5BB8D4` | Secondary accent |
| `--status-on` | `#3DDC84` | "Active" indicators |
| `--danger` | `#E85540` | Destructive actions |

### Typography

```css
--font-primary: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

| Class | Size | Weight | Tracking |
|---|---|---|---|
| `.display-xl` | 64px | 300 | -1.5px |
| `.display-lg` | 48px | 300 | -1px |
| `.heading-1` | 28px | 500 | -0.3px |
| `.heading-2` | 20px | 500 | 0 |
| `.body-lg` | 16px | 400 | 0 |
| `.body-sm` | 13px | 400 | 0.1px |
| `.label-lg` | 12px | 600 | 0.8px |
| `.label-sm` | 11px | 500 | 0.5px |

### What to Show

**Hero section:**
- The big percentage number (64px, weight 300) — "72%" — on the void-black background
- One line underneath: "Precision screen dimming. 0% to 180%."
- A single amber CTA button: "Download"
- A device mockup or screenshot showing the amber-tinted filter over a dark screen

**Feature blocks (3 maximum):**
1. "Cinema Presets" — Show 3 color swatches (Orange & Teal, Blade Runner Amber, Noir Veil). One line each.
2. "Extended Dimming" — "Dual-layer overlay goes below minimum brightness. Up to 180% dim without root."
3. "Privacy Filter" — "Software micro-louver reduces side-angle readability. No hardware protector needed."

**Preset showcase:**
- A horizontal row of the 18 preset color swatches. No icons, no descriptions. Just the colors and names. Clean grid.

**Footer:**
- App name "NIGHTSHADE" in `labelLg`, ALL CAPS, `textMuted`
- Minimal links: GitHub, Privacy Policy, Contact
- No social media icons. No newsletter signup. No "Made with love."

### What Not to Show

- No purple-to-blue gradients. Not on any surface.
- No frosted glass / glassmorphism cards.
- No glowing blobs, radial light leaks, or halo decorations.
- No feature grids with icons and three-word labels.
- No hero cards with toggle + subtitle + percentage centered.
- No floating rounded cards over a gradient background.
- No shadow stacking (more than one shadow per element).
- No buzzwords: "unlock", "seamless", "effortless", "powerful".
- No emoji in headings or labels.
- No gradient text.
- No neon outlines.
- No illustration of a person meditating, sleeping, or holding a phone.
- No testimonial carousel.
- No pricing table (the app is free).

### Motion

- Subtle. Fade-in on scroll, nothing bouncing or sliding.
- The only animated element on the page: the big percentage number could count up from 0 to 72 on load, taking about 1.5 seconds. That's it.
- Hover states: amber underline on links, slight brightness shift on buttons. No scale transforms or shadows appearing on hover.


## 16. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | — | Initial release: basic overlay, brightness slider, color picker |
| 2.0 | — | Extended brightness (0–200%), floating bubble, notification slider, boot restore |
| 3.0 | 2025-06 | Void Architecture redesign, cinema presets (18), privacy filter, iris icon system, safety cap (180%), emergency reset, permission enforcement |
