from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageSequence


ROOT = Path(__file__).resolve().parent.parent


def build_color_map():
    samples = defaultdict(Counter)
    for light_name, dark_name in (
        ("navroom-light-off.png", "navroom-dark-off.png"),
        ("navroom-light-on.png", "navroom-dark-on.png"),
    ):
        light = Image.open(ROOT / light_name).convert("RGB")
        dark = Image.open(ROOT / dark_name).convert("RGB")
        for source, target in zip(light.get_flattened_data(), dark.get_flattened_data()):
            samples[source][target] += 1
    return {source: targets.most_common(1)[0][0] for source, targets in samples.items()}


def recolor(image, color_map):
    rgb = image.convert("RGB")
    source_colors = list(color_map)
    cache = {}

    def mapped(color):
        if color in color_map:
            return color_map[color]
        if color not in cache:
            nearest = min(
                source_colors,
                key=lambda candidate: sum((a - b) ** 2 for a, b in zip(color, candidate)),
            )
            cache[color] = color_map[nearest]
        return cache[color]

    rgb.putdata([mapped(color) for color in rgb.get_flattened_data()])
    return rgb


def save_variant(source_name, target_name, color_map):
    source = Image.open(ROOT / source_name)
    recolor(source, color_map).save(ROOT / target_name, optimize=True)


def save_gif(source_name, target_name, color_map):
    source = Image.open(ROOT / source_name)
    frames = [recolor(frame, color_map) for frame in ImageSequence.Iterator(source)]
    durations = []
    source.seek(0)
    for index in range(source.n_frames):
        source.seek(index)
        durations.append(source.info.get("duration", 100))
    frames[0].save(
        ROOT / target_name,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=source.info.get("loop", 0),
        disposal=2,
        optimize=True,
    )


def save_banner():
    canvas = Image.new("RGB", (1800, 450), "#111317")
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((-140, 150, 450, 740), fill="#1b1e25")
    draw.ellipse((1245, -260, 1900, 420), fill="#221e1a")

    try:
        title_font = ImageFont.truetype("arialbd.ttf", 96)
        accent_font = ImageFont.truetype("arial.ttf", 96)
        subtitle_font = ImageFont.truetype("arial.ttf", 40)
    except OSError:
        title_font = accent_font = subtitle_font = ImageFont.load_default()

    draw.text((122, 120), "NavRoom", fill="#f0f2f7", font=title_font)
    nav_width = draw.textlength("NavRoom", font=title_font)
    draw.text((122 + nav_width + 32, 120), "Card", fill="#ffb86b", font=accent_font)
    draw.text(
        (122, 255),
        "The room card that glows in the color of your lights",
        fill="#aeb4c0",
        font=subtitle_font,
    )

    card = Image.open(ROOT / "navroom-dark-on.png").convert("RGB")
    card = card.crop((100, 95, 950, 430)).resize((510, 201), Image.Resampling.LANCZOS)
    canvas.paste(card, (1170, 110))
    canvas.save(ROOT / "navroom-banner-dark.png", optimize=True)


def main():
    color_map = build_color_map()
    for variant in ("badge", "chip", "pur"):
        save_variant(
            f"navroom-variant-{variant}-light.png",
            f"navroom-variant-{variant}-dark.png",
            color_map,
        )
    for variant in ("badge", "chip"):
        save_gif(
            f"navroom-demo-{variant}-light.gif",
            f"navroom-demo-{variant}-dark.gif",
            color_map,
        )
    save_banner()


if __name__ == "__main__":
    main()
