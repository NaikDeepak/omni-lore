#!/usr/bin/env python3
"""
Generate retro pixel-art icons for OmniLore Reader Chrome Extension.
Creates 16x16, 32x32, 48x48, 128x128 PNG icons with authentic pixel rune.
"""

import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "chrome-extension", "assets", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZES = [16, 32, 48, 128]

def create_omnilore_icon(size):
    # Base dark obsidian background with slight rounded corner feel
    img = Image.new("RGBA", (size, size), (4, 8, 20, 255))
    draw = ImageDraw.Draw(img)

    # Outer border: Amber / Cyan gradient feel
    border_color = (245, 158, 11, 255) # Amber
    inner_glow = (56, 189, 248, 200)   # Sky Blue
    accent_gold = (253, 224, 71, 255)  # Bright Gold

    # Draw border
    draw.rectangle([0, 0, size - 1, size - 1], outline=border_color, width=max(1, size // 16))

    # Center rune: Pixel Diamond / Shield Nexus
    cx, cy = size // 2, size // 2
    r = size // 3

    # Draw pixel diamond
    diamond_points = [
        (cx, cy - r),
        (cx + r, cy),
        (cx, cy + r),
        (cx - r, cy)
    ]
    draw.polygon(diamond_points, fill=(15, 23, 42, 255), outline=inner_glow)

    # Core pixel star
    inner_r = max(2, r // 2)
    inner_points = [
        (cx, cy - inner_r),
        (cx + inner_r, cy),
        (cx, cy + inner_r),
        (cx - inner_r, cy)
    ]
    draw.polygon(inner_points, fill=accent_gold)

    # Center nexus dot
    dot_r = max(1, size // 16)
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(255, 255, 255, 255))

    return img

for s in SIZES:
    icon = create_omnilore_icon(s)
    path = os.path.join(OUTPUT_DIR, f"icon-{s}.png")
    icon.save(path, "PNG")
    print(f"Generated {path} ({s}x{s})")

print("All icons generated successfully.")
