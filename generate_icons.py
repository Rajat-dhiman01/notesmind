from PIL import Image, ImageDraw, ImageFont

def make_icon(size, path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = size * 0.05
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(79, 70, 229, 255))
    font_size = int(size * 0.55)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', font_size)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), 'N', font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    draw.text((x, y), 'N', fill=(255, 255, 255, 255), font=font)
    img.save(path, 'PNG')
    print(f'Created {path}')

make_icon(192, 'frontend/public/icon-192.png')
make_icon(512, 'frontend/public/icon-512.png')