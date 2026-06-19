import os

files = ['index.html', 'portal.html', 'principal-messages.html', 'styles.css']

replacements = {
    "WhatsApp Image 2026-06-03 at 9.40.49 PM.jpeg": "principal.webp",
    "WhatsApp Image 2026-06-03 at 9.40.53 PM.jpeg": "chairman.webp",
    "DSC_0320.JPG.jpeg": "gallery-1.webp",
    "DSC_0615.JPG.jpeg": "gallery-2.webp",
    "WhatsApp Image 2026-05-30 at 6.34.52 PM (1).jpeg": "gallery-3.webp",
    "WhatsApp Image 2026-06-03 at 9.40.51 PM.jpeg": "gallery-4.webp",
    "WhatsApp Image 2026-06-03 at 9.40.54 PM.jpeg": "gallery-5.webp",
    "student_looking-front.jpeg": "gallery-6.webp",
    "bg_campus_sunrise_1780156081202.png": "bg-hero.webp",
    "bg_enhanced_campus_1780156878279.png": "bg-about.webp",
    "bg_banyan_book_1780156098746.png": "bg-vision.webp",
    "bg_facilities_1780156899103.png": "bg-facilities.webp",
    "bg_campus_blur_1780156108157.png": "bg-gallery.webp",
    "logo.jpeg": "logo.webp"
}

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old_str, new_str in replacements.items():
            content = content.replace(old_str, new_str)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
