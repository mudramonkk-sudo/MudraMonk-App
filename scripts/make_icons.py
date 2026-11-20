"""Download the official Mudra Monk logo from the website and make every app icon from it.

Run:  python scripts/make_icons.py
Needs: pip install pillow
"""
import io
import pathlib
import urllib.request

from PIL import Image

LOGO_URL = "https://mudramonk.com/wp-content/uploads/2026/11/mudra-monk-icon.png"
ASSETS = pathlib.Path(__file__).resolve().parent.parent / "assets"

req = urllib.request.Request(LOGO_URL, headers={"User-Agent": "MudraMonkAppBuild/1.0"})
logo = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGBA")
print("logo", logo.size)


def on_canvas(size: int, scale: float, bg) -> Image.Image:
    """Logo centred on a square canvas, taking `scale` of its width."""
    canvas = Image.new("RGBA", (size, size), bg)
    side = int(size * scale)
    art = logo.resize((side, side), Image.LANCZOS)
    canvas.alpha_composite(art, ((size - side) // 2, (size - side) // 2))
    return canvas


# Main icon (iOS + Play Store): logo exactly as on the website, white behind any transparency
on_canvas(1024, 1.0, (255, 255, 255, 255)).convert("RGB").save(ASSETS / "icon.png")
# Android adaptive icon: Android crops the outer ring, so keep the logo inside the safe zone
on_canvas(1024, 0.66, (0, 0, 0, 0)).save(ASSETS / "adaptive-icon.png")
on_canvas(1024, 0.5, (0, 0, 0, 0)).save(ASSETS / "splash-icon.png")
on_canvas(48, 1.0, (255, 255, 255, 255)).save(ASSETS / "favicon.png")
print("icons written to", ASSETS)
