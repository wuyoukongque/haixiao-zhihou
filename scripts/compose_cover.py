#!/usr/bin/env python3
"""Compose Chinese cover typography over a generated background."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageFilter


TITLE = "海啸之后"
SUBTITLE = "AI之后，人类如何重新定义自己"
AUTHOR = "Lincoln 著"


def font(size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/Supplemental/STSong.ttf",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size, index=index)
    return ImageFont.load_default()


def title_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        ("/System/Library/Fonts/Kaiti.ttc", 0),
        ("/System/Library/Fonts/STHeiti Light.ttc", 0),
        ("/System/Library/Fonts/Supplemental/Songti.ttc", 1),
        ("/System/Library/Fonts/Supplemental/Songti.ttc", 0),
    ]
    for path, index in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size, index=index)
    return font(size)


def draw_tracking(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font_obj: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: int,
) -> int:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font_obj, fill=fill)
        bbox = draw.textbbox((x, y), char, font=font_obj)
        x += bbox[2] - bbox[0] + tracking
    return x


def tracked_width(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_obj: ImageFont.FreeTypeFont,
    tracking: int,
) -> int:
    width = 0
    for char in text:
        bbox = draw.textbbox((0, 0), char, font=font_obj)
        width += bbox[2] - bbox[0] + tracking
    return max(0, width - tracking)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("background")
    parser.add_argument("--output", default=None)
    parser.add_argument("--title", default=TITLE)
    parser.add_argument("--subtitle", default=SUBTITLE)
    parser.add_argument("--author", default=AUTHOR)
    parser.add_argument(
        "--mode",
        choices=["classic", "calligraphy"],
        default="calligraphy",
    )
    args = parser.parse_args()

    bg_path = Path(args.background)
    image = Image.open(bg_path).convert("RGB")
    w, h = image.size

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    # A little vignette gives the cover more print-like depth.
    vignette = Image.new("L", image.size, 0)
    vd = ImageDraw.Draw(vignette)
    margin = int(min(w, h) * 0.08)
    vd.rounded_rectangle(
        [margin, margin, w - margin, h - margin],
        radius=int(min(w, h) * 0.12),
        fill=255,
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(int(min(w, h) * 0.12)))
    dark = Image.new("RGBA", image.size, (0, 0, 0, 34))
    overlay = Image.composite(overlay, Image.alpha_composite(overlay, dark), Image.eval(vignette, lambda p: 255 - p))

    image = Image.alpha_composite(image.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(image)

    title_font_obj = title_font(int(h * 0.084)) if args.mode == "calligraphy" else font(int(h * 0.086), index=0)
    subtitle_font = font(int(h * 0.026), index=0)
    author_font = font(int(h * 0.023), index=0)
    small_font = font(int(h * 0.018), index=0)

    title_tracking = int(w * 0.020 if args.mode == "calligraphy" else w * 0.018)
    title_width = tracked_width(draw, args.title, title_font_obj, title_tracking)
    title_x = (w - title_width) // 2
    title_y = int(h * 0.105)

    if args.mode == "calligraphy":
        # Simulate light feibai texture by cutting faint horizontal paper streaks
        # through the brush-like title mask.
        mask = Image.new("L", image.size, 0)
        md = ImageDraw.Draw(mask)
        draw_tracking(md, (title_x, title_y), args.title, title_font_obj, 255, title_tracking)
        streak = Image.new("L", image.size, 255)
        sd = ImageDraw.Draw(streak)
        for y in range(title_y + int(h * 0.010), title_y + int(h * 0.092), max(8, int(h * 0.013))):
            sd.line([(title_x - 12, y), (title_x + title_width + 12, y + 1)], fill=138, width=max(1, int(h * 0.0012)))
        textured_mask = ImageChops.multiply(mask, streak)
        title_layer = Image.new("RGBA", image.size, (244, 235, 221, 0))
        title_layer.putalpha(textured_mask)
        image = Image.alpha_composite(image, title_layer)
        draw = ImageDraw.Draw(image)
    else:
        draw_tracking(draw, (title_x, title_y), args.title, title_font_obj, (244, 235, 221, 255), title_tracking)

    subtitle_bbox = draw.textbbox((0, 0), args.subtitle, font=subtitle_font)
    subtitle_x = (w - (subtitle_bbox[2] - subtitle_bbox[0])) // 2
    subtitle_y = title_y + int(h * 0.115)
    draw.text((subtitle_x + 2, subtitle_y + 3), args.subtitle, font=subtitle_font, fill=(0, 0, 0, 145))
    draw.text((subtitle_x, subtitle_y), args.subtitle, font=subtitle_font, fill=(226, 211, 185, 245))

    author_bbox = draw.textbbox((0, 0), args.author, font=author_font)
    author_x = (w - (author_bbox[2] - author_bbox[0])) // 2
    author_y = int(h * 0.865)
    draw.text((author_x + 2, author_y + 3), args.author, font=author_font, fill=(0, 0, 0, 150))
    draw.text((author_x, author_y), args.author, font=author_font, fill=(236, 224, 204, 245))

    output = Path(args.output) if args.output else bg_path.with_name(bg_path.stem + "-cover.jpeg")
    output.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(output, quality=95)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
