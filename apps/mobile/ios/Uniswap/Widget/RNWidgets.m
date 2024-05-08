//
//  RNWidgets.m
//  Uniswap
//
//  Created by Eric Huang on 8/2/23.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNWidgets, NSObject)

RCT_EXTERN_METHOD(hasWidgetsInstalled: (RCTPromiseResolveBlock *)resolve
                  reject:(RCTPromiseRejectBlock *)reject)

@end
