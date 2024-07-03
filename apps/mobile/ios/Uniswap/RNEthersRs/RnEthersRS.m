//
//  RnEthersBridge.m
//  Uniswap
//
//  Created by Connor McEwen on 10/28/21.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNEthersRS, NSObject)

RCT_EXTERN_METHOD(getMnemonicIds: (RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(importMnemonic: (NSString *)mnemonic
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeMnemonic: (NSString *)mnemonicId
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateAndStoreMnemonic: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAddressesForStoredPrivateKeys: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateAddressForMnemonic: (NSString *)mnemonic
                  derivationIndex: (NSInteger)index
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateAndStorePrivateKey: (NSString *)mnemonicId
                  derivationIndex: (NSInteger)index
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removePrivateKey: (NSString *)address
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signTransactionHashForAddress: (NSString *)address
                  hash: (NSString *)hash
                  chainId: NSNumber
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signMessageForAddress: (NSString *)address
                  message: (NSString *)message
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signHashForAddress: (NSString *)address
                  hash: (NSString *)hash
                  chainId: NSNumber
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

@end
