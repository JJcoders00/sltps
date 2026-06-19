import os
import sys
from PIL import Image

# Mapping old messy names to clean semantic names
rename_map = {
    # Profiles
    "WhatsApp Image 2026-06-03 at 9.40.49 PM.jpeg": "principal",
    "WhatsApp Image 2026-06-03 at 9.40.53 PM.jpeg": "chairman",
    
    # Gallery
    "DSC_0320.JPG.jpeg": "gallery-1",
    "DSC_0615.JPG.jpeg": "gallery-2",
    "WhatsApp Image 2026-05-30 at 6.34.52 PM (1).jpeg": "gallery-3",
    "WhatsApp Image 2026-06-03 at 9.40.51 PM.jpeg": "gallery-4",
    "WhatsApp Image 2026-06-03 at 9.40.54 PM.jpeg": "gallery-5",
    "student_looking-front.jpeg": "gallery-6",
    
    # Backgrounds
    "bg_campus_sunrise_1780156081202.png": "bg-hero",
    "bg_enhanced_campus_1780156878279.png": "bg-about",
    "bg_banyan_book_1780156098746.png": "bg-vision",
    "bg_facilities_1780156899103.png": "bg-facilities",
    "bg_campus_blur_1780156108157.png": "bg-gallery",
    
    # Other images
    "logo.jpeg": "logo"
}

def optimize_images():
    for old_name, new_base in rename_map.items():
        if not os.path.exists(old_name):
            print(f"Skipping {old_name} (Not found)")
            continue
            
        new_name = f"{new_base}.webp"
        
        try:
            with Image.open(old_name) as img:
                # Convert to RGB if PNG with alpha or palette
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if too huge (e.g. the 7MB files)
                MAX_WIDTH = 1920
                if img.width > MAX_WIDTH:
                    ratio = MAX_WIDTH / img.width
                    new_size = (MAX_WIDTH, int(img.height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Save as WEBP
                img.save(new_name, 'WEBP', quality=80, method=4)
                print(f"Optimized: {old_name} -> {new_name}")
                
            # Remove original file to save space and force updating code
            os.remove(old_name)
        except Exception as e:
            print(f"Error processing {old_name}: {e}")

if __name__ == "__main__":
    optimize_images()
