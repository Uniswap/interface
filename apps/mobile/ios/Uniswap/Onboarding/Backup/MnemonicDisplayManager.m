//
//  RNTMnemonicManager.m
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

#import "Uniswap-Swift.h"
#import <React/RCTViewManager.h>

@interface MnemonicDisplayManager : RCTViewManager
@end

@implementation MnemonicDisplayManager
RCT_EXPORT_MODULE(MnemonicDisplay)

RCT_EXPORT_VIEW_PROPERTY(mnemonicId, NSString);
RCT_EXPORT_VIEW_PROPERTY(copyText, NSString);
RCT_EXPORT_VIEW_PROPERTY(copiedText, NSString);
RCT_EXPORT_VIEW_PROPERTY(onHeightMeasured, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onEmptyMnemonic, RCTDirectEventBlock);

- (UIView *)view
{
  return [[MnemonicDisplayView alloc] initWithFrame:CGRectZero];
}

@end
