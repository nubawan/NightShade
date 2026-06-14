# NightShade — App Definition & UI Reference

## 1. App Overview

**NightShade** is a professional Android screen filter application built with React Native and native Kotlin services. It draws translucent color overlays on top of the entire screen to reduce brightness, filter blue light, and apply cinematic color grading effects. The app supports extended brightness dimming up to 180% (beyond the system's 100% maximum) using a multi-layer overlay technique.

| Property | Value |
|---|---|
| Package | `com.screenfilterapp` |
| Version | 3.0.0 |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 36 (Android 16) |
| Framework | React Native + Kotlin Native Bridge |
| Architecture | V5 — OverlayStateStore as single source of truth |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Native JS Layer                  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  HomeScreen  │  │ PresetsScreen │  │ SettingsScreen │  │
│  │  (V5, Store) │  │              │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│         └─────────┬───────┴───────────┬──────┘          │
│                   ▼                   ▼                  │
│         ┌─────────────────┐  ┌──────────────────┐       │
│         │ OverlayStateStore│  │ StorageService    │       │
│         │ (Singleton)      │  │ (AsyncStorage)    │       │
│         └────────┬─────────┘  └──────────────────┘       │
│                  │                                       │
│         ┌────────▼─────────┐                             │
│         │ OverlayService.ts │ (JS Bridge)                │
│         │ clamp 0–1.80     │                             │
│         └────────┬──────────┘                             │
│                  │ NativeModules.OverlayModule            │
└──────────────────┼───────────────────────────────────────┘
                   │ React Native Bridge
┌──────────────────┼───────────────────────────────────────┐
│                  ▼    Kotlin Native Layer                  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                   OverlayModule.kt                    │ │
│  │   @ReactMethod bridge — clamps to MAX_SAFE_OPACITY   │ │
│  │   Emits NightShadeStateUpdate via DeviceEventEmitter │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │                OverlayService.kt                     │ │
│  │   Foreground Service — WindowManager overlay         │ │
│  │   MAX_SAFE_OPACITY = 1.80f (180%)                   │ │
│  │   Multi-layer: primary (0–1.0) + secondary (>1.0)   │ │
│  │   Emergency reset: ACTION_EMERGENCY_RESET → 0.5f    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │             FloatingBubbleService.kt                 │ │
│  │   SeekBar 0–180, quick presets, drag-to-move         │ │
│  │   START_STICKY with auto-restart on task removal     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              FilterTileService.kt                    │ │
│  │   Quick Settings Tile — toggle filter from shade     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               BootReceiver.kt                        │ │
│  │   Restores overlay state after device reboot         │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Key Architecture Principles

1. **OverlayStateStore (V5)**: Single source of truth for all overlay state. All UI surfaces (Home, Bubble, Notification, Tile) subscribe to this store. Changes from any source propagate to all listeners via the `NightShadeStateUpdate` event bridge.

2. **Multi-Layer Overlay**: For brightness above 100%, a second overlay View is stacked on top of the first. Primary overlay alpha = `min(opacity, 1.0)`, secondary overlay alpha = `max(0, opacity - 1.0)`.

3. **Safety Cap (180%)**: Brightness is capped at 180% (not 200%) to prevent screen lockout. At 200% opacity, the screen becomes almost completely black and users cannot interact with the device to reduce brightness.

4. **Emergency Reset**: If a user does get stuck at high brightness, the `ACTION_EMERGENCY_RESET` action instantly reduces opacity to 50% and re-enables the overlay.

---

## 3. UI Screens & Components

### 3.1 Screen Map

| Screen | File | Tab | Description |
|---|---|---|---|
| HomeScreen | `src/screens/HomeScreen.tsx` | Home | Main filter control — hero toggle card, brightness slider (0–180%), color quick select, quick presets |
| PresetsScreen | `src/screens/PresetsScreen.tsx` | Presets | Manage filter presets — create, edit, delete, apply |
| SettingsScreen | `src/screens/SettingsScreen.tsx` | Settings | App settings — theme, overlay behavior, battery optimization, about |
| CreateFilterScreen | `src/screens/CreateFilterScreen.tsx` | Modal | Create/edit a custom filter preset with color picker |
| PermissionScreen | `src/screens/PermissionScreen.tsx` | Flow | Overlay permission onboarding |
| SplashScreen | `src/screens/SplashScreen.tsx` | Launch | Android 12+ splash screen |

### 3.2 HomeScreen Layout

```
┌────────────────────────────────────┐
│  🌙 NightShade              [SW]   │  ← Hero Toggle Card
│  Active · Sleep Mode               │     (scales on toggle)
│────────────────────────────────────│
│  Dim Level    Filter               │
│  55% Strong   ● Deep Orange        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  🔆 Brightness          55%  Strong│  ← BrightnessCard
│────────────────────────────────────│     (0% → 100% → 180%)
│  ☀ ──────●────────────── 🌙       │
│  0%         100%          180%     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  🎨 Filter Color                   │  ← Color Quick Select
│  [Warm] [Cool] [Neutral] [Cinema]  │
│  [AMOLED] [Red] [✏ Custom]        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Quick Presets                     │  ← Horizontal Scroll
│  [Night Reading] [Sleep Mode] ...  │
└────────────────────────────────────┘
```

### 3.3 Bottom Navigation

```
┌──────────────────────────────────────┐
│   🏠 Home    │    ⚙ Settings        │
│              │                       │
│         [＋ FAB]  ← Center Dock      │
│              │                       │
│   🎨 Presets │                       │
└──────────────────────────────────────┘
```

- Selected tab: icon + label with `secondaryContainer` background pill
- Unselected tab: icon only
- Center dock FAB: primary color, creates new filter preset

### 3.4 Floating Bubble (Native)

```
    ┌──────┐
    │  🌙  │  ← Draggable bubble (oval, night blue background)
    └──────┘
         │ tap
         ▼
┌────────────────────────┐
│ 🌙 Filter ON    📱     │  ← Mini control panel
│ Brightness: 55%        │
│ ──────●──────────      │  ← SeekBar (0–180)
│ [25%][50%][75%]        │  ← Quick presets
│ [100%][150%][180%]     │
└────────────────────────┘
```

- Auto-hides after 5 seconds of inactivity
- Long press opens the main app
- Position persists across restarts

---

## 4. Design System

### 4.1 Palette Architecture

The app uses a swappable palette system with 3 built-in palettes:

| Palette | Feel | Default |
|---|---|---|
| **Night Blue** | Premium, Technical, Midnight | Yes |
| Teal + Cyan | Modern, Clean, Tech | |
| Slate + Electric Blue | Utility, Minimal | |

Each palette provides full MD3 light + dark token sets (primary, surface, outline, error, etc.). Components consume only design tokens — never raw hex values. Palette swap requires zero component changes.

### 4.2 Spacing (8dp Grid)

| Token | dp | Use Case |
|---|---|---|
| s0 | 0 | None |
| s1 | 4 | Tight padding |
| s2 | 8 | Inner padding |
| s3 | 12 | Compact gaps |
| s4 | 16 | Standard padding |
| s5 | 20 | Section padding |
| s6 | 24 | Large gaps |
| s8 | 32 | Page padding |
| s12 | 48 | Touch targets |
| s16 | 64 | Major sections |

### 4.3 Typography Scale

| Role | Size | Weight | Line Height |
|---|---|---|---|
| Display | 57 | 400 | 64 |
| Headline | 32 | 400 | 40 |
| Title Large | 22 | 500 | 28 |
| Title Medium | 16 | 500 | 24 |
| Title Small | 14 | 500 | 20 |
| Body Large | 16 | 400 | 24 |
| Body Medium | 14 | 400 | 20 |
| Body Small | 12 | 400 | 16 |
| Label Large | 14 | 500 | 20 |
| Label Medium | 12 | 500 | 16 |
| Label Small | 11 | 500 | 16 |

### 4.4 Shape

| Token | Radius |
|---|---|
| none | 0 |
| xs | 4 |
| sm | 8 |
| md | 12 |
| lg | 16 |
| xl | 28 |
| full | 9999 |

---

## 5. Brightness System

### 5.1 Brightness Zones

| Opacity Range | Zone Label | Description |
|---|---|---|
| 0 | Off | No overlay visible |
| 0.01–0.15 | Subtle | Barely noticeable tint |
| 0.16–0.40 | Light | Comfortable dimming |
| 0.41–0.65 | Normal | Standard night mode |
| 0.66–0.85 | Strong | Aggressive dimming |
| 0.86–1.00 | Maximum | Full single-layer overlay |
| 1.01–1.25 | Ultra | Extended dimming (dual layer) |
| 1.26–1.50 | Deep | Very dark (dual layer) |
| 1.51–1.75 | Intense | Near-black (dual layer) |
| 1.76–1.80 | AMOLED Dark | Maximum safe dimming |

### 5.2 Safety Cap: 180%

Brightness is capped at **180%** (opacity = 1.80) instead of 200% for critical safety reasons:

- **At 200% opacity**, the screen is almost completely black. The overlay blocks nearly all light, making it impossible for users to see UI controls to reduce brightness.
- **At 180% opacity**, the screen is very dark but still has enough visible contrast for users to find and operate the brightness slider.
- The `FLAG_NOT_TOUCH_MODAL` flag on the overlay ensures touch events pass through to the app beneath even at high opacity.
- An **emergency reset** mechanism (`ACTION_EMERGENCY_RESET`) can instantly reduce brightness to 50% if a user gets stuck.

### 5.3 Multi-Layer Overlay Technique

```
Opacity 0.0–1.0 (0%–100%):
┌─────────────────────┐
│   Primary Overlay    │  alpha = opacity
│   (single layer)     │
└─────────────────────┘

Opacity 1.0–1.80 (100%–180%):
┌─────────────────────┐
│   Primary Overlay    │  alpha = 1.0 (fully opaque)
├─────────────────────┤
│  Secondary Overlay   │  alpha = opacity - 1.0
│  (stacked on top)    │  (0.0 → 0.80)
└─────────────────────┘
```

The secondary overlay is dynamically added/removed as brightness crosses the 100% threshold. Both overlays use `FLAG_NOT_FOCUSABLE | FLAG_NOT_TOUCHABLE | FLAG_NOT_TOUCH_MODAL` to pass through all touch events.

---

## 6. Filter Presets

### 6.1 Built-in Presets

| Name | Color | Opacity | Category |
|---|---|---|---|
| Night Reading | #FFB74D (Amber) | 35% | Warm |
| Sleep Mode | #FF8A65 (Deep Orange) | 55% | Warm |
| Reading | #FFCC80 (Gold) | 25% | Warm |
| Cinema | #1A1A2E (Navy) | 45% | Cinema |
| Film | #3E2723 (Brown) | 30% | Cinema |
| HDR Style | #1A237E (Indigo) | 12% | Cinema |
| 4K Style | #0D1B2A (Midnight) | 15% | Cinema |
| AMOLED Dark | #000000 (Black) | 50% | AMOLED |
| Neutral Dim | #1A1A1A (Dark Gray) | 40% | Neutral |
| Focus Mode | #90CAF9 (Blue) | 12% | Cool |
| Red Light | #D32F2F (Red) | 40% | Red |
| Night Vision | #B71C1C (Dark Red) | 55% | Red |

### 6.2 Quick Color Selection

Available on HomeScreen as color chips: Warm, Cool, Neutral, Cinema, AMOLED, Red, Custom (opens full color picker).

---

## 7. Permissions & Services

### 7.1 Required Permissions

| Permission | Purpose |
|---|---|
| `SYSTEM_ALERT_WINDOW` | Draw overlay on top of all apps |
| `FOREGROUND_SERVICE` | Keep overlay service running persistently |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Declare special-use foreground service (Android 14+) |
| `RECEIVE_BOOT_COMPLETED` | Restore overlay after device reboot |
| `INTERNET` | React Native dev/bundle loading |

### 7.2 Foreground Services

| Service | Notification Channel | Purpose |
|---|---|---|
| `OverlayService` | `nightshade_filter_channel` | Manages the screen filter overlay |
| `FloatingBubbleService` | `nightshade_bubble_channel` | Floating brightness control bubble |

Both services use `foregroundServiceType="specialUse"` with declared subtypes, as required by Android 14+.

---

## 8. Critical Bug Fixes (v3.0.0)

### Bug 1: BrightnessSlider capped at 100%

**File**: `src/components/BrightnessSlider.tsx`

**Problem**: `maximumValue={1}` limited the slider to 100%, while the native layer supported 0–200%.

**Fix**: Changed `maximumValue` to `1.80` and updated labels to show 0%/100%/180%. Added `getBrightnessLabel()` to the display.

### Bug 2: percentToOpacity() clamped to 1.0

**File**: `src/utils/permissions.ts`

**Problem**: `percentToOpacity()` used `Math.min(1, percent / 100)`, silently dropping any value above 100%.

**Fix**: Changed to `Math.min(2, percent / 100)` to support the full 0–180% range. Updated documentation comments.

### Bug 3: Screen becomes unusable above 100%

**File**: `OverlayService.kt`, `OverlayModule.kt`, `FloatingBubbleService.kt`

**Problem**: At 200% brightness, the overlay was so dark that users could not see or interact with the app to reduce brightness. Android also displayed a "this app is not optimized for the latest version" warning because the overlay was consuming too much of the screen without proper touch pass-through flags.

**Fix**:
- Capped `MAX_SAFE_OPACITY` at 1.80f (180%) across all layers — native, JS bridge, and UI
- Added `FLAG_NOT_TOUCH_MODAL` and `FLAG_LAYOUT_INSET_DECOR` to overlay WindowManager flags
- Added `ACTION_EMERGENCY_RESET` that instantly reduces brightness to 50%
- Updated FloatingBubbleService SeekBar max from 200 to 180
- Added `emergencyReset()` method to the React Native bridge

### Bug 4: Dashboard/Home screen inconsistency

**File**: `src/screens/DashboardScreen.tsx`

**Problem**: DashboardScreen used `BrightnessSlider` (capped at 100%) while HomeScreen used `BrightnessCard` (correctly going to 180%). The two screens were from different versions (V4 vs V5).

**Fix**: Replaced `BrightnessSlider` with `BrightnessCard` from `AppComponents.tsx` for consistent 0–180% range across all screens.

### Bug 5: "App not optimized for latest version" warning

**Files**: `AndroidManifest.xml`, `MainActivity.kt`, `OverlayService.kt`

**Problem**: Android 14+ shows this warning when an app with overlay permissions doesn't properly handle edge-to-edge display or when the overlay interferes with system UI.

**Fix**:
- Added `android:resizeableActivity="true"` and `android:hardwareAccelerated="true"` to AndroidManifest
- Added edge-to-edge display support in `MainActivity.kt` with `window.setDecorFitsSystemWindows(false)`
- Added `FLAG_NOT_TOUCH_MODAL` and `FLAG_LAYOUT_INSET_DECOR` to overlay flags so the system doesn't consider the overlay as blocking user interaction
- Proper `foregroundServiceType="specialUse"` declarations with subtype properties already in place

### Bug 6: Duplicate React keys for presets

**Files**: `src/services/StorageService.ts`, `src/types/index.ts`

**Problem**: Console showed `Encountered two children with the same key, .$preset-builtin_2`. Caused by:
1. Concurrent calls to `getPresets()` from multiple screens caused race conditions in the merge logic, duplicating built-in presets
2. Stale preset IDs in AsyncStorage from older app versions (e.g. `builtin_2` vs `ns_builtin_2_reading`) were never migrated

**Fix**:
- Added a **mutex** (`presetsLock`) to `getPresets()` so concurrent calls are serialized
- Added **ID migration** map that maps old ID formats (`builtin_2`, `preset_builtin_2`) to current canonical IDs
- Added **deduplication by ID** — after loading from storage, any duplicates are removed (keeping first occurrence)
- Merge logic now uses **ID matching** instead of name matching for built-in presets
- Added `type Preset = FilterPreset` alias in `types/index.ts` for backward compatibility with older components

### Bug 7: Overlay permission lost — app breaks silently

**Files**: `src/hooks/useOverlayPermission.ts` (new), `App.tsx`, `src/services/OverlayStateStore.ts`

**Problem**: If a user revokes the "Display over other apps" (SYSTEM_ALERT_WINDOW) permission in system settings, the app silently fails — the filter doesn't work, toggles don't respond, and the user thinks the app is broken. This is a critical UX issue that could cause users to uninstall.

**Fix**:
- Created `useOverlayPermission` hook that:
  - Checks permission on mount
  - Re-checks permission when app returns to foreground (user may have toggled it in settings)
  - Disables the overlay if permission is lost (prevents native crash)
- Integrated into `App.tsx` — when permission is lost, the entire app shows the `PermissionScreen` with instructions to re-grant
- Added permission guards in `OverlayStateStore.setEnabled()`, `setOpacity()`, and `applyPreset()` — these check `hasOverlayPermission()` before attempting any overlay action
- If permission is missing, the store updates state to `enabled: false` and notifies all subscribers instead of trying (and failing) the native call

---

## 9. File Structure

```
ScreenFilterApp/
├── android/app/src/main/
│   ├── AndroidManifest.xml
│   ├── java/com/screenfilterapp/
│   │   ├── MainActivity.kt
│   │   ├── MainApplication.kt
│   │   ├── overlay/
│   │   │   ├── OverlayService.kt      ← Core overlay engine
│   │   │   ├── OverlayModule.kt       ← React Native bridge
│   │   │   ├── OverlayPackage.kt      ← Bridge registration
│   │   │   └── FloatingBubbleService.kt ← Bubble control
│   │   ├── tile/
│   │   │   └── FilterTileService.kt   ← Quick Settings tile
│   │   └── receiver/
│   │       └── BootReceiver.kt        ← Boot restore
│   └── res/
│       ├── layout/notification_expanded.xml
│       ├── drawable/  (icons, splash)
│       └── values/styles.xml
├── src/
│   ├── App.tsx (entry → overlayStore.init())
│   ├── components/
│   │   ├── AppComponents.tsx          ← Card, Switch, BrightnessCard, BottomNav, etc.
│   │   ├── BrightnessSlider.tsx       ← Standalone brightness slider (0–180%)
│   │   ├── ColorPicker.tsx            ← HSV color picker
│   │   ├── ColorSelector.tsx          ← Color chip grid
│   │   ├── Toggle.tsx                 ← ON/OFF toggle
│   │   └── PresetCard.tsx             ← Preset list item
│   ├── screens/
│   │   ├── HomeScreen.tsx             ← Main screen (V5, uses OverlayStateStore)
│   │   ├── PresetsScreen.tsx          ← Preset management
│   │   ├── SettingsScreen.tsx         ← App settings
│   │   ├── CreateFilterScreen.tsx     ← Create/edit filter modal
│   │   ├── AdvancedSettingsScreen.tsx ← Battery optimization guides
│   │   ├── PermissionScreen.tsx       ← Permission onboarding
│   │   └── SplashScreen.tsx           ← Android 12+ splash
│   ├── services/
│   │   ├── OverlayService.ts          ← JS bridge to native
│   │   ├── OverlayStateStore.ts       ← Single source of truth
│   │   └── StorageService.ts          ← AsyncStorage wrapper
│   ├── context/
│   │   └── ThemeContext.tsx            ← Theme provider
│   ├── hooks/
│   │   └── useOverlayPermission.ts    ← Permission guard hook
│   ├── navigation/
│   │   └── AppNavigator.tsx           ← Tab navigator
│   ├── theme/
│   │   └── index.ts                   ← Design system (palettes, spacing, typography)
│   ├── types/
│   │   └── index.ts                   ← TypeScript interfaces
│   └── utils/
│       ├── helpers.ts                 ← Utility functions
│       └── permissions.ts             ← Permission helpers + opacity conversion
└── APP_DEFINITION.md                  ← This file
```

---

## 10. State Flow

```
User Action (slider/bubble/tile/notification)
         │
         ▼
┌─────────────────┐
│  OverlayStateStore │  ← JS writes here first
│  setOpacity(0.55)  │
└────────┬──────────┘
         │
         ├──► NativeModules.OverlayModule.setOpacity(0.55)
         │         │
         │         ▼
         │    OverlayService.kt
         │    ACTION_SET_BRIGHTNESS
         │    currentOpacity = 0.55f (clamped to 0–1.80)
         │    updateOverlay() → WindowManager
         │         │
         │         ▼
         │    emitStateUpdate() → DeviceEventEmitter
         │         │
         │         ▼
         │    OverlayStateStore receives NightShadeStateUpdate
         │    → notify all subscribers
         │
         ├──► storageService.saveOverlaySettings()
         │
         └──► All subscribed UI components re-render
              (HomeScreen, floating bubble label, etc.)
```

---

## 11. Emergency Recovery

If brightness is set too high and the user cannot see the screen:

1. **Pull down notification shade** → Tap the NightShade notification → Tap a preset (25%, 50%, 100%)
2. **Use Quick Settings Tile** → Toggle the filter off
3. **Emergency Reset** (programmatic): `overlayService.emergencyReset()` → instantly reduces to 50%
4. **Force stop the app** from system settings → Overlay is removed automatically
5. **Restart the device** → BootReceiver only restores if overlay was active, with safe defaults
