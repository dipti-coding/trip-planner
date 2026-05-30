#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OCRModule, NSObject)

RCT_EXTERN_METHOD(recognizeText:(NSString *)base64Image
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
