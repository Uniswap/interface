import Foundation
import XCTest
@testable import Uniswap

final class CloudBackupFileReaderTests: XCTestCase {
  private var directory: URL!

  override func setUpWithError() throws {
    directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  override func tearDownWithError() throws {
    try FileManager.default.removeItem(at: directory)
  }

  private func writeBackup(_ mnemonicId: String) throws -> URL {
    let url = directory.appendingPathComponent("\(mnemonicId).json")
    let backup = CloudStorageMnemonicBackup(
      mnemonicId: mnemonicId, encryptedMnemonic: "encrypted-test-data",
      encryptionSalt: "test-salt", createdAt: 1
    )
    try JSONEncoder().encode(backup).write(to: url)
    return url
  }

  func testDiscoveryExcludesLocalOnlyBackupsWithoutDeletingThem() throws {
    let localOnly = try writeBackup("local-only")
    let uploaded = try writeBackup("uploaded")
    let reader = CloudBackupFileReader(isUploaded: { $0 == uploaded })

    XCTAssertEqual(try reader.backups(in: directory).map(\.mnemonicId), ["uploaded"])
    XCTAssertTrue(FileManager.default.fileExists(atPath: localOnly.path))
  }

  func testRestoreRejectsLocalOnlyBackupEvenIfItsJSONIsValid() throws {
    let url = try writeBackup("local-only")
    let reader = CloudBackupFileReader(isUploaded: { _ in false })

    XCTAssertThrowsError(try reader.readBackup(at: url)) { error in
      XCTAssertEqual(error as? ICloudBackupError, .backupUploadNotConfirmedError)
    }
    XCTAssertTrue(FileManager.default.fileExists(atPath: url.path))
  }

  func testDelayedUploadBecomesDiscoverableAndRestorableOnceConfirmed() throws {
    let url = try writeBackup("delayed")
    var uploaded = false
    let reader = CloudBackupFileReader(isUploaded: { _ in uploaded })

    XCTAssertTrue(try reader.backups(in: directory).isEmpty)
    XCTAssertThrowsError(try reader.readBackup(at: url))

    uploaded = true
    XCTAssertEqual(try reader.backups(in: directory).map(\.mnemonicId), ["delayed"])
    XCTAssertEqual(try reader.readBackup(at: url).mnemonicId, "delayed")
  }

  func testUnavailableUploadMetadataDoesNotConfirmABackup() throws {
    let url = try writeBackup("unknown")
    let reader = CloudBackupFileReader(isUploaded: { _ in throw CocoaError(.fileReadUnknown) })

    XCTAssertTrue(try reader.backups(in: directory).isEmpty)
    XCTAssertThrowsError(try reader.readBackup(at: url)) { error in
      XCTAssertEqual(error as? ICloudBackupError, .backupUploadNotConfirmedError)
    }
  }

  func testDiscoveryIgnoresMalformedAndNonJSONFiles() throws {
    _ = try writeBackup("uploaded")
    try Data("invalid-json".utf8).write(to: directory.appendingPathComponent("malformed.json"))
    try Data("other-file".utf8).write(to: directory.appendingPathComponent("other.txt"))
    let reader = CloudBackupFileReader(isUploaded: { _ in true })

    XCTAssertEqual(try reader.backups(in: directory).map(\.mnemonicId), ["uploaded"])
  }
}
