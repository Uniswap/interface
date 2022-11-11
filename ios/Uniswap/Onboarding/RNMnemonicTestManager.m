//
//  RNTMnemonicTestManager.m
//  Uniswap
//
//  Created by Thomas Thachil 8/1/2022.
//

#import "Uniswap-Swift.h"
#import <React/RCTViewManager.h>
#import "RNSwiftUI-Bridging-Header.h"

@interface MnemonicTestManager : RCTViewManager
@end

@implementation MnemonicTestManager
RCT_EXPORT_MODULE()

RCT_EXPORT_SWIFTUI_PROPERTY(mnemonicId, NSString, MnemonicTestView);
RCT_EXPORT_SWIFTUI_PROPERTY(shouldShowSmallText, BOOL, MnemonicTestView);
RCT_EXPORT_SWIFTUI_CALLBACK(onTestComplete, RCTDirectEventBlock, MnemonicTestView);

- (UIView *)view
{
    MnemonicTestView *proxy = [[MnemonicTestView alloc] init];
    UIView *view = [proxy view];
    NSMutableDictionary *storage = [MnemonicTestView storage];
    storage[[NSValue valueWithNonretainedObject:view]] = proxy;
    return view;
}
@end
