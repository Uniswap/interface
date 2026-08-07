//
//  RNTMnemonicTestManager.m
//  Uniswap
//
//  Created by Thomas Thachil 8/1/2022.
//

#import "Uniswap-Swift.h"
#import <React/RCTViewManager.h>

@interface MnemonicConfirmationManager : RCTViewManager
@end

@implementation MnemonicConfirmationManager
RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(mnemonicId, NSString);
RCT_EXPORT_VIEW_PROPERTY(shouldShowSmallText, BOOL);
RCT_EXPORT_VIEW_PROPERTY(onConfirmComplete, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(selectedWordPlaceholder, NSString);
RCT_EXPORT_VIEW_PROPERTY(pageStart, NSInteger);
RCT_EXPORT_VIEW_PROPERTY(pageSize, NSInteger);
RCT_EXPORT_VIEW_PROPERTY(currentPage, NSInteger);
RCT_EXPORT_VIEW_PROPERTY(totalPages, NSInteger);

- (UIView *)view
{
    return [[MnemonicConfirmationView alloc] initWithFrame:CGRectZero];
}
@end
