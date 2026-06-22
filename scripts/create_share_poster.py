from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import math
import random


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "posters"
OUT.mkdir(parents=True, exist_ok=True)
QR_PATH = ROOT / "public" / "yunyan-share-qr.png"

W, H = 1080, 1440
random.seed(20260623)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MED = r"C:\Windows\Fonts\msyh.ttc"
FONT_REG = r"C:\Windows\Fonts\msyh.ttc"

f_brand = font(FONT_MED, 31)
f_title = font(FONT_BOLD, 75)
f_title2 = font(FONT_BOLD, 64)
f_sub = font(FONT_MED, 34)
f_body = font(FONT_REG, 27)
f_small = font(FONT_REG, 21)
f_qr = font(FONT_BOLD, 34)
f_tag = font(FONT_MED, 24)
f_mini = font(FONT_REG, 18)


def shadow_rounded(
    base: Image.Image,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int, int],
    shadow: tuple[int, int, int, int] = (20, 30, 45, 55),
    offset: tuple[int, int] = (0, 22),
    blur: int = 28,
    outline: tuple[int, int, int, int] | None = None,
    width: int = 1,
) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    sx0, sy0, sx1, sy1 = [
        box[0] + offset[0],
        box[1] + offset[1],
        box[2] + offset[0],
        box[3] + offset[1],
    ]
    ld.rounded_rectangle([sx0, sy0, sx1, sy1], radius=radius, fill=shadow)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def make_poster() -> Path:
    img = Image.new("RGB", (W, H), "#f3efe6")
    pix = img.load()
    for y in range(H):
        for x in range(W):
            t = y / H
            s = x / W
            r = int(244 * (1 - t) + 230 * t + 8 * math.sin(s * math.pi))
            g = int(241 * (1 - t) + 236 * t + 4 * math.cos(s * math.pi))
            b = int(232 * (1 - t) + 222 * t)
            pix[x, y] = (r, g, b)

    # Soft, photo-like background light and paper shapes.
    bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    for _ in range(26):
        x = random.randint(-250, W)
        y = random.randint(-180, H)
        rw = random.randint(180, 620)
        rh = random.randint(100, 420)
        col = random.choice(
            [
                (255, 255, 255, 42),
                (209, 226, 235, 42),
                (229, 219, 196, 40),
                (168, 190, 205, 26),
            ]
        )
        d.ellipse([x, y, x + rw, y + rh], fill=col)
    bg = bg.filter(ImageFilter.GaussianBlur(38))
    img = Image.alpha_composite(img.convert("RGBA"), bg)

    paper = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(paper)
    for x, y, ww, hh, ang, alpha in [
        (110, 160, 720, 470, -8, 118),
        (420, 780, 560, 360, 8, 92),
        (-70, 910, 500, 330, -14, 80),
    ]:
        sheet = Image.new("RGBA", (ww, hh), (255, 255, 252, alpha))
        sd = ImageDraw.Draw(sheet)
        sd.rounded_rectangle(
            [0, 0, ww - 1, hh - 1],
            radius=24,
            fill=(255, 255, 252, alpha),
            outline=(255, 255, 255, 110),
            width=2,
        )
        for yy in range(64, hh - 42, 42):
            sd.line([45, yy, ww - 55, yy], fill=(42, 73, 125, 42), width=3)
        for xx in [60, 230, 410, 565]:
            sd.line([xx, 74, xx, hh - 52], fill=(42, 73, 125, 24), width=2)
        sd.rectangle([45, 32, ww - 230, 48], fill=(30, 64, 123, 45))
        sheet = sheet.filter(ImageFilter.GaussianBlur(1.2)).rotate(
            ang, resample=Image.Resampling.BICUBIC, expand=True
        )
        paper.alpha_composite(sheet, (x, y))
    pd.rounded_rectangle([760, 260, 788, 730], radius=13, fill=(25, 47, 76, 42))
    paper = paper.filter(ImageFilter.GaussianBlur(5))
    img = Image.alpha_composite(img, paper)

    edge = Image.new("L", (W, H), 0)
    ed = ImageDraw.Draw(edge)
    ed.rectangle([0, 0, W, H], fill=80)
    ed.rounded_rectangle([70, 70, W - 70, H - 70], radius=90, fill=0)
    edge = edge.filter(ImageFilter.GaussianBlur(90))
    dark = Image.new("RGBA", (W, H), (34, 44, 58, 70))
    img = Image.composite(dark, img, edge)

    card = (76, 74, 1004, 1328)
    shadow_rounded(
        img,
        card,
        54,
        (255, 255, 250, 232),
        shadow=(37, 48, 75, 62),
        offset=(0, 28),
        blur=36,
        outline=(255, 255, 255, 180),
        width=2,
    )
    draw = ImageDraw.Draw(img)

    accent = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent)
    ad.rounded_rectangle([card[0], card[1], card[2], card[1] + 210], radius=54, fill=(235, 244, 246, 178))
    ad.rectangle([card[0], card[1] + 110, card[2], card[1] + 230], fill=(235, 244, 246, 132))
    img = Image.alpha_composite(img, accent)
    draw = ImageDraw.Draw(img)

    pill = (126, 126, 356, 178)
    draw.rounded_rectangle(pill, radius=26, fill=(31, 64, 124, 235))
    draw.text((150, 135), "云岩志愿助手", font=f_tag, fill=(255, 255, 255, 245))

    label = "高考志愿 · 免费预览"
    tw = draw.textlength(label, font=f_small)
    draw.rounded_rectangle(
        [W - 126 - tw - 42, 126, W - 126, 178],
        radius=26,
        fill=(255, 255, 255, 150),
        outline=(210, 220, 225, 150),
        width=1,
    )
    draw.text((W - 126 - tw - 21, 139), label, font=f_small, fill=(62, 78, 95, 230))

    x0, y0 = 126, 252
    for off, fill in [((0, 2), (255, 255, 255, 160)), ((0, 0), (24, 43, 72, 255))]:
        draw.text((x0 + off[0], y0 + off[1]), "给自己一个", font=f_title, fill=fill)
        draw.text((x0 + off[0], y0 + 88 + off[1]), "更稳的志愿", font=f_title2, fill=fill)

    for i in range(230):
        c = (31, 64, 124, int(165 * (1 - i / 230)))
        draw.line([x0 + i, y0 + 174, x0 + i + 1, y0 + 174], fill=c, width=8)

    body_y = 500
    draw.text((x0, body_y), "输入分数、位次和选科，先看一份参考报告。", font=f_sub, fill=(39, 62, 91, 235))
    for i, line in enumerate(["冲稳保分层预览", "选科规则硬匹配", "数据口径清晰可追溯"]):
        yy = body_y + 70 + i * 47
        draw.ellipse([x0, yy + 8, x0 + 20, yy + 28], fill=(5, 150, 105, 230))
        draw.text((x0 + 36, yy), line, font=f_body, fill=(65, 78, 94, 235))

    qr_card = (214, 775, 866, 1235)
    shadow_rounded(
        img,
        qr_card,
        38,
        (255, 255, 255, 248),
        shadow=(20, 40, 70, 52),
        offset=(0, 18),
        blur=24,
        outline=(229, 234, 238, 255),
        width=2,
    )
    draw = ImageDraw.Draw(img)
    qr_title = "扫码生成志愿免费预览"
    draw.text((W // 2 - draw.textlength(qr_title, font=f_qr) // 2, 810), qr_title, font=f_qr, fill=(24, 43, 72, 255))

    qr = Image.open(QR_PATH).convert("RGB")
    qr = ImageOps.expand(qr, border=36, fill="white")
    qr_size = 332
    qr = qr.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    qr_x = (W - qr_size) // 2
    qr_y = 870
    draw.rounded_rectangle([qr_x - 16, qr_y - 16, qr_x + qr_size + 16, qr_y + qr_size + 16], radius=22, fill=(255, 255, 255, 255))
    img.paste(qr, (qr_x, qr_y))

    small = "识别二维码 / 长按图片进入"
    draw.text((W // 2 - draw.textlength(small, font=f_small) // 2, 1228), small, font=f_small, fill=(91, 104, 120, 240))

    note = "仅供志愿填报参考，不构成录取承诺；请以考试院与院校官方信息为准。"
    maxw = 810
    cur = ""
    wrapped: list[str] = []
    for ch in note:
        if draw.textlength(cur + ch, font=f_small) <= maxw:
            cur += ch
        else:
            wrapped.append(cur)
            cur = ch
    if cur:
        wrapped.append(cur)
    ny = 1282
    for line in wrapped:
        draw.text((W // 2 - draw.textlength(line, font=f_small) // 2, ny), line, font=f_small, fill=(99, 105, 112, 225))
        ny += 30

    base = img.convert("RGB")
    # Light grain only outside QR. Re-paste QR afterward so it stays crisp.
    noise = Image.new("L", (W, H))
    np = noise.load()
    for yy in range(H):
        for xx in range(W):
            np[xx, yy] = random.randint(0, 18)
    noise_rgba = Image.merge("RGBA", (noise, noise, noise, Image.new("L", (W, H), 24)))
    base = Image.alpha_composite(base.convert("RGBA"), noise_rgba).convert("RGB")
    base.paste(qr, (qr_x, qr_y))

    out = OUT / "yunyan-share-photo-poster-1080x1440.png"
    base.save(out, quality=96)
    return out


if __name__ == "__main__":
    print(make_poster())
