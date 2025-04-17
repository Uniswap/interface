//
//  EmbeddedWallet.m
//  Uniswap
//
//  Created by Bruno R. Nunes on 11/5/24.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EmbeddedWallet, RCTEventEmitter)

RCT_EXTERN_METHOD(decryptMnemonicForPublicKey:(NSString *)encryptedMnemonic
                  publicKeyBase64:(NSString *)publicKeyBase64
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(generateKeyPair:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end
