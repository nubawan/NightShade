#!/usr/bin/env python3
"""
Generate legacy PNG icon files for Android from VectorDrawable XMLs.

Converts ic_launcher_foreground.xml + ic_launcher_background.xml → launcher PNGs
Converts ic_stat_nightshade.xml → notification icon PNGs
Also generates Play Store assets (store_icon.png, feature_graphic.png)
"""

import os
import cairosvg
from PIL import Image
from io import BytesIO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")


# ─── SVG templates ────────────────────────────────────────────────────────────

LAUNCHER_SVG = '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 108 108"
     width="108" height="108">

  <!-- Background: solid #08090B -->
  <rect x="0" y="0" width="108" height="108" fill="#08090B"/>

  <!-- Aperture blade 1 — top-right arc -->
  <path fill="#2A2E3E" d="M54,21 C63.5,21 71.6,26.1 76,33.8 L69.4,37.6 C66.4,32.4 60.7,29 54,29 Z"/>
  <!-- Aperture blade 2 — right arc -->
  <path fill="#2A2E3E" d="M76,33.8 C80.5,41.5 80.5,50.9 76,58.6 L69.4,54.8 C72.4,49.6 72.4,42.8 69.4,37.6 Z"/>
  <!-- Aperture blade 3 — bottom-right arc -->
  <path fill="#2A2E3E" d="M76,58.6 C71.6,66.3 63.5,71.4 54,71.4 L54,63.4 C60.7,63.4 66.4,60 69.4,54.8 Z"/>
  <!-- Aperture blade 4 — bottom-left arc -->
  <path fill="#2A2E3E" d="M54,71.4 C44.5,71.4 36.4,66.3 32,58.6 L38.6,54.8 C41.6,60 47.3,63.4 54,63.4 Z"/>
  <!-- Aperture blade 5 — left arc -->
  <path fill="#2A2E3E" d="M32,58.6 C27.5,50.9 27.5,41.5 32,33.8 L38.6,37.6 C35.6,42.8 35.6,49.6 38.6,54.8 Z"/>
  <!-- Aperture blade 6 — top-left arc -->
  <path fill="#2A2E3E" d="M32,33.8 C36.4,26.1 44.5,21 54,21 L54,29 C47.3,29 41.6,32.4 38.6,37.6 Z"/>

  <!-- Center opening — amber layers -->
  <path fill="#E8A040" d="M54,30 C62.8,30 70,37.2 70,46 C70,54.8 62.8,62 54,62 C45.2,62 38,54.8 38,46 C38,37.2 45.2,30 54,30 Z"/>
  <!-- Gradient layer 1 — slightly larger, dimmer -->
  <path fill="#C08030" opacity="0.6" d="M54,32 C61.7,32 68,38.3 68,46 C68,53.7 61.7,60 54,60 C46.3,60 40,53.7 40,46 C40,38.3 46.3,32 54,32 Z"/>
  <!-- Gradient layer 2 — amber dim -->
  <path fill="#8B5A1A" opacity="0.5" d="M54,35 C60.1,35 65,39.9 65,46 C65,52.1 60.1,57 54,57 C47.9,57 43,52.1 43,46 C43,39.9 47.9,35 54,35 Z"/>
  <!-- Gradient layer 3 — deep amber core -->
  <path fill="#1A1008" opacity="0.5" d="M54,39 C57.9,39 61,42.1 61,46 C61,49.9 57.9,53 54,53 C50.1,53 47,49.9 47,46 C47,42.1 50.1,39 54,39 Z"/>
  <!-- Bright amber core center -->
  <path fill="#FFD580" opacity="0.8" d="M54,41 C56.8,41 59,43.2 59,46 C59,48.8 56.8,51 54,51 C51.2,51 49,48.8 49,46 C49,43.2 51.2,41 54,41 Z"/>
  <!-- Hot center -->
  <path fill="#E8A040" d="M54,43 C55.7,43 57,44.3 57,46 C57,47.7 55.7,49 54,49 C52.3,49 51,47.7 51,46 C51,44.3 52.3,43 54,43 Z"/>

  <!-- Highlight arc — light gold stroke -->
  <path fill="none" stroke="#FFD580" stroke-width="1.8" stroke-linecap="round"
        d="M66.8,28.2 A24,24 0 0,1 78,46"/>
</svg>
'''


NOTIFICATION_SVG = '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     width="24" height="24">

  <!-- Simplified aperture ring -->
  <path fill="#FFFFFF" d="M12,3 A9,9 0 1,1 12,21 A9,9 0 1,1 12,3 Z"/>
  <!-- Inner void (transparent) -->
  <path fill="none" d="M12,7 A5,5 0 1,1 12,17 A5,5 0 1,1 12,7 Z"/>
  <!-- Aperture blade segments -->
  <path fill="#FFFFFF" d="M12,7 C13.5,7 14.8,7.8 15.6,9 L12,12 Z"/>
  <path fill="#FFFFFF" d="M15.6,9 C16.4,10.2 16.4,11.8 15.6,13 L12,12 Z"/>
  <path fill="#FFFFFF" d="M15.6,13 C14.8,14.2 13.5,15 12,15 L12,12 Z"/>
  <path fill="#FFFFFF" d="M12,15 C10.5,15 9.2,14.2 8.4,13 L12,12 Z"/>
  <path fill="#FFFFFF" d="M8.4,13 C7.6,11.8 7.6,10.2 8.4,9 L12,12 Z"/>
  <path fill="#FFFFFF" d="M8.4,9 C9.2,7.8 10.5,7 12,7 L12,12 Z"/>
  <!-- Center dot -->
  <path fill="#FFFFFF" d="M12,10.5 C13,10.5 13.5,11 13.5,12 C13.5,13 13,13.5 12,13.5 C11,13.5 10.5,13 10.5,12 C10.5,11 11,10.5 12,10.5 Z"/>
</svg>
'''


# ─── Helper functions ─────────────────────────────────────────────────────────

def render_svg_to_png(svg_string, size):
    """Render SVG string to PIL Image at given pixel size."""
    png_data = cairosvg.svg2png(
        bytestring=svg_string.encode("utf-8"),
        output_width=size,
        output_height=size,
    )
    return Image.open(BytesIO(png_data)).convert("RGBA")


def save_scaled(master_img, size, filepath):
    """Scale master image to size and save as PNG."""
    scaled = master_img.resize((size, size), Image.LANCZOS)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    scaled.save(filepath, "PNG")
    return filepath


# ─── Main generation ─────────────────────────────────────────────────────────

def main():
    generated_files = []

    # ── 1. Launcher icons ────────────────────────────────────────────────
    print("Rendering launcher icon master (1024×1024)…")
    master_launcher = render_svg_to_png(LAUNCHER_SVG, 1024)

    mipmap_sizes = {
        "mipmap-mdpi":    48,
        "mipmap-hdpi":    72,
        "mipmap-xhdpi":   96,
        "mipmap-xxhdpi":  144,
        "mipmap-xxxhdpi": 192,
    }

    for folder, px in mipmap_sizes.items():
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            path = os.path.join(RES_DIR, folder, name)
            save_scaled(master_launcher, px, path)
            generated_files.append(path)
            print(f"  ✓ {path}  ({px}×{px})")

    # ── 2. Notification status-bar icons ─────────────────────────────────
    print("\nRendering notification icon master (512×512)…")
    master_notif = render_svg_to_png(NOTIFICATION_SVG, 512)

    drawable_sizes = {
        "drawable-mdpi":    24,
        "drawable-hdpi":    36,
        "drawable-xhdpi":   48,
        "drawable-xxhdpi":  72,
        "drawable-xxxhdpi": 96,
    }

    for folder, px in drawable_sizes.items():
        path = os.path.join(RES_DIR, folder, "ic_stat_nightshade.png")
        save_scaled(master_notif, px, path)
        generated_files.append(path)
        print(f"  ✓ {path}  ({px}×{px})")

    # ── 3. Play Store assets ─────────────────────────────────────────────
    print("\nGenerating Play Store assets…")

    # store_icon.png — 512×512
    store_path = os.path.join(BASE_DIR, "android", "app", "store_icon.png")
    save_scaled(master_launcher, 512, store_path)
    generated_files.append(store_path)
    print(f"  ✓ {store_path}  (512×512)")

    # feature_graphic.png — 1024×500
    feature_path = os.path.join(BASE_DIR, "android", "app", "feature_graphic.png")
    # Create a 1024×500 canvas, center the icon portion
    feature = Image.new("RGBA", (1024, 500), (8, 9, 11, 255))  # #08090B
    # Scale the launcher icon to fit vertically (500px) with padding
    icon_500 = master_launcher.resize((500, 500), Image.LANCZOS)
    feature.paste(icon_500, (262, 0), icon_500)  # centered horizontally: (1024-500)/2 = 262
    os.makedirs(os.path.dirname(feature_path), exist_ok=True)
    feature.save(feature_path, "PNG")
    generated_files.append(feature_path)
    print(f"  ✓ {feature_path}  (1024×500)")

    # ── Summary ──────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  Generated {len(generated_files)} PNG files")
    print(f"{'='*60}")
    for f in generated_files:
        size_kb = os.path.getsize(f) / 1024
        img = Image.open(f)
        print(f"  {f:75s}  {img.size[0]:>4d}×{img.size[1]:<4d}  {size_kb:6.1f} KB")


if __name__ == "__main__":
    main()
