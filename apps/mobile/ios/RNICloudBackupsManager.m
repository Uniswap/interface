//
//  RNICloudBackupsManager.m
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNICloudBackupsManager, RCTEventEmitter)

RCT_EXTERN_METHOD(isICloudAvailable: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(backupMnemonicToICloud: (NSString *)mnemonicId
                  password: (NSString *)password
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restoreMnemonicFromICloud: (NSString *)mnemonicId
                  password: (NSString *)password
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteICloudMnemonicBackup: (NSString *)mnemonicId
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startFetchingICloudBackups)

RCT_EXTERN_METHOD(stopFetchingICloudBackups)

@end
