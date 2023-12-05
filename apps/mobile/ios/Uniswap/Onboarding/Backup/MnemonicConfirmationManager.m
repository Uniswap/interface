//
//  RNTMnemonicTestManager.m
//  Uniswap
//
//  Created by Thomas Thachil 8/1/2022.
//

#import "Uniswap-Swift.h"
#import <React/RCTViewManager.h>
#import "RNSwiftUI-Bridging-Header.h"

@interface MnemonicConfirmationManager : RCTViewManager
@end

@implementation MnemonicConfirmationManager
RCT_EXPORT_MODULE()

RCT_EXPORT_SWIFTUI_PROPERTY(mnemonicId, NSString, MnemonicConfirmationView);
RCT_EXPORT_SWIFTUI_PROPERTY(shouldShowSmallText, BOOL, MnemonicConfirmationView);
RCT_EXPORT_SWIFTUI_CALLBACK(onConfirmComplete, RCTDirectEventBlock, MnemonicConfirmationView);

- (UIView *)view
{
    MnemonicConfirmationView *proxy = [[MnemonicConfirmationView alloc] init];
    UIView *view = [proxy view];
    NSMutableDictionary *storage = [MnemonicConfirmationView storage];
    storage[[NSValue valueWithNonretainedObject:view]] = proxy;
    return view;
}
@end
