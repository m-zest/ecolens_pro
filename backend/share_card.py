"""
Generate a shareable EcoLens report card as PNG — editorial, on-brand,
designed for 1200x630 OG dimensions so it looks right on Twitter / LinkedIn.
Pure Pillow (no browser rendering required). QR code bottom-left links the
card back to the live EcoLens page.
"""
from __future__ import annotations
import io
import os
from typing import Any

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image, ImageDraw, ImageFont

# Editorial palette (matches frontend tokens).
CREAM = (244, 241, 234)
CREAM_DARK = (234, 229, 217)
FOREST = (26, 54, 45)
TERRACOTTA = (194, 89, 52)
SAGE = (165, 180, 159)
GRADE_COLORS = {
    "A": (46, 125, 50),
    "B": (124, 179, 66),
    "C": (253, 216, 53),
    "D": (251, 140, 0),
    "E": (211, 47, 47),
}

W, H = 1200, 630


def _try_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if path and os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


# Stock fonts present on most Debian/Alpine images. Fraunces-esque serif first,
# then Outfit/DejaVu fallback.
SERIF_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]
SANS_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
SANS_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def _wrap(text: str, font, max_w: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words, lines, current = text.split(), [], ""
    for w in words:
        test = (current + " " + w).strip()
        if draw.textlength(test, font=font) <= max_w:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def _make_qr(url: str, size_px: int = 160) -> Image.Image:
    """Forest-on-cream QR code sized to `size_px`."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=FOREST, back_color=CREAM).convert("RGB")
    return img.resize((size_px, size_px), Image.NEAREST)


def render_packaging_card(p: dict, share_url: str | None = None) -> bytes:
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    # Paper grain illusion — subtle dotted pattern.
    for y in range(0, H, 11):
        for x in range(0, W, 11):
            d.point((x, y), fill=(229, 222, 206))

    # Left gutter panel (forest block)
    d.rectangle([0, 0, 24, H], fill=FOREST)

    # Eyebrow
    f_eyebrow = _try_font(SANS_BOLD_CANDIDATES, 18)
    d.text((80, 60), "ECOLENS  ·  PACKAGING, HONESTLY", fill=FOREST, font=f_eyebrow)
    # dotted rule
    for x in range(80, W - 80, 10):
        d.ellipse([x, 100, x + 2, 102], fill=FOREST + (0,) if False else (26, 54, 45))

    # Title
    f_title = _try_font(SERIF_CANDIDATES, 58)
    title_lines = _wrap(p["name"], f_title, W - 460, d)[:2]
    y = 130
    for line in title_lines:
        d.text((80, y), line, fill=FOREST, font=f_title)
        y += 68

    # Subtitle (category + material)
    f_sub = _try_font(SANS_CANDIDATES, 22)
    d.text((80, y + 10), f"{p['category']}  ·  {p['material']}", fill=(90, 107, 98), font=f_sub)

    # Metrics row
    y = 290
    f_metric_label = _try_font(SANS_BOLD_CANDIDATES, 15)
    f_metric_val = _try_font(SERIF_CANDIDATES, 38)

    metrics = [
        ("CO₂", f"{p['co2_kg']} kg"),
        ("WATER", f"{p['water_l']} L"),
        ("ENERGY", f"{p['energy_mj']} MJ"),
        ("RECYCLABLE", f"{p['recyclability_pct']}%"),
    ]
    col_w = (W - 460) // 4
    for i, (k, v) in enumerate(metrics):
        cx = 80 + i * col_w
        d.text((cx, y), k, fill=(90, 107, 98), font=f_metric_label)
        d.text((cx, y + 25), v, fill=FOREST, font=f_metric_val)

    # Right: big GreenScore circle
    grade = p.get("score_grade", "C")
    value = int(p.get("score_value", 0))
    color = GRADE_COLORS.get(grade, GRADE_COLORS["C"])
    cx_, cy_, r_ = W - 200, 280, 140

    # Ring background
    d.ellipse([cx_ - r_ - 6, cy_ - r_ - 6, cx_ + r_ + 6, cy_ + r_ + 6], outline=FOREST, width=2)
    # Colored fill arc
    bbox = [cx_ - r_, cy_ - r_, cx_ + r_, cy_ + r_]
    d.pieslice(bbox, 90, 90 + int(360 * (value / 100)), fill=color)
    # Inner cream hole
    inner = r_ - 30
    d.ellipse([cx_ - inner, cy_ - inner, cx_ + inner, cy_ + inner], fill=CREAM)

    # Grade letter
    f_grade = _try_font(SERIF_CANDIDATES, 150)
    bbox_g = d.textbbox((0, 0), grade, font=f_grade)
    gw, gh = bbox_g[2] - bbox_g[0], bbox_g[3] - bbox_g[1]
    d.text((cx_ - gw / 2 - bbox_g[0], cy_ - gh / 2 - bbox_g[1] - 10), grade, fill=color, font=f_grade)

    # "/100" under
    f_score = _try_font(SANS_BOLD_CANDIDATES, 22)
    s_txt = f"{value}/100"
    sw = d.textlength(s_txt, font=f_score)
    d.text((cx_ - sw / 2, cy_ + 70), s_txt, fill=FOREST, font=f_score)

    # GreenScore label
    f_lbl = _try_font(SANS_BOLD_CANDIDATES, 14)
    lbl = "GREENSCORE"
    lw = d.textlength(lbl, font=f_lbl)
    d.text((cx_ - lw / 2, cy_ + 100), lbl, fill=(90, 107, 98), font=f_lbl)

    # Footer
    f_foot = _try_font(SANS_CANDIDATES, 18)
    d.text((80, H - 56), "ecolens  ·  d4pack methodology  ·  ecoinvent v3.9 reference", fill=(90, 107, 98), font=f_foot)

    # Bottom-right: highlight chip
    top_hl = p.get("highlights", [""])[0][:48]
    if top_hl:
        chip_f = _try_font(SANS_BOLD_CANDIDATES, 16)
        tw = d.textlength(top_hl, font=chip_f) + 36
        d.rounded_rectangle([W - tw - 56, H - 80, W - 56, H - 46], radius=16, fill=FOREST)
        d.text((W - tw - 38, H - 72), top_hl, fill=CREAM, font=chip_f)

    # QR code — bottom-left, embedded in a cream tile with a thin forest border.
    if share_url:
        qr_size = 110
        qr_img = _make_qr(share_url, size_px=qr_size)
        qr_x, qr_y = 56, 400
        d.rounded_rectangle(
            [qr_x - 10, qr_y - 10, qr_x + qr_size + 10, qr_y + qr_size + 10],
            radius=14, fill=CREAM, outline=FOREST, width=2,
        )
        img.paste(qr_img, (qr_x, qr_y))
        # Tiny label beside the QR
        qr_lbl_f = _try_font(SANS_BOLD_CANDIDATES, 13)
        d.text((qr_x + qr_size + 20, qr_y + 6), "SCAN FOR LIVE REPORT", fill=FOREST, font=qr_lbl_f)
        qr_note_f = _try_font(SANS_CANDIDATES, 14)
        d.text((qr_x + qr_size + 20, qr_y + 28), "ecolens · live numbers,", fill=(90, 107, 98), font=qr_note_f)
        d.text((qr_x + qr_size + 20, qr_y + 47), "narrative in 4 languages.", fill=(90, 107, 98), font=qr_note_f)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def render_submission_card(report: dict, input_name: str, share_url: str | None = None) -> bytes:
    packaging_like = {
        "name": input_name or "Your packaging",
        "category": report["input"]["category"],
        "material": report["input"]["material"],
        "co2_kg": report["co2_kg"],
        "water_l": report["water_l"],
        "energy_mj": report["energy_mj"],
        "recyclability_pct": report["recyclability_pct"],
        "score_grade": report["score_grade"],
        "score_value": report["score_value"],
        "highlights": report.get("reasoning", [""])[:1],
    }
    return render_packaging_card(packaging_like, share_url=share_url)
