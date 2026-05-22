from PIL import Image, ImageDraw, ImageFont
import argparse

# -----------------------------------
# TEMPLATE CONFIGS
# -----------------------------------
# Test Flight Generation Commands
# python generate_test_flight_booking.py \
#   --template-image ~/dev/trip-planner/tests/booking_templates/british-flight.png \
#   --flight1-number "AA0272" \
#   --flight1-depart-date "15 June 2026" \
#   --flight1-depart-time "09:25" \
#   --flight1-depart-airport "Los Angeles (CA)" \
#   --flight1-arrive-date "15 June 2026" \
#   --flight1-arrive-time "13:16" \
#   --flight1-arrive-airport "Kahului (HI)" \
#   --flight2-number "AA0255" \
#   --flight2-depart-date "16 July 2026" \
#   --flight2-depart-time "14:46" \
#   --flight2-depart-airport "Kahului (HI)" \
#   --flight2-arrive-date "16 July 2026" \
#   --flight2-arrive-time "22:18" \
#   --flight2-arrive-airport "Los Angeles (CA)" \
#   --output ~/Downloads/test_flight1.png

# python generate_test_flight_booking.py \
#   --template-image ~/dev/trip-planner/tests/booking_templates/british-flight.png \
#   --flight1-number "AA0272" \
#   --flight1-depart-date "2026-06-15" \
#   --flight1-depart-time "09:25" \
#   --flight1-depart-airport "Los Angeles (CA)" \
#   --flight1-arrive-date "2026-06-15" \
#   --flight1-arrive-time "13:16" \
#   --flight1-arrive-airport "Kahului (HI)" \
#   --flight2-number "AA0255" \
#   --flight2-depart-date "2026-07-16" \
#   --flight2-depart-time "14:46" \
#   --flight2-depart-airport "Kahului (HI)" \
#   --flight2-arrive-date "2026-07-16" \
#   --flight2-arrive-time "22:18" \
#   --flight2-arrive-airport "Los Angeles (CA)" \
#   --output ~/Downloads/test_flight2.png

TEMPLATES = {
    "flight": {

        # FIRST FLIGHT
        "flight1_number": (75, 95),
        "flight1_depart_date": (80, 150),
        "flight1_depart_time": (80, 195),
        "flight1_depart_airport": (80, 255),

        "flight1_arrive_date": (365, 150),
        "flight1_arrive_time": (365, 195),
        "flight1_arrive_airport": (365, 255),

        # SECOND FLIGHT
        "flight2_number": (75, 350),
        "flight2_depart_date": (80, 410),
        "flight2_depart_time": (80, 455),
        "flight2_depart_airport": (80, 515),

        "flight2_arrive_date": (365, 410),
        "flight2_arrive_time": (365, 455),
        "flight2_arrive_airport": (365, 515),

        # WHITEOUT REGIONS
        "flight1_box": (60, 80, 650, 310),
        "flight2_box": (60, 335, 650, 575),
    }
}

# -----------------------------------
# ARGUMENTS
# -----------------------------------

parser = argparse.ArgumentParser()

parser.add_argument("--template-image", required=True)
parser.add_argument("--template-name", default="flight")

# FLIGHT 1
parser.add_argument("--flight1-number", required=True)
parser.add_argument("--flight1-depart-date", required=True)
parser.add_argument("--flight1-depart-time", required=True)
parser.add_argument("--flight1-depart-airport", required=True)

parser.add_argument("--flight1-arrive-date", required=True)
parser.add_argument("--flight1-arrive-time", required=True)
parser.add_argument("--flight1-arrive-airport", required=True)

# FLIGHT 2
parser.add_argument("--flight2-number", required=True)
parser.add_argument("--flight2-depart-date", required=True)
parser.add_argument("--flight2-depart-time", required=True)
parser.add_argument("--flight2-depart-airport", required=True)

parser.add_argument("--flight2-arrive-date", required=True)
parser.add_argument("--flight2-arrive-time", required=True)
parser.add_argument("--flight2-arrive-airport", required=True)

parser.add_argument("--output", default="flight_output.png")

args = parser.parse_args()

# -----------------------------------
# LOAD IMAGE
# -----------------------------------

coords = TEMPLATES[args.template_name]

image = Image.open(args.template_image)
draw = ImageDraw.Draw(image)

# -----------------------------------
# FONTS
# -----------------------------------

font_large = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    34
)

font_medium = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    24
)

font_small = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    26
)

# -----------------------------------
# ERASE EXISTING TEXT
# -----------------------------------

draw.rectangle(coords["flight1_box"], fill="white")
draw.rectangle(coords["flight2_box"], fill="white")

# -----------------------------------
# DRAW FLIGHT 1
# -----------------------------------

draw.text(
    coords["flight1_number"],
    args.flight1_number,
    fill="black",
    font=font_small
)

draw.text(
    coords["flight1_depart_date"],
    args.flight1_depart_date,
    fill="gray",
    font=font_medium
)

draw.text(
    coords["flight1_depart_time"],
    args.flight1_depart_time,
    fill="#1f355e",
    font=font_large
)

draw.text(
    coords["flight1_depart_airport"],
    args.flight1_depart_airport,
    fill="gray",
    font=font_small
)

draw.text(
    coords["flight1_arrive_date"],
    args.flight1_arrive_date,
    fill="gray",
    font=font_medium
)

draw.text(
    coords["flight1_arrive_time"],
    args.flight1_arrive_time,
    fill="#1f355e",
    font=font_large
)

draw.text(
    coords["flight1_arrive_airport"],
    args.flight1_arrive_airport,
    fill="gray",
    font=font_small
)

# -----------------------------------
# DRAW FLIGHT 2
# -----------------------------------

draw.text(
    coords["flight2_number"],
    args.flight2_number,
    fill="black",
    font=font_small
)

draw.text(
    coords["flight2_depart_date"],
    args.flight2_depart_date,
    fill="gray",
    font=font_medium
)

draw.text(
    coords["flight2_depart_time"],
    args.flight2_depart_time,
    fill="#1f355e",
    font=font_large
)

draw.text(
    coords["flight2_depart_airport"],
    args.flight2_depart_airport,
    fill="gray",
    font=font_small
)

draw.text(
    coords["flight2_arrive_date"],
    args.flight2_arrive_date,
    fill="gray",
    font=font_medium
)

draw.text(
    coords["flight2_arrive_time"],
    args.flight2_arrive_time,
    fill="#1f355e",
    font=font_large
)

draw.text(
    coords["flight2_arrive_airport"],
    args.flight2_arrive_airport,
    fill="gray",
    font=font_small
)

# -----------------------------------
# SAVE OUTPUT
# -----------------------------------

image.save(args.output)

print(f"Generated: {args.output}")