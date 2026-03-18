//
//  RNCloudStorageBackupsManager.m
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNCloudStorageBackupsManager, RCTEventEmitter)

RCT_EXTERN_METHOD(isCloudStorageAvailable: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(backupMnemonicToCloudStorage: (NSString *)mnemonicId
                  password: (NSString *)password
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restoreMnemonicFromCloudStorage: (NSString *)mnemonicId
                  password: (NSString *)password
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteCloudStorageMnemonicBackup: (NSString *)mnemonicId
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCloudBackupList: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject)

@end
