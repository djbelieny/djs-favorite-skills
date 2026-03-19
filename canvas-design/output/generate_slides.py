#!/usr/bin/env python3
"""
Neural Pulse — Instagram Carousel Generator v2
7 slides, 1080x1080px, dark theme with blue/purple gradients
Refined: hand-drawn icons, richer gradients, better composition
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import math
import os

FONTS_DIR = "/Users/djbelieny/.claude/skills/canvas-design/canvas-fonts"
OUTPUT_DIR = "/Users/djbelieny/.claude/skills/canvas-design/output"
SIZE = 1080

# Colors - refined palette
BG_DARK = (7, 7, 16)
BG_DEEP = (10, 10, 22)
WHITE = (255, 255, 255)
WHITE_90 = (235, 235, 245)
WHITE_60 = (160, 160, 185)
WHITE_40 = (100, 100, 130)
WHITE_20 = (50, 50, 70)
BLUE = (55, 120, 255)
BLUE_LIGHT = (100, 160, 255)
PURPLE = (130, 60, 255)
PURPLE_LIGHT = (170, 110, 255)
MAGENTA = (200, 60, 200)
CYAN = (60, 200, 240)

def load_font(name, size):
    return ImageFont.truetype(os.path.join(FONTS_DIR, name), size)

def get_fonts():
    return {
        "title_xl": load_font("Outfit-Bold.ttf", 80),
        "title_lg": load_font("Outfit-Bold.ttf", 64),
        "title_md": load_font("Outfit-Bold.ttf", 52),
        "subtitle": load_font("InstrumentSans-Regular.ttf", 34),
        "subtitle_bold": load_font("InstrumentSans-Bold.ttf", 34),
        "body": load_font("InstrumentSans-Regular.ttf", 30),
        "body_sm": load_font("InstrumentSans-Regular.ttf", 26),
        "mono": load_font("JetBrainsMono-Regular.ttf", 18),
        "mono_bold": load_font("JetBrainsMono-Bold.ttf", 20),
        "mono_lg": load_font("JetBrainsMono-Bold.ttf", 28),
        "handle": load_font("JetBrainsMono-Bold.ttf", 30),
        "micro": load_font("JetBrainsMono-Regular.ttf", 14),
    }

# ──────────────────────────────────────────────
# UTILITY DRAWING FUNCTIONS
# ──────────────────────────────────────────────

def lerp_color(c1, c2, t):
    """Interpolate between two colors."""
    t = max(0, min(1, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_radial_glow(img, cx, cy, radius, color, intensity=0.25):
    """Draw a smooth radial glow onto an image."""
    overlay = Image.new("RGB", img.size, (0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = min(radius, 120)
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        t = 1 - (i / steps)
        alpha = t * t * intensity  # quadratic falloff
        c = tuple(max(0, min(255, int(color[j] * alpha))) for j in range(3))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    return ImageChops.add(img, overlay)

def draw_gradient_bg(img, color_top, color_bottom):
    """Apply a subtle vertical gradient to background."""
    draw = ImageDraw.Draw(img)
    for y in range(SIZE):
        t = y / SIZE
        c = lerp_color(color_top, color_bottom, t)
        draw.line([(0, y), (SIZE, y)], fill=c)

def draw_dot_grid(draw, spacing=48, color=(22, 22, 40)):
    """Subtle dot grid across canvas."""
    for x in range(24, SIZE - 24, spacing):
        for y in range(24, SIZE - 24, spacing):
            draw.ellipse([x, y, x + 2, y + 2], fill=color)

def draw_gradient_hline(draw, y, x1, x2, c1, c2, thickness=2):
    """Draw a horizontal gradient line."""
    for x in range(x1, x2):
        t = (x - x1) / max(1, (x2 - x1))
        c = lerp_color(c1, c2, t)
        for dy in range(thickness):
            draw.point((x, y + dy), fill=c)

def draw_slide_dots(draw, active, total=7):
    """Draw carousel position dots at bottom."""
    y = SIZE - 52
    dot_spacing = 28
    total_w = (total - 1) * dot_spacing
    start_x = (SIZE - total_w) // 2
    for i in range(total):
        x = start_x + i * dot_spacing
        if i == active - 1:
            draw.rounded_rectangle([x - 12, y - 3, x + 12, y + 3], radius=3, fill=BLUE)
        else:
            draw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=WHITE_20)

def text_cx(draw, text, font, y, fill):
    """Center text horizontally."""
    bb = draw.textbbox((0, 0), text, font=font)
    w = bb[2] - bb[0]
    draw.text(((SIZE - w) // 2, y), text, font=font, fill=fill)
    return bb[3] - bb[1]

def text_wrap_cx(draw, text, font, y, fill, max_w=740, gap=12):
    """Wrap and center text."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        bb = draw.textbbox((0, 0), test, font=font)
        if bb[2] - bb[0] <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    cy = y
    for line in lines:
        bb = draw.textbbox((0, 0), line, font=font)
        lw = bb[2] - bb[0]
        lh = bb[3] - bb[1]
        draw.text(((SIZE - lw) // 2, cy), line, font=font, fill=fill)
        cy += lh + gap
    return cy

def draw_top_label(draw, f, text):
    """Mono label at top center."""
    text_cx(draw, text, f["mono"], 56, WHITE_40)

# ──────────────────────────────────────────────
# HAND-DRAWN GEOMETRIC ICONS
# ──────────────────────────────────────────────

def draw_icon_envelope(draw, cx, cy, size, color):
    """Email envelope icon using lines."""
    s = size // 2
    # Rectangle body
    draw.rounded_rectangle([cx-s, cy-s+8, cx+s, cy+s-4], radius=6, outline=color, width=2)
    # V flap lines
    draw.line([(cx-s, cy-s+8), (cx, cy+6)], fill=color, width=2)
    draw.line([(cx+s, cy-s+8), (cx, cy+6)], fill=color, width=2)
    # Calendar small icon below
    cal_y = cy + s + 16
    cs = 14
    draw.rounded_rectangle([cx+20-cs, cal_y-cs, cx+20+cs, cal_y+cs], radius=3, outline=WHITE_40, width=1)
    draw.line([(cx+20-cs+4, cal_y-4), (cx+20+cs-4, cal_y-4)], fill=WHITE_40, width=1)
    # Small dots for calendar dates
    for dx in range(-1, 2):
        for ddy in range(0, 2):
            draw.ellipse([cx+20+dx*7-1, cal_y+2+ddy*6-1, cx+20+dx*7+1, cal_y+2+ddy*6+1], fill=WHITE_40)

def draw_icon_phone(draw, cx, cy, size, color):
    """Phone icon."""
    s = size // 2
    # Phone body rectangle
    draw.rounded_rectangle([cx-s//2+4, cy-s, cx+s//2-4, cy+s], radius=10, outline=color, width=2)
    # Screen area
    draw.rounded_rectangle([cx-s//2+10, cy-s+12, cx+s//2-10, cy+s-16], radius=3, outline=WHITE_20, width=1)
    # Home button circle
    draw.ellipse([cx-4, cy+s-12, cx+4, cy+s-4], outline=WHITE_40, width=1)
    # Signal waves to the right
    for i in range(3):
        r = 18 + i * 12
        angles = []
        for a in range(-30, 31, 2):
            rad = math.radians(a)
            px = cx + s//2 + 16 + int(r * math.sin(rad))
            py = cy - 10 + int(-r * math.cos(rad))
            angles.append((px, py))
        alpha = max(40, 180 - i * 60)
        wave_color = lerp_color(color, (0,0,0), 1 - alpha/255)
        if len(angles) > 1:
            draw.line(angles, fill=wave_color, width=1)

def draw_icon_chart(draw, cx, cy, size, color):
    """Bar chart / analytics icon."""
    s = size // 2
    # Three bars
    bar_w = 12
    bar_gap = 20
    bars = [0.4, 0.75, 0.55]
    start_x = cx - (len(bars) * (bar_w + bar_gap) - bar_gap) // 2
    for i, h in enumerate(bars):
        bx = start_x + i * (bar_w + bar_gap)
        by_top = cy + s - int(h * size * 0.7)
        by_bot = cy + s
        t = i / (len(bars) - 1) if len(bars) > 1 else 0
        bar_color = lerp_color(color, PURPLE_LIGHT, t)
        draw.rounded_rectangle([bx, by_top, bx + bar_w, by_bot], radius=3, fill=bar_color)
    # Trend line
    pts = []
    for i, h in enumerate(bars):
        bx = start_x + i * (bar_w + bar_gap) + bar_w // 2
        by = cy + s - int(h * size * 0.7) - 8
        pts.append((bx, by))
    if len(pts) > 1:
        draw.line(pts, fill=WHITE_60, width=2)
        for p in pts:
            draw.ellipse([p[0]-3, p[1]-3, p[0]+3, p[1]+3], fill=WHITE)
    # Axis lines
    draw.line([(cx-s+10, cy+s), (cx+s-10, cy+s)], fill=WHITE_20, width=1)
    draw.line([(cx-s+10, cy-s+10), (cx-s+10, cy+s)], fill=WHITE_20, width=1)

def draw_icon_brain(draw, cx, cy, size, color):
    """Brain / neural network icon."""
    s = size // 2
    # Central node
    draw.ellipse([cx-6, cy-6, cx+6, cy+6], fill=color)
    # Surrounding nodes in a circle
    nodes = []
    for i in range(6):
        angle = math.radians(i * 60 - 90)
        nx = cx + int(s * 0.65 * math.cos(angle))
        ny = cy + int(s * 0.65 * math.sin(angle))
        nodes.append((nx, ny))
        # Connection to center
        draw.line([(cx, cy), (nx, ny)], fill=lerp_color(color, PURPLE_LIGHT, i/6), width=1)
    # Outer connections
    for i in range(len(nodes)):
        j = (i + 1) % len(nodes)
        draw.line([nodes[i], nodes[j]], fill=WHITE_20, width=1)
    # Draw node circles
    for i, (nx, ny) in enumerate(nodes):
        t = i / len(nodes)
        nc = lerp_color(color, PURPLE_LIGHT, t)
        draw.ellipse([nx-4, ny-4, nx+4, ny+4], fill=nc)
    # Outer ring
    for i in range(6):
        angle = math.radians(i * 60 - 60)
        ox = cx + int(s * 0.95 * math.cos(angle))
        oy = cy + int(s * 0.95 * math.sin(angle))
        draw.ellipse([ox-2, oy-2, ox+2, oy+2], fill=WHITE_20)
        # Connect to nearest inner node
        nearest = min(nodes, key=lambda n: (n[0]-ox)**2 + (n[1]-oy)**2)
        draw.line([(ox, oy), nearest], fill=WHITE_20, width=1)


# ──────────────────────────────────────────────
# DECORATIVE PATTERNS
# ──────────────────────────────────────────────

def draw_concentric_rings(draw, cx, cy, max_r, count, color, base_alpha=30):
    """Subtle concentric circles."""
    for i in range(count):
        r = int(max_r * (i + 1) / count)
        a = max(5, base_alpha - i * (base_alpha // count))
        rc = tuple(int(color[j] * a / 255) for j in range(3))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=rc, width=1)

def draw_corner_accents(draw, color=WHITE_20):
    """Small L-shaped accents in corners."""
    m = 40  # margin
    l = 20  # length
    # Top-left
    draw.line([(m, m), (m + l, m)], fill=color, width=1)
    draw.line([(m, m), (m, m + l)], fill=color, width=1)
    # Top-right
    draw.line([(SIZE - m, m), (SIZE - m - l, m)], fill=color, width=1)
    draw.line([(SIZE - m, m), (SIZE - m, m + l)], fill=color, width=1)
    # Bottom-left
    draw.line([(m, SIZE - m), (m + l, SIZE - m)], fill=color, width=1)
    draw.line([(m, SIZE - m), (m, SIZE - m - l)], fill=color, width=1)
    # Bottom-right
    draw.line([(SIZE - m, SIZE - m), (SIZE - m - l, SIZE - m)], fill=color, width=1)
    draw.line([(SIZE - m, SIZE - m), (SIZE - m, SIZE - m - l)], fill=color, width=1)

def draw_vertical_bars_deco(draw, cx, cy, color1, color2):
    """Decorative vertical bars pattern."""
    for i in range(-4, 5):
        x = cx + i * 22
        h = 6 + abs(i) * 5
        t = (i + 4) / 8
        c = lerp_color(color1, color2, t)
        draw.rounded_rectangle([x - 2, cy - h, x + 2, cy + h], radius=2, fill=c)

def draw_horizontal_bars_deco(draw, cx, cy, color1, color2):
    """Decorative horizontal bars."""
    widths = [50, 32, 68, 24, 44]
    total = sum(widths) + (len(widths) - 1) * 10
    sx = cx - total // 2
    cur_x = sx
    for i, w in enumerate(widths):
        t = i / (len(widths) - 1)
        c = lerp_color(color1, color2, t)
        draw.rounded_rectangle([cur_x, cy, cur_x + w, cy + 4], radius=2, fill=c)
        cur_x += w + 10

def draw_floating_particles(draw, seed=42):
    """Tiny scattered particles for depth."""
    import random
    rng = random.Random(seed)
    for _ in range(30):
        x = rng.randint(60, SIZE - 60)
        y = rng.randint(60, SIZE - 60)
        s = rng.randint(1, 2)
        a = rng.randint(15, 40)
        c = tuple(int(BLUE[j] * a / 255) for j in range(3))
        draw.ellipse([x, y, x + s, y + s], fill=c)


# ──────────────────────────────────────────────
# SLIDE 1: COVER
# ──────────────────────────────────────────────
def slide_1(f):
    img = Image.new("RGB", (SIZE, SIZE), BG_DARK)
    draw_gradient_bg(img, (8, 8, 18), (5, 5, 12))

    # Layered glows
    img = draw_radial_glow(img, SIZE//2, SIZE//2 - 30, 400, BLUE, 0.18)
    img = draw_radial_glow(img, SIZE//2 + 80, SIZE//2 + 20, 320, PURPLE, 0.12)
    img = draw_radial_glow(img, SIZE//2 - 60, SIZE//2 - 80, 250, CYAN, 0.06)

    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw, spacing=52, color=(20, 20, 38))
    draw_floating_particles(draw, seed=1)
    draw_corner_accents(draw)

    # Concentric rings
    draw_concentric_rings(draw, SIZE//2, SIZE//2 - 20, 260, 7, BLUE, 25)

    # Top label
    draw_top_label(draw, f, "NOVA  //  AI AGENT")

    # Thin decorative line above label area
    draw_gradient_hline(draw, 100, 380, 700, (30,30,60), (30,30,60), 1)

    # Main title
    text_cx(draw, "Seu Agente", f["title_xl"], 340, WHITE)
    text_cx(draw, "de IA Pessoal", f["title_xl"], 430, WHITE)

    # Gradient accent line
    draw_gradient_hline(draw, 535, 320, 760, BLUE, PURPLE, 2)

    # Subtitles
    text_cx(draw, "Claude Code  \u00d7  Nova", f["subtitle_bold"], 565, BLUE_LIGHT)
    text_cx(draw, "Direto do seu Telegram", f["subtitle"], 620, WHITE_60)

    # Bottom deco bars
    draw_vertical_bars_deco(draw, SIZE//2, 760, BLUE, PURPLE)

    draw_slide_dots(draw, 1)
    return img


# ──────────────────────────────────────────────
# SLIDE 2: WHAT IS NOVA
# ──────────────────────────────────────────────
def slide_2(f):
    img = Image.new("RGB", (SIZE, SIZE), BG_DARK)
    draw_gradient_bg(img, (8, 8, 18), (6, 5, 14))

    img = draw_radial_glow(img, SIZE//2 + 80, 380, 320, PURPLE, 0.14)
    img = draw_radial_glow(img, SIZE//2 - 40, 450, 280, BLUE, 0.08)

    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw, spacing=52, color=(20, 20, 38))
    draw_floating_particles(draw, seed=2)
    draw_corner_accents(draw)

    draw_top_label(draw, f, "01  //  INTRODU\u00c7\u00c3O")

    # Title
    text_cx(draw, "O que \u00e9 o Nova?", f["title_xl"], 280, WHITE)

    # Accent line
    draw_gradient_hline(draw, 378, 340, 740, BLUE, PURPLE, 2)

    # Body
    text_wrap_cx(draw,
        "Um agente aut\u00f4nomo de IA constru\u00eddo com Claude Code que opera 24/7 pelo Telegram",
        f["body"], 410, WHITE_60, max_w=720, gap=14)

    # Node diagram: CLAUDE -> NOVA -> TELEGRAM
    node_y = 640
    nodes_x = [300, 540, 780]
    labels = ["CLAUDE", "NOVA", "TELEGRAM"]
    colors = [BLUE, PURPLE, MAGENTA]

    # Connection lines with gradient
    for i in range(len(nodes_x) - 1):
        x1, x2 = nodes_x[i], nodes_x[i+1]
        for x in range(x1 + 20, x2 - 20):
            t = (x - x1) / (x2 - x1)
            c = lerp_color(colors[i], colors[i+1], t)
            c_dim = lerp_color(c, BG_DARK, 0.5)
            draw.point((x, node_y), fill=c_dim)
            draw.point((x, node_y + 1), fill=c_dim)

    # Nodes
    for i, (nx, lab) in enumerate(zip(nodes_x, labels)):
        # Outer ring
        draw.ellipse([nx-24, node_y-24, nx+24, node_y+24], outline=WHITE_20, width=1)
        # Inner glow circle
        draw.ellipse([nx-10, node_y-10, nx+10, node_y+10], fill=colors[i])
        # Subtle outer halo
        draw.ellipse([nx-16, node_y-16, nx+16, node_y+16], outline=lerp_color(colors[i], BG_DARK, 0.6), width=1)
        # Label
        bb = draw.textbbox((0, 0), lab, font=f["micro"])
        lw = bb[2] - bb[0]
        draw.text((nx - lw//2, node_y + 36), lab, font=f["micro"], fill=WHITE_40)

    # Bottom deco
    draw_horizontal_bars_deco(draw, SIZE//2, 790, BLUE, PURPLE)

    draw_slide_dots(draw, 2)
    return img


# ──────────────────────────────────────────────
# FEATURE SLIDE TEMPLATE (slides 3-6)
# ──────────────────────────────────────────────
def feature_slide(f, num, label, title, body, icon_fn, glow_color, glow_pos, seed=3):
    img = Image.new("RGB", (SIZE, SIZE), BG_DARK)
    draw_gradient_bg(img, (8, 8, 18), (5, 5, 12))

    img = draw_radial_glow(img, glow_pos[0], glow_pos[1], 340, glow_color, 0.14)
    img = draw_radial_glow(img, SIZE//2, 280, 200, lerp_color(glow_color, PURPLE, 0.5), 0.06)

    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw, spacing=52, color=(20, 20, 38))
    draw_floating_particles(draw, seed=seed)
    draw_corner_accents(draw)

    draw_top_label(draw, f, label)

    # Icon container - rounded rect with gradient border effect
    icon_cx = SIZE // 2
    icon_cy = 230
    box_s = 60

    # Outer decorative ring
    draw_concentric_rings(draw, icon_cx, icon_cy, 80, 3, glow_color, 20)

    # Icon box background
    draw.rounded_rectangle(
        [icon_cx - box_s, icon_cy - box_s, icon_cx + box_s, icon_cy + box_s],
        radius=20, fill=(14, 14, 28), outline=WHITE_20, width=1
    )

    # Draw the custom icon
    icon_fn(draw, icon_cx, icon_cy, box_s * 2 - 20, glow_color)

    # Title
    text_cx(draw, title, f["title_lg"], 340, WHITE)

    # Accent line
    draw_gradient_hline(draw, 418, 320, 760, BLUE, PURPLE, 2)

    # Body text
    end_y = text_wrap_cx(draw, body, f["body"], 448, WHITE_60, max_w=720, gap=14)

    # Feature pills / tags below body
    pill_y = max(end_y + 40, 560)

    # Decorative element: subtle data-like rows
    row_y = pill_y + 20
    for i in range(3):
        ry = row_y + i * 28
        line_w = 160 + (i % 2) * 80
        lx = (SIZE - line_w) // 2
        alpha = 25 - i * 5
        rc = tuple(int(glow_color[j] * alpha / 255) for j in range(3))
        draw.rounded_rectangle([lx, ry, lx + line_w, ry + 3], radius=2, fill=rc)
        # Small dot at start
        draw.ellipse([lx - 8, ry - 2, lx - 2, ry + 5], fill=lerp_color(glow_color, BG_DARK, 0.5))

    # Bottom deco
    draw_horizontal_bars_deco(draw, SIZE//2, 800, BLUE, PURPLE)

    draw_slide_dots(draw, num)
    return img


# ──────────────────────────────────────────────
# SLIDE 7: CTA
# ──────────────────────────────────────────────
def slide_7(f):
    img = Image.new("RGB", (SIZE, SIZE), BG_DARK)
    draw_gradient_bg(img, (8, 8, 18), (5, 5, 12))

    # Strong dual glow for emphasis
    img = draw_radial_glow(img, SIZE//2 - 60, SIZE//2 - 20, 380, BLUE, 0.20)
    img = draw_radial_glow(img, SIZE//2 + 60, SIZE//2 - 60, 320, PURPLE, 0.16)
    img = draw_radial_glow(img, SIZE//2, SIZE//2 + 40, 200, CYAN, 0.05)

    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw, spacing=52, color=(20, 20, 38))
    draw_floating_particles(draw, seed=7)
    draw_corner_accents(draw)

    # Large concentric rings
    draw_concentric_rings(draw, SIZE//2, SIZE//2 - 30, 340, 9, BLUE, 22)

    draw_top_label(draw, f, "07  //  COMECE AGORA")

    # Large CTA title
    text_cx(draw, "Construa o Seu", f["title_xl"], 370, WHITE)

    # Gradient accent
    draw_gradient_hline(draw, 468, 300, 780, BLUE, PURPLE, 3)

    # "Link na bio" text
    text_cx(draw, "Link na bio", f["subtitle"], 500, WHITE_60)

    # Up arrow - drawn manually for reliability
    arrow_cx = SIZE // 2
    arrow_cy = 570
    draw.line([(arrow_cx, arrow_cy - 16), (arrow_cx, arrow_cy + 16)], fill=BLUE_LIGHT, width=3)
    draw.line([(arrow_cx - 10, arrow_cy - 6), (arrow_cx, arrow_cy - 16)], fill=BLUE_LIGHT, width=3)
    draw.line([(arrow_cx + 10, arrow_cy - 6), (arrow_cx, arrow_cy - 16)], fill=BLUE_LIGHT, width=3)

    # Handle box
    handle = "@godago.ai"
    bb = draw.textbbox((0, 0), handle, font=f["handle"])
    hw = bb[2] - bb[0]
    hh = bb[3] - bb[1]
    pad_x, pad_y = 40, 20
    box_x = (SIZE - hw - pad_x * 2) // 2
    box_y = 630

    # Box with gradient-like border
    draw.rounded_rectangle(
        [box_x, box_y, box_x + hw + pad_x * 2, box_y + hh + pad_y * 2],
        radius=14, outline=PURPLE, width=2
    )
    # Inner subtle fill
    draw.rounded_rectangle(
        [box_x + 2, box_y + 2, box_x + hw + pad_x * 2 - 2, box_y + hh + pad_y * 2 - 2],
        radius=12, fill=(16, 14, 32)
    )
    draw.text((box_x + pad_x, box_y + pad_y), handle, font=f["handle"], fill=BLUE_LIGHT)

    # Bottom deco
    draw_vertical_bars_deco(draw, SIZE//2, 780, BLUE, PURPLE)

    draw_slide_dots(draw, 7)
    return img


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    f = get_fonts()

    slides = [
        ("slide_01_cover.png", slide_1(f)),
        ("slide_02_intro.png", slide_2(f)),
        ("slide_03_email.png", feature_slide(
            f, 3, "02  //  EMAIL & AGENDA",
            "Email & Agenda",
            "L\u00ea, escreve e envia emails. Cria e gerencia eventos no Google Calendar automaticamente.",
            draw_icon_envelope, BLUE, (480, 400), seed=3
        )),
        ("slide_04_calls.png", feature_slide(
            f, 4, "03  //  LIGA\u00c7\u00d5ES & SMS",
            "Liga\u00e7\u00f5es & SMS",
            "Faz liga\u00e7\u00f5es telef\u00f4nicas e envia mensagens de texto via Twilio. Pode ligar para voc\u00ea ou para terceiros.",
            draw_icon_phone, PURPLE, (600, 380), seed=4
        )),
        ("slide_05_ads.png", feature_slide(
            f, 5, "04  //  META ADS & CRM",
            "Meta Ads & CRM",
            "Gerencia campanhas no Meta Ads, analisa performance e opera o Go High Level CRM.",
            draw_icon_chart, lerp_color(BLUE, PURPLE, 0.5), (500, 420), seed=5
        )),
        ("slide_06_memory.png", feature_slide(
            f, 6, "05  //  MEM\u00d3RIA & TAREFAS",
            "Mem\u00f3ria & Tarefas",
            "Lembra do contexto, agenda lembretes, executa tarefas recorrentes e aprende com o tempo.",
            draw_icon_brain, MAGENTA, (560, 400), seed=6
        )),
        ("slide_07_cta.png", slide_7(f)),
    ]

    for name, img in slides:
        path = os.path.join(OUTPUT_DIR, name)
        img.save(path, "PNG", quality=100)
        print(f"Saved: {path}")

    print(f"\nAll {len(slides)} slides generated.")

if __name__ == "__main__":
    main()
