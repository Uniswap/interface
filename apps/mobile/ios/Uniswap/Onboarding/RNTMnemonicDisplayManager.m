//
//  RNTMnemonicManager.m
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

#import <React/RCTViewManager.h>
#import "Uniswap-Swift.h"

@interface MnemonicDisplayManager : RCTViewManager
@end

@implementation MnemonicDisplayManager
RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[MnemonicDisplayView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(mnemonicId, NSString)

@end
