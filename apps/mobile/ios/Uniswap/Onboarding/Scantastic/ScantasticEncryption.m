//
//  ScantasticEncryption.m
//  Uniswap
//
//  Created by Christine Legge on 1/23/24.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ScantasticEncryption, RCTEventEmitter)

RCT_EXTERN_METHOD(getEncryptedMnemonic: (NSString *)mnemonicId
                  n: (NSString *)n
                  e: (NSString *)e
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

@end
