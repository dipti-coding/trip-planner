#!/usr/bin/env python3
"""
Usage: python scripts/test_ocr.py <image_path>

Runs OCR on the image and feeds the result into the confirmation parser.
Useful for testing booking screenshots before sending them through the app.
"""
import sys
from app.services.ocr import extract_text_from_image
from app.services.parsing import parse_confirmation_text


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/test_ocr.py <image_path>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "rb") as f:
        image_bytes = f.read()

    print("── OCR OUTPUT ──────────────────────────────")
    text = extract_text_from_image(image_bytes)
    print(text)

    print("── PARSED RESULT ───────────────────────────")
    try:
        plan_type, title, start_dt, end_dt, details = parse_confirmation_text(text)
        print(f"type:    {plan_type.value}")
        print(f"title:   {title}")
        print(f"start:   {start_dt}")
        print(f"end:     {end_dt}")
        print(f"details: {details}")
    except ValueError as e:
        print(f"parse error: {e}")


if __name__ == "__main__":
    main()
