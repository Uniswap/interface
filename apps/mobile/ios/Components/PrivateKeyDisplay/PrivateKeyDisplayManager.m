//
//  PrivateKeyDisplayManager.m
//  Uniswap
//
//  Created by Chris Lee on 5/9/2025.
//
#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(PrivateKeyDisplayManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(address, NSString?)
RCT_EXPORT_VIEW_PROPERTY(onHeightMeasured, RCTDirectEventBlock);

@end
