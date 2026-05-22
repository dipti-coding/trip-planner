from PIL import Image, ImageDraw, ImageFont
import argparse

# ----------------------------
# TEMPLATE FIELD POSITIONS
# ----------------------------
# Test Airbnb Image Generation Commands: 
# Date format 1
# python generate_test_airbnb_booking.py \
#   --template-image ~/dev/trip-planner/tests/booking_templates/culver-booking.png \
#   --template-name culver \
#   --checkin "Tue, Jan 14" \
#   --checkout "Thu, Jan 16" \
#   --checkin-time "5:00 PM" \
#   --checkout-time "9:00 AM" \
#   --output ~/Downloads/test_airbnb1.png
# # Date format 2
# python generate_test_airbnb_booking.py \
#   --template-image ~/dev/trip-planner/tests/booking_templates/culver-booking.png \
#   --template-name culver \
#   --checkin "2026-06-13" \
#   --checkout "2026-06-15" \
#   --checkin-time "5:00 PM" \
#   --checkout-time "9:00 AM" \
#   --output ~/Downloads/test_airbnb2.png


# ----------------------------

TEMPLATES = {
    "culver": {
        "checkin_date": (90, 185),
        "checkin_time": (90, 235),
        "checkout_date": (390, 185),
        "checkout_time": (390, 235),

        # whiteout boxes
        "checkin_box": (80, 170, 330, 270),
        "checkout_box": (380, 170, 650, 270),
    }
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
    32
)

font_regular = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    28
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