//
//  SeedPhraseInputManager.swift
//  Uniswap
//
//  Created by Gary Ye on 9/7/23.
//

#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(SeedPhraseInputManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(targetMnemonicId, NSString?)
RCT_EXPORT_VIEW_PROPERTY(strings, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onHelpTextPress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onInputValidated, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onMnemonicStored, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPasteStart, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPasteEnd, RCTDirectEventBlock);
RCT_EXTERN_METHOD(handleSubmit: (nonnull NSNumber *)node)

@end
