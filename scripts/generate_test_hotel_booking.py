from PIL import Image, ImageDraw, ImageFont
import argparse

# ----------------------------
# TEMPLATE FIELD POSITIONS
# ----------------------------
# Test Hotel Booking Image Generation Commands:
# Date format 1
# python generate_test_hotel_booking.py \
#   --template-image /Users/dipti/dev/trip-planner/tests/booking_templates/hotel-booking.png \
#   --template-name hotel \
#   --checkin "2026-06-17" \
#   --checkout "2026-06-18" \
#   --checkin-time "5:00 PM" \
#   --checkout-time "9:00 AM" \
#   --output /Users/dipti/Downloads/test_airbnb1.png


# ----------------------------

TEMPLATES = {
    "hotel": {
        "checkin_date": (175, 681),
        "checkin_time": (175, 708),
        "checkout_date": (458, 681),
        "checkout_time": (458, 708),
        "checkin_box": (163, 676, 422, 728),
        "checkout_box": (445, 676, 746, 728),
        "font_size_date": 17,
        "font_size_time": 15,
    },
}

# ----------------------------
# ARGUMENTS
# ----------------------------

parser = argparse.ArgumentParser()

parser.add_argument("--template-image", required=True)
parser.add_argument("--template-name", required=True)

parser.add_argument("--checkin", required=True)
parser.add_argument("--checkout", required=True)

parser.add_argument("--checkin-time", default="3:00 PM")
parser.add_argument("--checkout-time", default="11:00 AM")

parser.add_argument("--output", default="output.png")

args = parser.parse_args()

# ----------------------------
# LOAD TEMPLATE
# ----------------------------

coords = TEMPLATES[args.template_name]

image = Image.open(args.template_image)
draw = ImageDraw.Draw(image)

# ----------------------------
# FONTS
# ----------------------------

font_bold = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    coords.get("font_size_date", 32)
)

font_regular = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    coords.get("font_size_time", 28)
)

# ----------------------------
# ERASE OLD TEXT
# ----------------------------

draw.rectangle(coords["checkin_box"], fill="white")
draw.rectangle(coords["checkout_box"], fill="white")

# ----------------------------
# DRAW NEW TEXT
# ----------------------------

draw.text(
    coords["checkin_date"],
    args.checkin,
    fill="black",
    font=font_bold
)

draw.text(
    coords["checkin_time"],
    args.checkin_time,
    fill="black",
    font=font_regular
)

draw.text(
    coords["checkout_date"],
    args.checkout,
    fill="black",
    font=font_bold
)

draw.text(
    coords["checkout_time"],
    args.checkout_time,
    fill="black",
    font=font_regular
)

# ----------------------------
# SAVE
# ----------------------------

image.save(args.output)

print(f"Generated: {args.output}")