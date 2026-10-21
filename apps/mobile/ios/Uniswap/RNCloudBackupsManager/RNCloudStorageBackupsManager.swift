//
//  RNCloudStorageBackupsManager.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

import Foundation
import CryptoKit
import React

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
  case iCloudQuotaExceededError = "iCloudQuotaExceededError"
  case backupUploadError = "backupUploadError"
  case backupUploadNotConfirmedError = "backupUploadNotConfirmedError"
  case backupInProgressError = "backupInProgressError"
}

/// A retained local file is not a cloud backup until iCloud confirms it has been uploaded.
struct CloudBackupFileReader {
  private let isUploaded: (URL) throws -> Bool

  init(isUploaded: @escaping (URL) throws -> Bool = { url in
    try url.resourceValues(forKeys: [.ubiquitousItemIsUploadedKey]).ubiquitousItemIsUploaded == true
  }) {
    self.isUploaded = isUploaded
  }

  func readBackup(at url: URL) throws -> CloudStorageMnemonicBackup {
    guard (try? isUploaded(url)) == true else {
      throw ICloudBackupError.backupUploadNotConfirmedError
    }
    return try JSONDecoder().decode(CloudStorageMnemonicBackup.self, from: Data(contentsOf: url))
  }

  func backups(in directory: URL) throws -> [CloudStorageMnemonicBackup] {
    let files = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)
    return files.filter { $0.pathExtension == "json" }.compactMap { try? readBackup(at: $0) }
  }
}

/**
 Observes a file in the iCloud ubiquity container until iCloud reports what happened to it.

 Writing into the container only queues an upload: the transfer runs out of process in the iCloud
 daemon and there is no completion callback for it, so `NSMetadataQuery` is the only public way to
 learn the result.
 */
private final class CloudBackupUploadObserver: NSObject {
  enum Outcome {
    /// iCloud confirmed the file is in the cloud.
    case uploaded
    /// iCloud gave up on this revision (for example the account is out of storage) and will not retry.
    case failed(NSError)
    /// Still in flight. It may yet succeed, so the caller must not delete the local file.
    case timedOut
  }

  private let fileURL: URL
  private let writtenAt: Date
  private let tolerance: TimeInterval
  private let timeout: TimeInterval
  private let query = NSMetadataQuery()

  private var completion: ((Outcome) -> Void)?
  private var timeoutWorkItem: DispatchWorkItem?

  init(fileURL: URL, writtenAt: Date, tolerance: TimeInterval, timeout: TimeInterval) {
    self.fileURL = fileURL
    self.writtenAt = writtenAt
    self.tolerance = tolerance
    self.timeout = timeout
    super.init()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  /**
   Starts observing. `completion` is invoked exactly once, on the main queue.

   Must be called on the main queue: `NSMetadataQuery` delivers its notifications on the run loop it
   is started on, and a background queue has none.
   */
  func start(completion: @escaping (Outcome) -> Void) {
    dispatchPrecondition(condition: .onQueue(.main))
    self.completion = completion

    // The backup lives in the container root rather than its Documents directory, so it belongs to
    // the data scope.
    query.searchScopes = [NSMetadataQueryUbiquitousDataScope]
    query.predicate = NSPredicate(format: "%K == %@", NSMetadataItemFSNameKey, fileURL.lastPathComponent)
    query.valueListAttributes = [
      NSMetadataUbiquitousItemIsUploadedKey,
      NSMetadataUbiquitousItemUploadingErrorKey,
      NSMetadataItemFSContentChangeDateKey,
    ]

    NotificationCenter.default.addObserver(
      self, selector: #selector(queryDidUpdate), name: .NSMetadataQueryDidFinishGathering, object: query
    )
    NotificationCenter.default.addObserver(
      self, selector: #selector(queryDidUpdate), name: .NSMetadataQueryDidUpdate, object: query
    )

    let workItem = DispatchWorkItem { [weak self] in
      self?.finish(with: .timedOut)
    }
    timeoutWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + timeout, execute: workItem)

    query.start()
  }

  @objc private func queryDidUpdate() {
    query.disableUpdates()
    let outcome = currentOutcome()
    query.enableUpdates()

    if let outcome = outcome {
      finish(with: outcome)
    }
  }

  /**
   Returns nil while the result is still undecided, which includes the item not being indexed yet.
   That is the normal state for the first notification after a write and must not be read as failure.
   */
  private func currentOutcome() -> Outcome? {
    guard let item = matchingItem() else {
      return nil
    }

    // Metadata describing the previously uploaded revision can still be in the index when the query
    // starts. Trusting it would confirm a backup whose new contents never left the device.
    guard let changeDate = item.value(forAttribute: NSMetadataItemFSContentChangeDateKey) as? Date,
          changeDate >= writtenAt.addingTimeInterval(-tolerance) else {
      return nil
    }

    if let uploadingError = item.value(forAttribute: NSMetadataUbiquitousItemUploadingErrorKey) as? NSError {
      return .failed(uploadingError)
    }

    if item.value(forAttribute: NSMetadataUbiquitousItemIsUploadedKey) as? Bool == true {
      return .uploaded
    }

    return nil
  }

  private func matchingItem() -> NSMetadataItem? {
    for case let item as NSMetadataItem in query.results {
      guard let itemURL = item.value(forAttribute: NSMetadataItemURLKey) as? URL else {
        continue
      }
      if itemURL.lastPathComponent == fileURL.lastPathComponent {
        return item
      }
    }
    return nil
  }

  private func finish(with outcome: Outcome) {
    dispatchPrecondition(condition: .onQueue(.main))

    // Both a query update and the timeout can reach this, so the first one settles it.
    guard let completion = completion else {
      return
    }
    self.completion = nil

    timeoutWorkItem?.cancel()
    timeoutWorkItem = nil
    NotificationCenter.default.removeObserver(self)
    query.stop()

    completion(outcome)
  }
}

@objc(RNCloudStorageBackupsManager)
class RNCloudStorageBackupsManager: NSObject, RCTBridgeModule {
  
  let rnEthersRS = RNEthersRS()

  /// How long to wait for iCloud to confirm the upload. The payload is a few hundred bytes and a
  /// quota rejection comes back before any transfer, so reaching this means the upload is blocked
  /// rather than slow. Kept well above the few seconds iCloud needs to index the file and pick it
  /// up, since undershooting that reports "unconfirmed" to users whose backup is fine.
  private static let uploadConfirmationTimeout: TimeInterval = 30

  /// Slack when comparing the file's recorded change date against the write we just made, so that
  /// filesystem and metadata timestamps that differ slightly still count as the same revision.
  private static let changeDateTolerance: TimeInterval = 1

  /// Only mutated on the main queue, alongside the observers themselves.
  private var uploadObservers = Set<CloudBackupUploadObserver>()

  private var backupsInFlight = Set<String>()
  private let backupsInFlightLock = NSLock()
  
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
  Stores mnemonic to iCloud Documents and waits for iCloud to confirm the upload.

  Resolving as soon as the file is written would report success for a backup that only exists on the
  device, which is what happens when the account is out of iCloud storage.
  
  - parameter mnemonicId: key string associated with mnemonic to backup
  - parameter password: user provided password to encrypt the mnemonic
  - returns: true once iCloud confirms the backup was uploaded, otherwise throws an error
  */
 @objc(backupMnemonicToCloudStorage:password:resolve:reject:)
 func backupMnemonicToCloudStorage(
   mnemonicId: String, password: String, resolve: @escaping RCTPromiseResolveBlock,
   reject: @escaping RCTPromiseRejectBlock
 ) {
   // A second call for the same mnemonic while the first is still awaiting confirmation would
   // overwrite the file mid-flight, and the first call would then confirm the other one's contents.
   guard claimBackupSlot(mnemonicId: mnemonicId) else {
     return reject(
       ICloudBackupError.backupInProgressError.rawValue,
       "A backup for this recovery phrase is already in progress",
       ICloudBackupError.backupInProgressError
     )
   }

   let fail: (ICloudBackupError, String) -> Void = { [weak self] error, message in
     self?.releaseBackupSlot(mnemonicId: mnemonicId)
     reject(error.rawValue, message, error)
   }
   
   guard let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) else {
     releaseBackupSlot(mnemonicId: mnemonicId)
     return reject(RNEthersRSError.retrieveMnemonicError.rawValue, "Failed to retrieve mnemonic", RNEthersRSError.retrieveMnemonicError)
   }
   
   // Access Uniswap iCloud Documents container
   guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
     return fail(.iCloudError, "Failed to find iCloud container")
   }
   
   // Create iCloud container if empty
   if !FileManager.default.fileExists(atPath: containerUrl.path, isDirectory: nil) {
     do {
       try FileManager.default.createDirectory(at: containerUrl, withIntermediateDirectories: true, attributes: nil)
     } catch {
       return fail(.iCloudError, "Failed to create iCloud container \(error)")
     }
   }
   
   let encryptedMnemonic: String
   let encryptionSalt: String
   do {
     encryptionSalt = generateSalt(length: 16)
     encryptedMnemonic = try encrypt(secret: mnemonic, password: password, salt: encryptionSalt)
   } catch {
     return fail(.backupEncryptionError, "Failed to password encrypt mnemonic")
   }
   
   let iCloudFileURL = containerUrl.appendingPathComponent("\(mnemonicId).json")

   let backupData: Data
   do {
     let backup = CloudStorageMnemonicBackup(mnemonicId: mnemonicId, encryptedMnemonic: encryptedMnemonic, encryptionSalt: encryptionSalt, createdAt: Date().timeIntervalSince1970)
     backupData = try JSONEncoder().encode(backup)
   } catch {
     return fail(.backupEncryptionError, "Failed to encode backup")
   }

   let writeStartedAt = Date()
   guard writeBackupFile(data: backupData, to: iCloudFileURL) else {
     return fail(.iCloudError, "Failed to write backup file to iCloud")
   }

   // Tells the revision just written apart from an older uploaded one at the same path.
   let modificationDate = (try? FileManager.default.attributesOfItem(atPath: iCloudFileURL.path))?[.modificationDate] as? Date
   let writtenAt = modificationDate ?? writeStartedAt

   DispatchQueue.main.async {
     let observer = CloudBackupUploadObserver(
       fileURL: iCloudFileURL,
       writtenAt: writtenAt,
       tolerance: Self.changeDateTolerance,
       timeout: Self.uploadConfirmationTimeout
     )
     self.uploadObservers.insert(observer)

     observer.start { [weak self] outcome in
       self?.uploadObservers.remove(observer)
       self?.releaseBackupSlot(mnemonicId: mnemonicId)

       switch outcome {
       case .uploaded:
         resolve(true)

       case .failed(let uploadingError):
         // The file is deliberately left in place. Removing it propagates the delete to iCloud, and
         // there is no reliable way to know that iCloud holds no earlier copy: an item that was never
         // downloaded to this device, or whose metadata has not synced yet, is invisible locally.

         // Carried into the JS error so a misclassified failure is diagnosable from logs instead of
         // needing a local repro with a full iCloud account.
         let failureDetail = "domain=\(uploadingError.domain) code=\(uploadingError.code): \(uploadingError.localizedDescription)"

         if RNCloudStorageBackupsManager.isQuotaError(uploadingError) {
           reject(
             ICloudBackupError.iCloudQuotaExceededError.rawValue,
             "Not enough iCloud storage to upload the backup (\(failureDetail))",
             ICloudBackupError.iCloudQuotaExceededError
           )
         } else {
           reject(
             ICloudBackupError.backupUploadError.rawValue,
             "iCloud failed to upload the backup: \(failureDetail)",
             ICloudBackupError.backupUploadError
           )
         }

       case .timedOut:
         // The upload may still complete on its own, so the file stays put and the user is told the
         // backup could not be confirmed rather than that it failed.
         reject(
           ICloudBackupError.backupUploadNotConfirmedError.rawValue,
           "Timed out waiting for iCloud to confirm the backup",
           ICloudBackupError.backupUploadNotConfirmedError
         )
       }
     }
   }
 }

  /**
   iCloud does not always report a quota failure as a top-level `NSUbiquitousFileNotUploadedDueToQuotaError`.
   It can arrive wrapped, with the real cause further down the underlying-error chain, so the whole
   chain is searched rather than just the outermost error.
   */
  private static func isQuotaError(_ error: NSError) -> Bool {
    if error.domain == NSCocoaErrorDomain,
       error.code == CocoaError.Code.ubiquitousFileNotUploadedDueToQuota.rawValue {
      return true
    }

    var underlying: [NSError] = []
    if let single = error.userInfo[NSUnderlyingErrorKey] as? NSError {
      underlying.append(single)
    }
    if let multiple = error.userInfo[NSMultipleUnderlyingErrorsKey] as? [NSError] {
      underlying.append(contentsOf: multiple)
    }

    return underlying.contains { isQuotaError($0) }
  }

  /**
   Writes the backup through a file coordinator and atomically.

   The iCloud daemon reads this file out of process as soon as it appears, so an uncoordinated
   partial write can be picked up and uploaded as-is.
   */
  private func writeBackupFile(data: Data, to url: URL) -> Bool {
    var coordinationError: NSError?
    var writeSucceeded = false

    NSFileCoordinator().coordinate(writingItemAt: url, options: .forReplacing, error: &coordinationError) { coordinatedURL in
      do {
        try data.write(to: coordinatedURL, options: .atomic)
        writeSucceeded = true
      } catch {
        writeSucceeded = false
      }
    }

    return writeSucceeded && coordinationError == nil
  }

  /// Returns false when a backup for this mnemonic is already awaiting confirmation.
  private func claimBackupSlot(mnemonicId: String) -> Bool {
    backupsInFlightLock.lock()
    defer { backupsInFlightLock.unlock() }
    return backupsInFlight.insert(mnemonicId).inserted
  }

  private func releaseBackupSlot(mnemonicId: String) {
    backupsInFlightLock.lock()
    defer { backupsInFlightLock.unlock() }
    backupsInFlight.remove(mnemonicId)
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
   
   let backup: CloudStorageMnemonicBackup
   do {
     // Re-check even after discovery: restoring a local-only file would mark the account cloud-backed.
     backup = try CloudBackupFileReader().readBackup(at: iCloudFileURL)
   } catch ICloudBackupError.backupUploadNotConfirmedError {
     return reject(
       ICloudBackupError.backupUploadNotConfirmedError.rawValue,
       "Could not confirm this backup was uploaded to iCloud",
       ICloudBackupError.backupUploadNotConfirmedError
     )
   } catch {
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
   Lists locally readable backup files whose upload to iCloud has been confirmed.
   */
  @objc(getCloudBackupList:reject:)
  func getCloudBackupList(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Access Uniswap iCloud Documents container
    guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil) else {
        return reject(ICloudBackupError.iCloudError.rawValue, "Failed to find iCloud container", ICloudBackupError.iCloudError)
    }
    
    // Failed and timed-out uploads stay on disk, but must not appear as completed cloud backups.
    do {
      let backups = try CloudBackupFileReader().backups(in: containerUrl)

      if backups.isEmpty {
        return reject(ICloudBackupError.iCloudError.rawValue, "No backup files found", ICloudBackupError.iCloudError)
      }

      return resolve(backups.map { backup -> [String: Any] in
        ["mnemonicId": backup.mnemonicId, "createdAt": backup.createdAt]
      })
        
    } catch {
        return reject(ICloudBackupError.iCloudError.rawValue, "Failed to read iCloud directory", ICloudBackupError.iCloudError)
    }
  }
}
