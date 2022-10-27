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
RCT_EXTERN_METHOD(reconnectAccountSessions)
RCT_EXTERN_METHOD(disconnectAllForAccount: (NSString *)account)
RCT_EXTERN_METHOD(connect: (NSString *)url)
RCT_EXTERN_METHOD(settlePendingSession: (NSInteger)chainId account: (NSString *)account approved: (BOOL)approved)
RCT_EXTERN_METHOD(disconnect: (NSString *)topic)
RCT_EXTERN_METHOD(changeChainId: (NSString *)topic chainId: (NSInteger)chainId)
RCT_EXTERN_METHOD(sendSignature: (NSString *)requestInternalId
                  signature: (NSString *)signature)
RCT_EXTERN_METHOD(confirmSwitchChainRequest: (NSString* )requestInternalId)
RCT_EXTERN_METHOD(rejectRequest: (NSString* )requestInternalId)
RCT_EXTERN_METHOD(isValidWCUrl: (NSString *)url resolver: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)


@end
