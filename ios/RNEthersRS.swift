//
//  RNEthers.swift
//  Uniswap
//
//  Created by Connor McEwen on 10/28/21.
//

import Foundation

// TODO(cmcewen): move constants to another file
let prefix = "com.uniswap.mobile.dev"
let mnemonicPrefix = ".mnemonic."
let privateKeyPrefix = ".privateKey."
let entireMnemonicPrefix = prefix + mnemonicPrefix
let entirePrivateKeyPrefix = prefix + privateKeyPrefix

@objc(RNEthersRS)

class RNEthersRS: NSObject {
  private let keychain = KeychainSwift(keyPrefix: prefix)
  // TODO: LRU cache to ensure we don't create too many (unlikely to happen)
  private var walletCache: [String: OpaquePointer] = [:]

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(getMnemonicIds:reject:)
  func getMnemonicIds(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonicIds = keychain.allKeys.filter { key in
      key.contains(mnemonicPrefix)
    }.map { key in
      key.replacingOccurrences(of: entireMnemonicPrefix, with: "")
    }
    resolve(mnemonicIds)
  }

  @objc(importMnemonic:address:resolve:reject:)
  func importMnemonic(
    mnemonic: String, address: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {

    let res = storeNewMnemonic(mnemonic: mnemonic, address: address)
    if res != nil {
      resolve(res)
      return
    }
    let err = NSError.init()
    reject("error", "error", err)
    return
  }

  @objc(generateAndStoreMnemonic:reject:)
  func generateAndStoreMnemonic(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonic_ptr = generate_mnemonic()
    let mnemonic_str = String(cString: mnemonic_ptr.mnemonic!)
    let address_str = String(cString: mnemonic_ptr.address!)
    let res = storeNewMnemonic(mnemonic: mnemonic_str, address: address_str)
    mnemonic_free(mnemonic_ptr)
    resolve(res)
  }

  func storeNewMnemonic(mnemonic: String, address: String) -> String? {
    let newMnemonicKey = mnemonicPrefix + address
    let checkStored = retrieveMnemonic(mnemonicId: newMnemonicKey)

    if checkStored == nil {
      keychain.set(mnemonic, forKey: newMnemonicKey)
      return address
    }

    return nil
  }

  func keychainKeyForMnemonicId(mnemonicId: String) -> String {
    return mnemonicPrefix + mnemonicId
  }

  func retrieveMnemonic(mnemonicId: String) -> String? {
    return keychain.get(keychainKeyForMnemonicId(mnemonicId: mnemonicId))
  }

  @objc(getAddressesForStoredPrivateKeys:reject:)
  func getAddressesForStoredPrivateKeys(
    resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock
  ) {
    let addresses = keychain.allKeys.filter { key in
      key.contains(privateKeyPrefix)
    }.map { key in
      key.replacingOccurrences(of: entirePrivateKeyPrefix, with: "")
    }
    resolve(addresses)
  }

  func storeNewPrivateKey(address: String, privateKey: String) {
    let newKey = privateKeyPrefix + address
    keychain.set(privateKey, forKey: newKey)
  }

  @objc(generateAndStorePrivateKey:derivationIndex:resolve:reject:)
  func generateAndStorePrivateKey(
    mnemonicId: String, derivationIndex: Int, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let mnemonic = retrieveMnemonic(mnemonicId: mnemonicId)
    let private_key = private_key_from_mnemonic(
      mnemonic?.cString(using: String.Encoding.utf8), UInt32(exactly: derivationIndex)!)
    let xprv = String(cString: private_key.private_key!)
    let address = String(cString: private_key.address!)
    storeNewPrivateKey(address: address, privateKey: xprv)
    private_key_free(private_key)
    resolve(address)
  }

  @objc(signTransactionForAddress:transaction:resolve:reject:)
  func signTransactionForAddress(
    address: String, transaction: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedTransaction = sign_tx_with_wallet(wallet, transaction)
    let result = String(cString: signedTransaction!)
    string_free(signedTransaction)
    resolve(result)
  }

  func retrieveOrCreateWalletForAddress(address: String) -> OpaquePointer {
    if walletCache[address] != nil {
      return walletCache[address]!
    }
    let privateKey = retrievePrivateKey(address: address)
    let wallet = wallet_from_private_key(privateKey?.cString(using: String.Encoding.utf8))
    walletCache[address] = wallet
    return wallet!
  }

  func retrievePrivateKey(address: String) -> String? {
    return keychain.get(keychainKeyForAddress(address: address))
  }

  func keychainKeyForAddress(address: String) -> String {
    return privateKeyPrefix + address
  }
}
