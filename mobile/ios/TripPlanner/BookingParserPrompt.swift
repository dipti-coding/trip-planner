import Foundation

enum BookingParserPrompt {

  static let system =
    "You are a travel booking parser. Extract information from booking confirmation text " +
    "and return ONLY a valid JSON array — no explanation, no markdown, just the JSON."

  static func user(text: String) -> String {
    """
    Extract booking details from the text below. Return a JSON ARRAY where each element \
    is one booking item. Use null for missing fields.

    FLIGHT LEG COUNTING RULES (read carefully):
    - A single nonstop flight with one departure and one arrival is EXACTLY ONE element.
    - Only return multiple flight elements when the passenger must change planes \
      (e.g. LAX→ORD then ORD→STL = two elements). A seat-assignment section that \
      repeats the same route is NOT a separate leg.
    - Do NOT invent a return leg. Only extract flights explicitly shown as departures \
      in this confirmation.
    - For all non-flight booking types, return a single-element array.

    Each element must follow this schema:
    {
      "planType": "<Flight|Hotel|CarReservation|Cruise|Ferry|RailwayRide|BusRide|Restaurant|Activity|Meeting>",
      "title": "<short display title>",
      "startDate": "<departure/check-in datetime in ISO 8601 — use the time value as shown in the text, do not convert timezones>",
      "endDate": "<arrival/check-out datetime in ISO 8601, or null. For flights this is the arrival time, which may appear on the right side of the route display or labeled 'arrives'>",
      "confirmation": "<confirmation code or null>",
      "primaryName": "<airline|hotel|rental co|operator|venue or null>",
      "secondaryInfo": "<flight number only (e.g. WN2400)|room type|car type|event name — NOT a date or route>",
      "origin": "<departure airport IATA code|station|port or null>",
      "destination": "<arrival airport IATA code|station|port or null>",
      "seat": "<seat number or null>",
      "serviceClass": "<Economy|Business|King Suite etc or null>"
    }

    Text:
    \(text)
    """
  }
}
