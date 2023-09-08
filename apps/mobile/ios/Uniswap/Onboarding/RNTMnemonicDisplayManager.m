//
//  RNTMnemonicManager.m
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

#import "Uniswap-Swift.h"
#import <React/RCTViewManager.h>
#import "RNSwiftUI-Bridging-Header.h"

@interface MnemonicDisplayManager : RCTViewManager
@end

@implementation MnemonicDisplayManager
RCT_EXPORT_MODULE()

RCT_EXPORT_SWIFTUI_PROPERTY(mnemonicId, NSString, MnemonicDisplayView);

- (UIView *)view
{
  MnemonicDisplayView *proxy = [[MnemonicDisplayView alloc] init];
  UIView *view = [proxy view];
  NSMutableDictionary *storage = [MnemonicDisplayView storage];
  storage[[NSValue valueWithNonretainedObject:view]] = proxy;
  return view;
}

@end
