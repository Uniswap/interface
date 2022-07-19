//
//  RNICloudBackupsManager.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

import Foundation

struct ICloudMnemonicBackup: Codable {
  let mnemonicId: String
  let mnemonic: String
  let isPinEncrypted: Bool
  let createdAt: Double
}

@objc(RNICloudBackupsManager)
class RNICloudBackupsManager: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  /**
   Determine if iCloud Documents is available on device
   
   - returns: boolean if iCloud Documents is available or not
   */
  @objc(isICloudAvailable:reject:)
  func isICloudAvailable(resolve: RCTPromiseResolveBlock,
                         reject: RCTPromiseRejectBlock
  ) {
    if FileManager.default.ubiquityIdentityToken == nil {
      return resolve(false)
    } else  {
      return resolve(true)
    }
  }
  
}
