import Foundation
import FoundationModels

// MARK: - Date parser

// Outputs local wall-clock time with no timezone — matches the contract expected by
// fmtTime on the frontend ("YYYY-MM-DDTHH:MM:SS", no Z, no offset).
private let _wallClockFormatter: DateFormatter = {
  let f = DateFormatter()
  f.locale = Locale(identifier: "en_US_POSIX")
  f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
  return f
}()

private let _dateFormats = [
  "yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd",
  "EEEE, MMMM d, yyyy 'at' h:mm a", "EEEE, MMMM d, yyyy",
  "EEE, MMM d, yyyy 'at' h:mm a", "EEE, MMM d, yyyy",
  "MMMM d, yyyy 'at' h:mm a", "MMMM d, yyyy",
  "MMM d, yyyy 'at' h:mm a", "MMM d, yyyy",
  "MMM d 'at' h:mm a", "MMM d h:mm a",
  "h:mm a MMM d, yyyy", "h:mm a MMM d",
  "MMM d", "d MMM yyyy",
  "MM/dd/yyyy", "MM/dd/yy",
  "EEE, MMM d 'at' h:mm a", "EEE, MMM d",
]

private func toISO(_ raw: String) -> String? {
  var s = raw.trimmingCharacters(in: .whitespaces)

  // Strip any timezone designator before parsing. Booking times in screenshots are local
  // wall-clock; keeping Z or ±HH:MM causes the formatter to treat them as UTC and shift
  // the time (e.g. 1:30 PM PDT → stored as 8:30 PM, displayed as 8:30 PM).
  if s.hasSuffix("Z") {
    s = String(s.dropLast())
  } else if s.count >= 6 {
    let tail = s.suffix(6)
    if tail.first == "+" || tail.first == "-" { s = String(s.dropLast(6)) }
  }

  let cal = Calendar.current
  let now = Date()
  let currentYear = cal.component(.year, from: now)
  let oneYearAgo = cal.date(byAdding: .year, value: -1, to: now) ?? now

  for fmt in _dateFormats {
    let df = DateFormatter()
    df.locale = Locale(identifier: "en_US_POSIX")
    df.dateFormat = fmt
    if let date = df.date(from: s) {
      var comps = cal.dateComponents([.year, .month, .day, .hour, .minute], from: date)
      // Fix year-0 (format has no year) or stale year (model hallucinated a past year).
      if (comps.year ?? 0) < 2000 || (cal.date(from: comps).map { $0 < oneYearAgo } ?? false) {
        comps.year = currentYear
        if let nudged = cal.date(from: comps), nudged < now { comps.year = currentYear + 1 }
      }
      return _wallClockFormatter.string(from: cal.date(from: comps) ?? date)
    }
  }
  return nil
}

// MARK: - React Native module

@objc(BookingParserModule)
class BookingParserModule: NSObject {

  @objc
  func isAvailable(_ resolve: RCTPromiseResolveBlock, reject _: RCTPromiseRejectBlock) {
#if targetEnvironment(simulator)
    resolve(false)
    return
#else
    if #available(iOS 26.0, *) {
      if case .available = SystemLanguageModel.default.availability {
        resolve(true)
        return
      }
    }
    resolve(false)
#endif
  }

  @objc
  func runPrompt(_ userPrompt: String,
                 systemPrompt: String,
                 resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 26.0, *) {
      Task {
        do {
          let result = try await Self.runSinglePrompt(userPrompt: userPrompt, systemPrompt: systemPrompt)
          resolve(result)
        } catch {
          reject("PARSE_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      reject("PARSER_NOT_READY", "Apple Foundation Models requires iOS 26 or later", nil)
    }
  }

  @objc
  func parseBookingText(_ text: String,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 26.0, *) {
      Task {
        do {
          let results = try await Self.parseWithFoundationModels(text)
          resolve(results)
        } catch {
          reject("APPLE_INTELLIGENCE_UNAVAILABLE", error.localizedDescription, error)
        }
      }
    } else {
      reject("PARSER_NOT_READY", "Apple Foundation Models requires iOS 26 or later", nil)
    }
  }

  @available(iOS 26.0, *)
  private static func runSinglePrompt(userPrompt: String, systemPrompt: String) async throws -> String {
    switch SystemLanguageModel.default.availability {
    case .unavailable(let reason):
      throw NSError(
        domain: "BookingParser", code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Apple Intelligence unavailable: \(reason)"]
      )
    case .available:
      break
    }
    let session = LanguageModelSession(instructions: systemPrompt)
    do {
      let response = try await session.respond(to: userPrompt)
      return response.content
    } catch {
      throw NSError(
        domain: "BookingParser", code: 5,
        userInfo: [NSLocalizedDescriptionKey: "Could not read the screenshot. Try a clearer booking confirmation image."]
      )
    }
  }

  @available(iOS 26.0, *)
  private static func parseWithFoundationModels(_ text: String) async throws -> [[String: Any]] {
    switch SystemLanguageModel.default.availability {
    case .unavailable(let reason):
      throw NSError(
        domain: "BookingParser", code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Apple Intelligence unavailable: \(reason)"]
      )
    case .available:
      break
    }

    // Truncate to keep well within the on-device model's context window.
    // Booking confirmations rarely need more than this; longer inputs cause GenerationError -1.
    let maxChars = 3_000
    let truncated = text.count > maxChars ? String(text.prefix(maxChars)) : text

    let systemPrompt = "You are a travel booking parser. Extract information from booking confirmation text and return ONLY a valid JSON array — no explanation, no markdown, just the JSON."
    let userPrompt = """
      Extract booking details from the text below. Return a JSON ARRAY where each element \
      is one booking item. Use null for missing fields.

      Return a single-element array for all booking types.

      Each element must follow this schema:
      {
        "planType": "<Flight|Hotel|CarReservation|Cruise|Ferry|RailwayRide|BusRide|Restaurant|Activity|Meeting>",
        "title": "<short display title>",
        "startDate": "<departure/check-in datetime in ISO 8601 — use the time value as shown in the text, do not convert timezones>",
        "endDate": "<arrival/check-out datetime in ISO 8601, or null>",
        "confirmation": "<confirmation code or null>",
        "primaryName": "<airline|hotel|rental co|operator|venue or null>",
        "secondaryInfo": "<flight number only (e.g. WN2400)|room type|car type — NOT a date or route>",
        "origin": "<departure airport IATA code|station|port or null>",
        "destination": "<arrival airport IATA code|station|port or null>",
        "seat": "<seat number or null>",
        "serviceClass": "<Economy|Business|King Suite etc or null>"
      }

      Text:
      \(truncated)
      """
    let session = LanguageModelSession(instructions: systemPrompt)

    do {
      let response = try await session.respond(to: userPrompt)
      return try Self.parseJSONArray(response.content)
    } catch {
      // GenerationError is bridged as NSError; don't expose the raw framework message.
      throw NSError(
        domain: "BookingParser", code: 5,
        userInfo: [NSLocalizedDescriptionKey: "Could not read the screenshot. Try a clearer booking confirmation image."]
      )
    }
  }

  // Extract a JSON array from the model response. Falls back to wrapping a single object
  // in an array if the model returns a bare object instead of an array.
  private static func parseJSONArray(_ raw: String) throws -> [[String: Any]] {
    if let arrStart = raw.firstIndex(of: "["), let arrEnd = raw.lastIndex(of: "]") {
      let jsonString = String(raw[arrStart...arrEnd])
      if let data = jsonString.data(using: .utf8),
         let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
        return try arr.map { try Self.mapPlan($0) }
      }
    }
    // Fallback: model returned a bare object — wrap it
    guard let objStart = raw.firstIndex(of: "{"), let objEnd = raw.lastIndex(of: "}") else {
      throw NSError(domain: "BookingParser", code: 3,
                    userInfo: [NSLocalizedDescriptionKey: "No JSON found in model response"])
    }
    let jsonString = String(raw[objStart...objEnd])
    guard let data = jsonString.data(using: .utf8),
          let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      throw NSError(domain: "BookingParser", code: 4,
                    userInfo: [NSLocalizedDescriptionKey: "Failed to parse model JSON"])
    }
    return [try Self.mapPlan(json)]
  }

  // Map a single parsed JSON object to the dict shape that /from-parsed-bulk expects
  private static func mapPlan(_ json: [String: Any]) throws -> [String: Any] {
    func str(_ key: String) -> String? {
      guard let v = json[key] as? String, !v.isEmpty, v != "null" else { return nil }
      return v
    }

    let pt = str("planType") ?? ""
    var details: [String: Any] = [:]
    func set(_ k: String, _ v: String?) { if let v { details[k] = v } }

    set("confirmation", str("confirmation"))
    set("seat",         str("seat"))

    if let name = str("primaryName") {
      switch pt {
      case "Flight":         set("airline",         name)
      case "Hotel":          set("hotel_name",      name)
      case "CarReservation": set("rental_company",  name)
      case "Cruise":         set("cruise_line",     name)
      default:               set("venue",           name)
      }
    }
    if let info = str("secondaryInfo") {
      switch pt {
      case "Flight":         set("flight_number",   info)
      case "Hotel":          set("room_type",        info)
      case "CarReservation": set("car_type",         info)
      case "Cruise":         set("ship_name",        info)
      case "RailwayRide":    set("train_number",     info)
      default: break
      }
    }
    if let o = str("origin") {
      switch pt {
      case "Flight":                   set("departure_airport", o)
      case "RailwayRide":              set("departure_station", o)
      case "Ferry", "Cruise":          set("port_of_departure", o)
      default:                         set("pickup_location",   o)
      }
    }
    if let d = str("destination") {
      switch pt {
      case "Flight":                   set("arrival_airport",  d)
      case "RailwayRide":              set("arrival_station",  d)
      case "Ferry", "Cruise":          set("port_of_arrival",  d)
      default:                         set("dropoff_location", d)
      }
    }
    if let sc = str("serviceClass") {
      set(["Hotel", "CarReservation"].contains(pt) ? "room_type" : "cabin_class", sc)
    }

    var result: [String: Any] = [
      "type":    pt,
      "title":   str("title") ?? pt,
      "details": details,
    ]
    if let s = str("startDate"), let iso = toISO(s) { result["start_datetime"] = iso }
    if let e = str("endDate"),   let iso = toISO(e) { result["end_datetime"]   = iso }
    return result
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
