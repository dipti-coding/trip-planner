import Foundation
import Vision
import UIKit

@objc(OCRModule)
class OCRModule: NSObject {

  @objc
  func recognizeText(_ base64Image: String,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    guard
      let imageData = Data(base64Encoded: base64Image, options: .ignoreUnknownCharacters),
      let image = UIImage(data: imageData),
      let cgImage = image.cgImage
    else {
      reject("OCR_INVALID_IMAGE", "Could not decode base64 image", nil)
      return
    }

    let request = VNRecognizeTextRequest { req, error in
      if let error = error {
        reject("OCR_FAILED", error.localizedDescription, error)
        return
      }
      let lines = (req.results as? [VNRecognizedTextObservation] ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
      resolve(lines.joined(separator: "\n"))
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
      } catch {
        reject("OCR_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
