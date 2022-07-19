//
//  RNICloudBackupsManager.m
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNICloudBackupsManager, NSObject)

RCT_EXTERN_METHOD(isICloudAvailable: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

@end
