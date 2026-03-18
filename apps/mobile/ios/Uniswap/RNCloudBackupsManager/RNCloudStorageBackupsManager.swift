//
//  RNCloudStorageBackupsManager.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

import Foundation
import CryptoKit

struct CloudStorageMnemonicBackup: Codable {
  let mnemonicId: String
  let encryptedMnemonic: String
  let encryptionSalt: String
  let createdAt: Double
}

enum ICloudBackupError: String, Error  {
  case backupNotFoundError = "backupNotFoundError"
  case backupEncryptionError = "backupEncryptionError"
  case backupDecryptionError = "backupDecryptionError"
  case backupIncorrectPasswordError = "backupIncorrectPasswordError"
  case deleteBackupError = "deleteBackupError"
  case iCloudContainerError = "iCloudContainerError"
  case iCloudError = "iCloudError"
}

@objc(RNCloudStorageBackupsManager)
class RNCloudStorageBackupsManager: NSObject, RCTBridgeModule {
  
  let rnEthersRS = RNEthersRS()
  
  static func moduleName() -> String! {
    return "RNCloudStorageBackupsManager"
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  /**
   Determine if iCloud Documents is available on device
   
   - returns: boolean if iCloud Documents is available or not
   */
  @objc(isCloudStorageAvailable:reject:)
  func isCloudStorageAvailable(resolve: RCTPromiseResolveBlock,
                         reject: RCTPromiseRejectBlock
  ) {
    if FileManager.default.ubiquityIdentityToken == nil {
      return resolve(false)
    } else  {
      return resolve(true)
    }
  }
  
  /**
  Stores mnemonic to iCloud Documents
  
  - parameter mnemonicId: key string associated with mnemonic to backup
  - parameter password: user provided password to encrypt the mnemonic
  - returns: true if successful, otherwise throws an error
  */
 @objc(backupMnemonicToCloudStorage:password:resolve:reject:)
 func backupMnemonicToCloudStorage(
   mnemonicId: String, password: String, resolve: RCTPromiseResolveBlock,
   reject: RCTPromiseRejectBlock
 ) {
   guard let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) else {
     return reject(RNEthersRSError.retrieveMnemonicError.rawValue, "Failed to retrieve mnemonic", RNEthersRSError.retrieveMnemonicError)
   }
   
   // Access Uniswap iCloud Documents container
   guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
     return reject(ICloudBackupError.iCloudError.rawValue, "Failed to find iCloud container", ICloudBackupError.iCloudError)
   }
   
   // Create iCloud container if empty
   if !FileManager.default.fileExists(atPath: containerUrl.path, isDirectory: nil) {
     do {
       try FileManager.default.createDirectory(at: containerUrl, withIntermediateDirectories: true, attributes: nil)
     } catch {
       return reject(ICloudBackupError.iCloudError.rawValue, "Failed to create iCloud container \(error)", ICloudBackupError.iCloudError)
     }
   }
   
   let encryptedMnemonic: String
   let encryptionSalt: String
   do {
     encryptionSalt = generateSalt(length: 16)
     encryptedMnemonic = try encrypt(secret: mnemonic, password: password, salt: encryptionSalt)
   } catch {
     return reject(ICloudBackupError.backupEncryptionError.rawValue, "Failed to password encrypt mnemonic", ICloudBackupError.backupEncryptionError)
   }
   
   // Write backup file to iCloud
   let iCloudFileURL = containerUrl.appendingPathComponent("\(mnemonicId).json")
   do {
     let backup = CloudStorageMnemonicBackup(mnemonicId: mnemonicId, encryptedMnemonic: encryptedMnemonic, encryptionSalt: encryptionSalt, createdAt: Date().timeIntervalSince1970)
     try JSONEncoder().encode(backup).write(to: iCloudFileURL)
     return resolve(true)
   } catch {
     return reject(ICloudBackupError.iCloudError.rawValue, "Failed to write backup file to iCloud", ICloudBackupError.iCloudError)
   }
 }
 
 /**
  
  Attempts to restore mnemonic into native keychain from iCloud backup file. Assumes that the backup file `[mnemonicId].json` has already been downloaded from iCloud Documents using `RNCloudStorageBackupsManager`
  
  - parameter mnemonicId: key string associated with JSON backup file stored in iCloud
  - parameter password: user inputted password used to decrypt backup
  - returns: true if mnemonic successfully restored, otherwise a relevant error will be thrown
  */
 @objc(restoreMnemonicFromCloudStorage:password:resolve:reject:)
 func restoreMnemonicFromCloudStorage(mnemonicId: String, password: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock
 ) {
   // Access Uniswap iCloud Documents container
   guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
     return reject(ICloudBackupError.iCloudError.rawValue, "Failed to find iCloud container", ICloudBackupError.iCloudError)
   }
   
   // Fetch backup file from iCloud
   let iCloudFileURL = containerUrl.appendingPathComponent("\(mnemonicId).json")
   
   guard FileManager.default.fileExists(atPath: iCloudFileURL.path) else {
     return reject(ICloudBackupError.iCloudError.rawValue, "Failed to locate iCloud backup", ICloudBackupError.iCloudError)
   }
   
   let data = try? Data(contentsOf: iCloudFileURL)
   guard let backup = try? JSONDecoder().decode(CloudStorageMnemonicBackup.self, from: data!)  else {
     return reject(ICloudBackupError.iCloudError.rawValue, "Failed to load iCloud backup", ICloudBackupError.iCloudError)
   }
   
   let decryptedMnemonic: String
   do {
     decryptedMnemonic = try decrypt(encryptedSecret: backup.encryptedMnemonic, password: password, salt: backup.encryptionSalt)
   } catch CryptoKitError.authenticationFailure {
     return reject(ICloudBackupError.backupIncorrectPasswordError.rawValue, "Invalid password. Please try again.", ICloudBackupError.backupIncorrectPasswordError)
   } catch {
     return reject(ICloudBackupError.backupDecryptionError.rawValue, "Failed to password decrypt mnemonic", ICloudBackupError.backupDecryptionError)
   }
   
   // Restore mnemonic from backup into native keychain
   let res = rnEthersRS.storeNewMnemonic(mnemonic: decryptedMnemonic, address: backup.mnemonicId)
   if res == nil {
     return reject(RNEthersRSError.storeMnemonicError.rawValue, "Failed to restore mnemonic into native keychain", RNEthersRSError.storeMnemonicError)
   }
   
   return resolve(true)
 }
  
  /**
   Deletes mnemonic backup in iCloud Documents container
   
   - parameter mnemonicId: mnemonic backup filename to delete
   - returns: boolean if deletion successful, otherwise throws error
   */
  @objc(deleteCloudStorageMnemonicBackup:resolve:reject:)
  func deleteCloudStorageMnemonicBackup(mnemonicId: String, resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    // Access Uniswap iCloud Documents container
    guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
      return reject(ICloudBackupError.iCloudContainerError.rawValue, "Failed to find iCloud container", ICloudBackupError.iCloudContainerError)
    }
    
    // Ensure backup file exists
    let iCloudFileURL = containerUrl.appendingPathComponent("\(mnemonicId).json")
    guard FileManager.default.fileExists(atPath: iCloudFileURL.path) else {
      return reject(ICloudBackupError.backupNotFoundError.rawValue, "Failed to locate iCloud backup", ICloudBackupError.backupNotFoundError)
    }
    
    // Delete backup file from iCloud
    DispatchQueue.global(qos: .default).async {
      let fileCoordinator = NSFileCoordinator(filePresenter: nil)
      fileCoordinator.coordinate(writingItemAt: URL(fileURLWithPath: iCloudFileURL.path), options: NSFileCoordinator.WritingOptions.forDeleting, error: nil) {
        url in
        do {
          try FileManager.default.removeItem(at: url)
          return resolve(true)
        } catch {
          return reject(ICloudBackupError.deleteBackupError.rawValue, "Failed to delete iCloud backup", ICloudBackupError.deleteBackupError)
        }
      }
    }
  }
  
  /**
   Starts NSMetadataQuery to discover backup files stored in iCloud Documents. Initializes listeners to handle downloading and sending found backups to JS.
   
   Referenced sample implementation here: https://developer.apple.com/documentation/uikit/documents_data_and_pasteboard/synchronizing_documents_in_the_icloud_environment
   */
  @objc(getCloudBackupList:reject:)
  func getCloudBackupList(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Access Uniswap iCloud Documents container
    guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
        return reject(ICloudBackupError.iCloudError.rawValue, "Failed to find iCloud container", ICloudBackupError.iCloudError)
    }
    
    // Try to list all JSON files in the iCloud Documents container
    do {
      let directoryContents = try FileManager.default.contentsOfDirectory(at: containerUrl, includingPropertiesForKeys: nil)
      
      // Filter only .json files
      let jsonFiles = directoryContents.filter { $0.pathExtension == "json" }
      
      if jsonFiles.isEmpty {
        return reject(ICloudBackupError.iCloudError.rawValue, "No backup files found", ICloudBackupError.iCloudError)
      }
      
      // Serializable type to send it via bridge
      var backups = [[String : Any]]()
        
        for file in jsonFiles {
          if let data = try? Data(contentsOf: file.absoluteURL),
            let backup = try? JSONDecoder().decode(CloudStorageMnemonicBackup.self, from: data) {
            backups.append([
              "mnemonicId": backup.mnemonicId,
              "createdAt": backup.createdAt
            ])
          } else {
            print("Error reading or decoding iCloud backup JSON at \(file.absoluteURL)")
          }
        }
      
        return resolve(backups)
        
    } catch {
        return reject(ICloudBackupError.iCloudError.rawValue, "Failed to read iCloud directory", ICloudBackupError.iCloudError)
    }
  }
}
