# NIGHTSHADE — UI/UX REVAMP MASTER PROMPT
### Prompt Authority: Claude Sonnet 4.6 → Agent: Claude Mythos 5
### Scope: Full product revamp — design system, cinema presets, privacy filter, icon system

---

## READ THIS FIRST

You are being handed a full product revamp brief for **NightShade**, an Android screen filter app built in React Native + Kotlin. The existing codebase already works. Your job is not to rebuild functionality — it is to redesign the entire face of the product so it looks and feels like a tool a professional would choose over everything else on the Play Store.

**Do not invent new features unless specified.** Revamp what exists. Add only what is explicitly described in this brief (cinema presets, privacy filter, icon system).

**Do not output code for multiple modules at once.** Execute one task at a time. Read the task, implement it fully, verify it, then move to the next. Dependencies are marked explicitly. Never skip ahead.

---

## PART 1 — DESIGN MANIFESTO

### 1.1 What This App Is Not

You are not building a startup landing page. You are not building a wellness app or a meditation tool. NightShade is a precision instrument — it controls light, and the UI should feel like the person holding it controls something real.

**Do not use any of the following:**
- Purple-to-blue gradients on any surface
- Glassmorphism: frosted panels, blurred card backgrounds, `backdrop-filter: blur()`
- Glowing blob decorations, radial light leaks, or halo effects as decoration
- Feature grids with icons and three-word labels
- Generic hero cards with toggle + subtitle + percentage in the center
- Rounded cards floating over a background gradient
- Shadow stacking (more than one shadow level per surface)
- Buzzwords in UI copy: "unlock," "supercharge," "streamline," "seamless," "effortless," "powerful"
- Emoji in UI labels or section headers
- Gradient text
- Neon outlines on anything

### 1.2 What This App Is

A precise, serious tool that does one thing extremely well. The entire UI should communicate this through:

**Restraint** — fewer elements, more breathing room. If something can be removed, remove it.

**Typography as hero** — large, authoritative type that carries the screen rather than decorating it.

**Honest copy** — say exactly what the control does. "Dim Level" not "Customize Your Experience." "72%" not "Strong." A number next to a label, always.

**Purposeful feedback** — when the filter changes, the UI responds. The screen itself is the preview.

**Depth through shadow, not transparency** — surfaces are solid matte. Elevation is expressed through shadow, not blur.

### 1.3 The Central Design Concept: The Living Canvas

The app's home screen background is not a wallpaper or a gradient. It is a **live simulation** of the current filter. When the user sets an orange filter at 45%, the entire app background adopts that exact hue and opacity mix against a pure black base. The UI elements sit on top of this live canvas.

**This is the signature feature of the redesign.** It means the app is always showing you, in real time, what your screen will look like — and the UI never fights with that because it is designed to be readable against any of the filter colors.

Implementation note: The app root view renders a `View` at z-index 0 with `backgroundColor` computed from the current filter color at the current opacity, blended over `#000000`. All UI components sit above this at z-index 1+. Typography uses colors that are always either pure white at high contrast or the specific semantic tokens defined in Section 2.

---

## PART 2 — DESIGN SYSTEM

### 2.1 Color Palette: The Void Architecture

Forget the three-palette system for the revamp. There is one palette. It is dark. It is precise. Optional light mode is a stretch goal, not a priority.

**Core Tokens:**

```
--void-black:       #08090B   /* Deepest background — never pure #000 */
--void-deep:        #0D0F14   /* Card surface */
--void-mid:         #14171F   /* Elevated card */
--void-rim:         #1C2030   /* Border / separator */
--void-ghost:       #2A2E3E   /* Muted surface, input fields */

--text-primary:     #F0F2F7   /* Main text — not pure white */
--text-secondary:   #8A90A8   /* Subtext, labels */
--text-muted:       #4A5068   /* Disabled, hint text */

--accent-amber:     #E8A040   /* Primary accent — warm, precise */
--accent-amber-dim: #A86820   /* Secondary accent state */
--accent-ice:       #5BB8D4   /* Cool accent, contrast pair to amber */

--status-on:        #3DDC84   /* Android green — filter active */
--status-off:       #4A5068   /* Filter inactive */
--danger:           #E85540   /* Emergency reset, warnings */
```

**Do not define any color outside of these tokens in any component file.** All color references in TSX/Kotlin must be from `theme/index.ts` tokens only.

### 2.2 Typography

**Font family**: Use `Inter` (Google Fonts, available via React Native). Fall back to `SF Pro Display` (iOS) / `Roboto` (Android).

Replace the existing MD3 type scale with this custom scale:

| Role | Size (sp) | Weight | Letter Spacing | Use |
|---|---|---|---|---|
| `display-xl` | 64 | 300 | -1.5px | Brightness percentage number |
| `display-lg` | 48 | 300 | -1px | Large metric display |
| `heading-1` | 28 | 500 | -0.3px | Screen titles |
| `heading-2` | 20 | 500 | 0 | Card headers, section labels |
| `body-lg` | 16 | 400 | 0 | Primary body copy |
| `body-sm` | 13 | 400 | 0.1px | Secondary body, descriptions |
| `label-lg` | 12 | 600 | 0.8px | Caps labels, filter category tags |
| `label-sm` | 11 | 500 | 0.5px | Annotation, units |
| `mono-num` | 18 | 500 | -0.2px | Number readouts (use monospace variant) |

**Typography rules:**
- Percentage values always use `display-xl` or `display-lg`. They are the hero of every card.
- Section labels use `label-lg` in ALL CAPS with `--text-muted` color.
- Never bold body copy for emphasis. Use `--text-secondary` vs `--text-primary` contrast instead.
- Slider track values (0%, 100%, 180%) use `label-sm` in `--text-muted`.

### 2.3 Spacing System

Keep the existing 8dp grid. Rename tokens for clarity:

```
space-1:  4dp
space-2:  8dp
space-3:  12dp
space-4:  16dp   /* Default inner padding */
space-5:  20dp
space-6:  24dp   /* Card padding */
space-8:  32dp
space-10: 40dp   /* Section separation */
space-12: 48dp   /* Major vertical rhythm */
space-16: 64dp   /* Full-screen section height hints */
```

### 2.4 Shape System

```
radius-0:   0dp
radius-xs:  4dp
radius-sm:  8dp
radius-md:  12dp
radius-lg:  16dp    /* Standard card */
radius-xl:  24dp    /* Large pill, action cards */
radius-pill: 9999dp /* Toggle track, chips */
```

No border glows, no shadow-on-shadow stacking. Use single shadow:
```
elevation-1: 0px 2px 8px rgba(0,0,0,0.35)
elevation-2: 0px 4px 16px rgba(0,0,0,0.45)
```

---

## PART 3 — SCREEN REDESIGNS

### 3.1 HomeScreen (`src/screens/HomeScreen.tsx`)

The current layout has four stacked cards. Replace with a **two-zone layout**:

**Zone 1 — The Command Strip (top, ~40% screen height)**

```
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│           72                               │
│           %          ← display-xl          │
│                                            │
│   FILTER ACTIVE      ← label-lg in green  │
│   Cinema · Orange Teal                     │
│                                            │
│                    [  STOP  ]              │
│                    ← pill button, danger   │
└────────────────────────────────────────────┘
```

Rules for Zone 1:
- Background IS the Live Canvas (current filter color + opacity over void-black)
- The big percentage number is left-aligned at 24dp from edge
- Font is display-xl, weight 300, color `--text-primary`
- Under it: current preset name in body-lg
- Top-right: a minimal circle toggle — 48×48dp, no label, icon only (filled when on)
- Top-left: App name "NIGHTSHADE" in label-lg, caps, muted — not a logo, just an identifier

**Zone 2 — The Controls (bottom, ~60% screen height)**

A scrollable `ScrollView` containing:

1. **Brightness Control** — A single horizontal slider, full-width. No card wrapper. Above it: two labels left-aligned: "DIM LEVEL" (label-lg, muted) and the percentage value (mono-num, primary). Below the slider: three tick marks at 0%, 100%, 180% using label-sm.

2. **Filter Strip** — A horizontally scrollable row of color chips. Each chip is a 48×48dp circle showing the actual filter color with a thin border if selected. No labels on the chips. Long-press opens chip detail tooltip with name. This replaces the existing color quick-select.

3. **Presets Row** — Label "PRESETS" in label-lg caps, then a horizontal scroll of preset cards. Each preset card is 80×100dp, showing a filled color swatch at the top and the preset name in body-sm at the bottom. No icons, no descriptions.

4. **Quick Actions Row** — Three evenly spaced pill buttons: "Night Reading," "Sleep," "Custom." These are the only text-labeled shortcuts.

### 3.2 PresetsScreen (`src/screens/PresetsScreen.tsx`)

Replace the current list with a **grid of filter cards**, 2 columns, each card being a precise rectangle:

```
┌───────────────┐ ┌───────────────┐
│               │ │               │
│  COLOR SWATCH │ │  COLOR SWATCH │
│  (60% card h) │ │  (60% card h) │
│               │ │               │
│───────────────│ │───────────────│
│ PRESET NAME   │ │ PRESET NAME   │
│ Opacity · Cat │ │ Opacity · Cat │
└───────────────┘ └───────────────┘
```

- Card size: `(screenWidth - 48dp) / 2` wide, `160dp` tall
- The color swatch fills the top 60%, rounded only at top-left and top-right (radius-lg)
- Name in body-sm, weight 500, white
- Opacity + Category in label-sm, muted
- Selected state: `--accent-amber` 2dp border on entire card

### 3.3 SettingsScreen (`src/screens/SettingsScreen.tsx`)

Clean list of settings groups. No cards per setting. Sections separated by `space-8` vertical space + a 1px `--void-rim` separator line (not a full-width divider block).

Each setting row: label on left (body-lg, primary), control on right (toggle or chevron). Rows are 52dp tall minimum. Tap ripple uses `--void-ghost`.

---

## PART 4 — CINEMA FILTER PRESETS

### 4.1 Philosophy

These are not arbitrary color choices. Each preset is derived from a real cinematographic technique or film stock. The description text used in the UI (on the preset card detail view) must be accurate and specific — not vague marketing language.

### 4.2 The Preset Library

Add these to the existing preset system. Each has: `name`, `hex color`, `opacity (0–1.0)`, `category`, `description (max 80 chars)`.

---

#### CINEMA CATEGORY

**Orange & Teal**
- Color: `#C45B1A`
- Opacity: `0.20`
- Category: `Cinema`
- Description: `"Hollywood color grade. Warm highlights, teal-shifted shadows."`
- Notes: This is the most-used film grade of the last 20 years. The orange overlay shifts skin tones warm while the inherent blue in OLED shadows creates the teal complement naturally.

**Cinematic Black**
- Color: `#050B18`
- Opacity: `0.48`
- Category: `Cinema`
- Description: `"Dark viewing room simulation. Crushes blacks, lifts perceived contrast."`

**Anamorphic Night**
- Color: `#0A1428`
- Opacity: `0.35`
- Category: `Cinema`
- Description: `"Simulates anamorphic lens rendering. Deep blue cast in shadow zones."`

**Kodak Vision3 250D**
- Color: `#D4A855`
- Opacity: `0.18`
- Category: `Cinema`
- Description: `"Daylight film stock. Golden-amber midtones, lifted shadow floor."`
- Notes: This is the stock used in many major films. Warm, slightly desaturated in a pleasing way.

**Blade Runner Amber**
- Color: `#C45000`
- Opacity: `0.40`
- Category: `Cinema`
- Description: `"High-opacity amber. Atmospheric haze. Designed for late-night reading."`

**Noir Veil**
- Color: `#0F0F12`
- Opacity: `0.58`
- Category: `Cinema`
- Description: `"Near-black neutral. Maximum shadow depth. Classic film noir light ratio."`

---

#### CLARITY CATEGORY

**4K Reference**
- Color: `#1A2840`
- Opacity: `0.10`
- Category: `Clarity`
- Description: `"Minimal cool overlay. Increases perceived micro-contrast. Near-transparent."`
- Notes: This is the "secret sauce" preset. It looks like nothing but actually shifts the perceived white point slightly cooler, which the eye interprets as sharper. Use for reading and work.

**8K HDR**
- Color: `#12182E`
- Opacity: `0.12`
- Category: `Clarity`
- Description: `"Deep indigo shadow boost. Simulates HDR expanded shadow range."`
- Notes: Very subtle. The deep blue in the overlay adds visual weight to dark areas, making them appear richer — the same perceptual trick HDR panels use.

**Arctic Monitor**
- Color: `#C8E8FF`
- Opacity: `0.12`
- Category: `Clarity`
- Description: `"Ice-cold white point. Reduces perceived amber cast on warm displays."`

---

#### WARM CATEGORY (keep existing, rename/redescribe)

**Night Reading** (existing — keep color `#FFB74D`, opacity `0.35`)
- New description: `"Amber-shifted for melatonin preservation. 2700K equivalent."`

**Sleep Mode** (existing — keep color `#FF6A40`, opacity `0.55`)
- New description: `"Deep orange. Eliminates blue spectrum for sleep preparation."`

**Golden Hour**
- Color: `#FFB03A`
- Opacity: `0.22`
- Category: `Warm`
- Description: `"Magic-hour photography warmth. Flattering on all display types."`

**Tobacco**
- Color: `#C8903A`
- Opacity: `0.18`
- Category: `Warm`
- Description: `"Vintage Fujifilm warmth. Slightly desaturated amber cast."`

---

#### DEEP CATEGORY (ultra-dim variants)

**Ultra Dark** (existing AMOLED, rename)
- Color: `#000000`
- Opacity: `0.65`
- Category: `Deep`
- Description: `"Single-layer maximum dim. Near-off state for dark adaptation."`

**Midnight Oil**
- Color: `#0A0505`
- Opacity: `1.10`  ← dual-layer territory
- Category: `Deep`
- Description: `"Dual-layer extreme dim. For dark-adapted eyes only. Red-tinted void."`

**Observatory**
- Color: `#1A0000`
- Opacity: `0.80`
- Category: `Deep`
- Description: `"Deep red-black. Preserves scotopic (dark-adapted) vision for stargazing."`

---

### 4.3 Preset Data Structure

Update `src/types/index.ts` to add new fields to the preset type:

```typescript
export interface FilterPreset {
  id: string;
  name: string;
  color: string;          // hex, e.g. "#C45B1A"
  opacity: number;        // 0.0–1.80
  category: PresetCategory;
  description: string;    // max 80 chars, required
  isCinema?: boolean;     // true for the cinema/clarity categories
  isBuiltIn: boolean;
  createdAt?: number;
}

export type PresetCategory =
  | 'Cinema'
  | 'Clarity'
  | 'Warm'
  | 'Deep'
  | 'Cool'
  | 'Custom';
```

---

## PART 5 — PRIVACY FILTER (Software Micro-Louver Engine)

### 5.1 The Physics

A real hardware privacy screen uses **micro-louver film**: sheets of material containing thousands of tiny vertical or horizontal "blinds" — opaque walls spaced at a repeating pitch, typically 0.3–0.5mm apart, standing perpendicular to the display surface.

**What happens physically:**
- When you view straight-on (θ = 0°), your line of sight passes directly between the louver walls. You see the full screen.
- When you view from the side (θ > 25°), your line of sight hits the opaque louver walls. They block the view, making the screen appear dark.
- The cutoff angle is determined by: `θ_cutoff = arctan(pitch / height)`. For a louver with a 0.5mm pitch and 0.3mm wall height: θ ≈ 59°. For a 0.3mm pitch and 0.3mm wall: θ ≈ 45°.

**The software approximation:**
We replicate this with a pixel-repeating pattern overlay drawn directly on a `Canvas` view. The pattern consists of:
- **Gap row**: N pixels of full transparency (simulates the view-through slot between louvers)
- **Wall row**: 1 pixel at 70–85% black opacity (simulates the opaque louver wall)

At head-on viewing, this pattern is nearly invisible (just a subtle darkening).
At oblique angles (>30°), the eye physically cannot see through the transparent gaps as cleanly — the black wall rows merge optically with the gaps due to the non-zero viewing angle and pixel substructure. This is real optics, not a trick.

**The effect is genuine**: it will reduce readability from shoulder-viewing angles by approximately 30–50% depending on louver density. It is not as strong as hardware, but it requires no physical screen protector.

### 5.2 Density Modes

Expose three density modes to the user:

| Mode | Gap rows | Wall row | Pattern pitch | Head-on effect | Side effect |
|---|---|---|---|---|---|
| Subtle | 4px | 1px | 5px | ~7% light reduction | Moderate side blocking |
| Standard | 2px | 1px | 3px | ~17% light reduction | Good side blocking |
| Strong | 1px | 1px | 2px | ~25% light reduction | Strong side blocking |

Default: Standard.

### 5.3 Native Implementation: `PrivacyOverlayService.kt`

Create a new file: `android/app/src/main/java/com/screenfilterapp/overlay/PrivacyOverlayService.kt`

```kotlin
package com.screenfilterapp.overlay

import android.content.Context
import android.graphics.*
import android.view.View
import android.view.WindowManager
import android.os.Build

class PrivacyOverlayService(private val context: Context) {

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    private var isActive = false
    private var density: PrivacyDensity = PrivacyDensity.STANDARD
    private var louverOpacity: Float = 0.75f

    enum class PrivacyDensity(val gapPx: Int, val wallPx: Int) {
        SUBTLE(4, 1),
        STANDARD(2, 1),
        STRONG(1, 1)
    }

    /**
     * Creates a repeating horizontal stripe bitmap simulating micro-louver film.
     * The pattern alternates transparent gaps with semi-opaque wall rows.
     */
    private fun createLouverBitmap(density: PrivacyDensity): Bitmap {
        val pitch = density.gapPx + density.wallPx
        val bitmap = Bitmap.createBitmap(1, pitch, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Clear to transparent first
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)

        // Draw the wall row(s) at the bottom of each pitch unit
        val wallPaint = Paint().apply {
            color = Color.argb(
                (louverOpacity * 255).toInt(),
                0, 0, 0
            )
            isAntiAlias = false  // Critical: hard edges for the louver effect
        }
        for (i in density.gapPx until pitch) {
            canvas.drawRect(0f, i.toFloat(), 1f, (i + 1).toFloat(), wallPaint)
        }
        return bitmap
    }

    /**
     * Creates the tiled overlay view using BitmapShader for hardware-efficient rendering.
     */
    private fun createPrivacyView(): View {
        val bitmap = createLouverBitmap(density)
        val shader = BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
        val paint = Paint().apply {
            this.shader = shader
            isAntiAlias = false
        }

        return object : View(context) {
            override fun onDraw(canvas: Canvas) {
                canvas.drawPaint(paint)
            }
        }.apply {
            setLayerType(LAYER_TYPE_HARDWARE, null)
        }
    }

    fun start(densityMode: PrivacyDensity = PrivacyDensity.STANDARD, opacity: Float = 0.75f) {
        if (isActive) stop()
        this.density = densityMode
        this.louverOpacity = opacity.coerceIn(0.40f, 0.90f)

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val flags = (WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN)

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            flags,
            PixelFormat.TRANSLUCENT
        )

        overlayView = createPrivacyView()
        windowManager?.addView(overlayView, params)
        isActive = true
    }

    fun stop() {
        overlayView?.let {
            windowManager?.removeViewImmediate(it)
        }
        overlayView = null
        isActive = false
    }

    fun isRunning() = isActive

    fun updateDensity(newDensity: PrivacyDensity) {
        if (isActive) {
            stop()
            start(newDensity, louverOpacity)
        } else {
            this.density = newDensity
        }
    }
}
```

### 5.4 Bridge Method: `OverlayModule.kt` Additions

Add these `@ReactMethod` entries to `OverlayModule.kt`:

```kotlin
private var privacyService: PrivacyOverlayService? = null

@ReactMethod
fun startPrivacyFilter(densityMode: String, opacity: Double, promise: Promise) {
    try {
        if (privacyService == null) {
            privacyService = PrivacyOverlayService(reactApplicationContext)
        }
        val density = when (densityMode.lowercase()) {
            "subtle"   -> PrivacyOverlayService.PrivacyDensity.SUBTLE
            "strong"   -> PrivacyOverlayService.PrivacyDensity.STRONG
            else       -> PrivacyOverlayService.PrivacyDensity.STANDARD
        }
        privacyService?.start(density, opacity.toFloat())
        promise.resolve(true)
    } catch (e: Exception) {
        promise.reject("PRIVACY_ERROR", e.message)
    }
}

@ReactMethod
fun stopPrivacyFilter(promise: Promise) {
    privacyService?.stop()
    promise.resolve(true)
}

@ReactMethod
fun isPrivacyFilterActive(promise: Promise) {
    promise.resolve(privacyService?.isRunning() ?: false)
}
```

### 5.5 React Native Bridge: `src/services/PrivacyFilterService.ts`

Create this new service file:

```typescript
import { NativeModules } from 'react-native';

const { OverlayModule } = NativeModules;

export type PrivacyDensity = 'subtle' | 'standard' | 'strong';

export const PrivacyFilterService = {
  async start(density: PrivacyDensity = 'standard', opacity: number = 0.75): Promise<void> {
    await OverlayModule.startPrivacyFilter(density, opacity);
  },

  async stop(): Promise<void> {
    await OverlayModule.stopPrivacyFilter();
  },

  async isActive(): Promise<boolean> {
    return OverlayModule.isPrivacyFilterActive();
  },
};
```

### 5.6 Privacy Filter UI

Add a dedicated section to `SettingsScreen.tsx` under a new group heading **"PRIVACY"**:

```
PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Privacy Filter                        [ ON ]
Reduces side-angle screen visibility
using optical micro-louver simulation.

Density               [ Subtle | ●Standard | Strong ]

Wall Opacity                          75%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

UI copy rules:
- "Reduces side-angle screen visibility" — accurate and direct. Not "protect your privacy from prying eyes."
- Do not claim it makes the screen "invisible from the side." It reduces legibility. Say that.
- The wall opacity slider range: 40%–90%.

### 5.7 Important Limitation Note for UI

Place a one-line note below the privacy section (body-sm, muted color):
`"Software approximation only. Effect varies with ambient lighting and distance."`

This is not a legal disclaimer. It is honest product communication.

---

## PART 6 — APP ICON SYSTEM

### 6.1 Design Concept: "The Iris Filter"

**Mark description**: A precise circular aperture (camera iris) that is partially closed. The aperture blades are rendered as flat geometric arcs in `--void-ghost` (#2A2E3E). In the opening of the aperture, a radial gradient from `#E8A040` (amber) at the center to `#08090B` (void) at the edge — representing the filter color emanating from the opening. A single thin arc segment in `#FFD580` (light gold) traces 40° of arc at the upper-right quadrant. This is the only "glow" element and it is crisp, not blurred.

**Background**: `#08090B` (void-black). Not a gradient. Solid.

**The mark communicates**: precision, control, the act of filtering light — without resorting to moon/sun/eye clichés.

**Foreground design file**: Illustrator or Figma. Export as SVG, then convert to Android VectorDrawable.

### 6.2 Required File Sizes and Paths

#### Adaptive Icon (Required for Android 8.0+)

```
android/app/src/main/res/
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml            ← Adaptive icon definition
│   └── ic_launcher_round.xml      ← Same adaptive for round
├── drawable/
│   ├── ic_launcher_foreground.xml ← VectorDrawable, 108×108dp artboard
│   └── ic_launcher_background.xml ← VectorDrawable solid color OR shape
```

`ic_launcher.xml` structure:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

`ic_launcher_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#08090B"/>
</shape>
```

The foreground icon mark should be centered in the **safe zone**: a circle of diameter 66dp centered in the 108dp canvas. The outer 21dp on each side is the bleed zone (may be cropped by launchers). Design the iris mark to fit within the 66dp safe zone.

#### Legacy PNG Icons

Must exist for Android < 8.0 compatibility:

```
mipmap-mdpi/ic_launcher.png         48×48px
mipmap-mdpi/ic_launcher_round.png   48×48px

mipmap-hdpi/ic_launcher.png         72×72px
mipmap-hdpi/ic_launcher_round.png   72×72px

mipmap-xhdpi/ic_launcher.png        96×96px
mipmap-xhdpi/ic_launcher_round.png  96×96px

mipmap-xxhdpi/ic_launcher.png       144×144px
mipmap-xxhdpi/ic_launcher_round.png 144×144px

mipmap-xxxhdpi/ic_launcher.png      192×192px
mipmap-xxxhdpi/ic_launcher_round.png 192×192px
```

Export from a 1024×1024 master, scaled down with bilinear interpolation. Never upscale.

#### Play Store Submission

```
store_icon.png    512×512px    PNG, no alpha channel, RGB only
feature_graphic.png   1024×500px   Play Store feature banner
```

#### Notification Icons (Must be white + transparent)

Notification icons on Android 5.0+ are displayed as a **white silhouette** on the notification bar. Export a simplified version of the aperture mark in solid white:

```
drawable/ic_notification.xml    ← VectorDrawable, white paths only
```

Or rasterized variants:

```
drawable-mdpi/ic_stat_nightshade.png    24×24px
drawable-hdpi/ic_stat_nightshade.png    36×36px
drawable-xhdpi/ic_stat_nightshade.png   48×48px
drawable-xxhdpi/ic_stat_nightshade.png  72×72px
drawable-xxxhdpi/ic_stat_nightshade.png 96×96px
```

The notification icon must contain only `#FFFFFF` paths on `#00000000` background. Any color will be ignored by Android and rendered as white regardless.

#### Quick Settings Tile Icon

```
drawable/ic_tile_filter.xml    ← VectorDrawable, 24×24dp
```

Simplified mark — just the circular aperture, no gradient. Use `#FFFFFF` fill. Keep paths under 10 for rendering performance in the tile tray.

#### Floating Bubble Icon

```
drawable/ic_bubble_nightshade.xml    ← VectorDrawable, 48×48dp
```

Use the full color mark (not the white notification variant). This renders inside the `FloatingBubbleService` view.

### 6.3 Transparent Background Guide

> **Critical distinction**: The overlay that NightShade places over other apps must be transparent. The app's own UI must NOT be transparent — it must use solid dark backgrounds. Confusing these two will cause visual bugs.

#### The Overlay Views (OverlayService.kt)

These MUST use `PixelFormat.TRANSLUCENT`:

```kotlin
val params = WindowManager.LayoutParams(
    WindowManager.LayoutParams.MATCH_PARENT,
    WindowManager.LayoutParams.MATCH_PARENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
        or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
    PixelFormat.TRANSLUCENT  // ← THIS is what makes the overlay see-through
)
```

The View's background color controls the tint:
```kotlin
val overlayView = View(context).apply {
    setBackgroundColor(Color.argb(
        (opacity * 255).toInt(),  // alpha channel controls dim level
        red, green, blue          // color values from the preset
    ))
}
```

Do NOT set `setBackgroundColor(Color.TRANSPARENT)` on the overlay View. That makes the overlay invisible. Set the color WITH an alpha value.

#### The App's Own UI (React Native)

```typescript
// Root App view — must be OPAQUE
<View style={{ flex: 1, backgroundColor: '#08090B' }}>
  {/* All screens here */}
</View>
```

```typescript
// The Live Canvas background (HomeScreen only)
// This is computed from the current filter, blended over void-black
const liveCanvasColor = blendFilterOverBlack(currentFilterColor, currentOpacity);
<View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: liveCanvasColor }} />
```

The `blendFilterOverBlack` utility function:
```typescript
/**
 * Blends a filter color at a given opacity over #08090B (void-black).
 * Returns the resulting hex color for use as the Live Canvas background.
 * Clamps opacity to 0.0–0.60 for the UI background (even if filter is higher).
 */
export function blendFilterOverBlack(filterHex: string, filterOpacity: number): string {
  const clampedOp = Math.min(filterOpacity, 0.60);
  const base = { r: 8, g: 9, b: 11 }; // #08090B
  const filter = hexToRgb(filterHex);
  const r = Math.round(base.r * (1 - clampedOp) + filter.r * clampedOp);
  const g = Math.round(base.g * (1 - clampedOp) + filter.g * clampedOp);
  const b = Math.round(base.b * (1 - clampedOp) + filter.b * clampedOp);
  return rgbToHex(r, g, b);
}
```

#### Theme in AndroidManifest / styles.xml

The main Activity theme must NOT be translucent:
```xml
<!-- res/values/styles.xml -->
<style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
    <item name="android:windowIsTranslucent">false</item>
    <item name="android:windowBackground">@color/void_black</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
</style>
```

The Splash Screen theme should be separate:
```xml
<style name="SplashTheme" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#08090B</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/ic_launcher_foreground</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
</style>
```

---

## PART 7 — TASK MODULE BREAKDOWN

Tasks are organized into modules. Each module is independent unless dependencies are marked. Execute in order within a module. Do not jump across modules until all tasks in the current module are verified.

---

### MODULE A — Foundation (Execute First, No Dependencies)

**A1: Token Migration**
- File: `src/theme/index.ts`
- Task: Replace all existing palette tokens with the `--void-*` color system from Section 2.1. Keep all three palette exports for backward compat but redirect them all to the new tokens. Add typography scale from Section 2.2.
- Verify: TypeScript compiles. No raw hex strings remain in any component file.

**A2: Type System Update**
- File: `src/types/index.ts`
- Task: Update `FilterPreset` interface per Section 4.3. Add `PrivacyDensity` type. Add `PresetCategory` union type.
- Verify: No TypeScript errors. Import in at least one screen to confirm.

**A3: Utility Functions**
- File: `src/utils/helpers.ts`
- Task: Add `blendFilterOverBlack()`, `hexToRgb()`, `rgbToHex()` from Section 6.3. Add `opacityToLabel()` that returns a two-word description (e.g., 0.10 → "Subtle Tint", 0.55 → "Strong Dim").
- Verify: Write inline test values and confirm output matches expected.

---

### MODULE B — Preset Data (Depends on A2)

**B1: Cinema Preset Definitions**
- File: `src/services/StorageService.ts` OR wherever built-in presets are defined
- Task: Add all 16 presets from Section 4.2 to the default preset list. Each must have `name`, `color`, `opacity`, `category`, `description`, `isCinema`, `isBuiltIn: true`.
- Verify: Load the app (dev build). Navigate to PresetsScreen. Confirm all new presets appear in correct categories.

**B2: Preset Category Filter UI**
- File: `src/screens/PresetsScreen.tsx`
- Task: Add a horizontally scrollable category filter row above the preset grid. Pills: All | Cinema | Clarity | Warm | Deep | Cool | Custom. Tapping a pill filters the grid. Default: All.
- Verify: Tap each category. Grid filters correctly. Tapping a preset applies it.

---

### MODULE C — HomeScreen Revamp (Depends on A1, A3)

**C1: Live Canvas Background**
- File: `src/screens/HomeScreen.tsx`
- Task: Add the Live Canvas background View using `blendFilterOverBlack()`. It must update on every filter change via `OverlayStateStore` subscription.
- Verify: Change filter to Orange & Teal at 20%. App background should visibly warm. Change to Arctic Monitor. Background should cool.

**C2: Command Strip (Zone 1)**
- File: `src/screens/HomeScreen.tsx`
- Task: Replace the current hero toggle card with the two-zone layout from Section 3.1. Zone 1: large percentage number (display-xl), preset name (body-lg), active/inactive label, circle toggle button.
- Verify: The percentage number reflects real opacity. Toggle turns filter on/off. Preset name matches the active preset.

**C3: Controls Zone (Zone 2)**
- File: `src/screens/HomeScreen.tsx`
- Task: Replace current `BrightnessCard` and `Color Quick Select` with the new slim brightness slider, filter color strip, and preset row from Section 3.1.
- Verify: Slider goes 0–180%. Color chips are correct colors. Preset row scrolls horizontally.

---

### MODULE D — Privacy Filter (Depends on A2, no UI dependency)

**D1: Native Service**
- File: `android/app/src/main/java/com/screenfilterapp/overlay/PrivacyOverlayService.kt` (new file)
- Task: Implement the full `PrivacyOverlayService` class from Section 5.3.
- Verify: Kotlin compiles. Service class instantiates without errors in a test call.

**D2: Bridge Methods**
- File: `android/app/src/main/java/com/screenfilterapp/overlay/OverlayModule.kt`
- Task: Add the three `@ReactMethod` entries from Section 5.4. Import `PrivacyOverlayService`.
- Verify: Bridge compiles. `NativeModules.OverlayModule.startPrivacyFilter` is callable from JS.

**D3: TS Service**
- File: `src/services/PrivacyFilterService.ts` (new file)
- Task: Implement the service from Section 5.5.
- Verify: TypeScript compiles. Method signatures are correct.

**D4: Settings UI**
- File: `src/screens/SettingsScreen.tsx`
- Task: Add the Privacy section from Section 5.6. Wire up toggle, density selector, and opacity slider to `PrivacyFilterService`.
- Verify: Enable privacy filter. The micro-louver pattern should be visible (subtle) on screen when enabled.

---

### MODULE E — Icon System (Independent)

**E1: Foreground Drawable**
- File: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
- Task: Create the VectorDrawable for the iris aperture mark per Section 6.1 concept. Path the aperture blades as geometric arcs in `#2A2E3E`. The center opening as a radial gradient from `#E8A040` to `#08090B`. The highlight arc in `#FFD580`.
- Note: Use Android VectorDrawable gradient syntax (`<gradient>` inside `<shape>`). Artboard: 108×108dp. Mark lives within the 66dp safe zone.
- Verify: Preview in Android Studio layout inspector.

**E2: Background and Adaptive Icon**
- Files: `drawable/ic_launcher_background.xml`, `mipmap-anydpi-v26/ic_launcher.xml`, `mipmap-anydpi-v26/ic_launcher_round.xml`
- Task: Create background (solid `#08090B`), adaptive icon XML files, round variant.
- Verify: Android 8+ device/emulator shows adaptive icon correctly.

**E3: Legacy Mipmap PNGs**
- Task: Rasterize the icon design to all sizes from Section 6.2. Place in correct mipmap folders.
- Verify: Android 7 emulator shows correct icon.

**E4: Notification Icon**
- File: `drawable/ic_stat_nightshade.xml`
- Task: Simplified white-only aperture mark, VectorDrawable, 24×24dp.
- In `OverlayService.kt` notification builder: `setSmallIcon(R.drawable.ic_stat_nightshade)`.
- Verify: Pull down notification shade. Icon appears as correct white silhouette.

---

### MODULE F — Remaining Screen Revamps (Depends on A1, B1)

**F1: PresetsScreen Grid Layout**
- File: `src/screens/PresetsScreen.tsx`
- Task: Replace the list with the 2-column color swatch grid from Section 3.2.
- Verify: All 20+ presets visible in correct grid. Category filter from B2 works.

**F2: CreateFilterScreen**
- File: `src/screens/CreateFilterScreen.tsx`
- Task: Apply new design tokens. Remove any glassmorphism/gradient decoration. Keep functional color picker but restyle to match the new system.
- Verify: Creating a new custom preset works and saves correctly.

**F3: SettingsScreen**
- File: `src/screens/SettingsScreen.tsx`
- Task: Apply the clean list layout from Section 3.3. Remove any card wrappers from settings rows.
- Verify: All existing settings still function.

---

### MODULE G — Floating Bubble (Depends on A1)

**G1: Bubble Icon Update**
- File: `android/app/src/main/res/drawable/ic_bubble_nightshade.xml`
- Task: Update the floating bubble's icon to the new iris mark (full color version, not white).
- Verify: Floating bubble shows the new icon when active.

**G2: Bubble Panel Styling**
- File: `android/app/src/main/java/com/screenfilterapp/overlay/FloatingBubbleService.kt`
- Task: Update the expanded bubble panel background to `#0D0F14` (void-deep). Update text colors to `#F0F2F7`. Remove any rounded corner styling that creates a floaty/glassmorphic look.
- Verify: Tap the floating bubble. Panel background is dark matte, text is legible.

---

## PART 8 — COPY STYLE GUIDE

Every string visible to the user must comply with these rules.

**Use specific numbers, not vague labels:**
- ✅ "72% dim · Night Reading"
- ❌ "Strong · Active"

**Use plain verbs, not marketing verbs:**
- ✅ "Apply preset" / "Clear filter" / "Set opacity"
- ❌ "Activate" / "Unlock" / "Enable your night experience"

**Error messages must say what happened and what to do:**
- ✅ "Overlay permission required. Open Settings → Apps → NightShade → Permissions."
- ❌ "Permission needed to continue."

**Onboarding (PermissionScreen) single-sentence pitch:**
`"NightShade draws a color filter over your screen. It needs permission to appear over other apps."`
That is the entire explanation needed.

**Empty states must be honest:**
- Presets screen with no custom presets: "No custom presets yet. Tap + to create one."
- Not: "Your preset collection is empty — let's get started!"

---

## PART 9 — VERIFICATION CHECKLIST

Before marking any module complete, confirm:

☐ No raw hex values in component files — all from theme tokens
☐ No "glassmorphism" backdrop-blur or frosted effects
☐ No gradient text
☐ No emoji in UI labels
☐ All percentage values displayed with the `mono-num` style
☐ Live Canvas updates within 16ms of slider change (one frame)
☐ Privacy filter visible (subtle striping) when enabled on a white background
☐ Privacy filter does NOT crash when toggled on/off rapidly (5 times)
☐ All 16 cinema presets appear in the preset list with correct colors
☐ Notification icon is white silhouette (no color artifacts)
☐ Adaptive icon safe zone: mark fits within 66dp center circle
☐ Emergency reset still functions after revamp (ACTION_EMERGENCY_RESET → 50%)
☐ App starts in under 2 seconds on a mid-range device (test on Pixel 4a equivalent)
☐ Slider still reaches 180% (existing bug fix must remain)

---

## APPENDIX — WHAT NOT TO DO (SPECIFIC PROHIBITIONS)

1. **Do not add any new animations to the home screen** beyond the existing scale-on-toggle. The UI is a precision tool. It should not bounce, fade-dance, or spring.

2. **Do not add haptic feedback** unless it already exists. It is not specified here.

3. **Do not replace the existing `OverlayStateStore` architecture.** The V5 single-source-of-truth pattern is correct. Only add to it; do not refactor it.

4. **Do not add a splash animation.** The existing Android 12+ `SplashScreen` API integration is sufficient.

5. **Do not add onboarding tooltips, coach marks, or feature spotlights.** The UI communicates itself through clarity of design.

6. **Do not add analytics, crash reporting, or any network call** that was not already in the codebase.

7. **Do not change the package name** (`com.screenfilterapp`) or any service class names. Only add new files; modify existing ones where specified.

8. **Do not add social sharing, reviews prompt, or "rate us" dialog.**

9. **Do not use any pre-built UI component library** (no React Native Paper, NativeBase, UI Kitten). Build from primitives.

10. **Do not add dark/light mode toggle.** This is a dark-first app. Light mode is not part of this revamp.

---

*This document is the complete specification. Do not request further clarification from the user before beginning execution. Begin with Module A. Report completion of each task before proceeding to the next.*

*Document Version: 1.0 — NightShade Revamp Initiative*
*Prepared for: Claude Mythos 5 execution agent*
