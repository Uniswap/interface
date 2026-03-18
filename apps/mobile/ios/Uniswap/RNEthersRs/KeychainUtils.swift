import CryptoKit
import Foundation

@objcMembers
class KeychainUtils: NSObject {
  private static let CAN_CLEAR_KEYCHAIN_ON_REINSTALL_FLAG = "can_clear_keychain_on_reinstall"
  private static let keychain = KeychainSwift(keyPrefix: prefix)

  @objc static func clearKeychain() {
    keychain.clear()
  }

  @objc static func getCanClearKeychainOnReinstall() -> Bool {
    return (keychain.getBool(CAN_CLEAR_KEYCHAIN_ON_REINSTALL_FLAG) == true)
  }

  @objc static func setCanClearKeychainOnReinstall() {
    keychain.set(
      true, forKey: CAN_CLEAR_KEYCHAIN_ON_REINSTALL_FLAG, withAccess: .accessibleWhenUnlockedThisDeviceOnly)
  }
}
