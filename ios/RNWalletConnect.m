//
//  RNWalletConnect.m
//  Uniswap
//
//  Created by Tina Zheng on 3/7/22.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNWalletConnect, RCTEventEmitter)

RCT_EXTERN_METHOD(initialize: (NSArray *)supportedChainIds)
RCT_EXTERN_METHOD(reconnectAccountSessions: (NSArray *)accounts)
RCT_EXTERN_METHOD(connect: (NSString *)url account: (NSString *) account)
RCT_EXTERN_METHOD(disconnect: (NSString *)topic account: (NSString *) account)
RCT_EXTERN_METHOD(changeChainId: (NSString *)topic chainId: (NSInteger)chainId account: (NSString *)account)
RCT_EXTERN_METHOD(sendSignature: (NSString *)requestInternalId
                  signature: (NSString *)signature
                  account: (NSString *)account)
RCT_EXTERN_METHOD(rejectRequest: (NSString* )requestInternalId
                  account: (NSString *)account)

@end
