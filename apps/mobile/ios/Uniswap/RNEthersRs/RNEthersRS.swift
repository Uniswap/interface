//
//  RNEthers.swift
//  Uniswap
//
//  Created by Connor McEwen on 10/28/21.

/**
 Provides the generation, storage, and signing logic for mnemonics and private keys so that they never passed to JS.
 
 Mnemonics and private keys are stored and accessed in the native iOS secure keychain key-value store via associated keys formed from concatenating a constant prefix with the associated public address.
 
 Uses KeychainSwift as a wrapper utility to interface with the native iOS secure keychain. */

import Foundation
import CryptoKit


enum RNEthersRSError: String, Error  {
  case storeMnemonicError = "storeMnemonicError"
  case retrieveMnemonicError = "retrieveMnemonicError"
}

@objc(RNEthersRS)

class RNEthersRS: NSObject {
  private let keychain = KeychainSwift(keyPrefix: prefix)
  // TODO: [MOB-208] LRU cache to ensure we don't create too many (unlikely to happen)
  private var walletCache: [String: OpaquePointer] = [:]
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  func findInvalidWord(mnemonic: String) -> String {
    let firstInvalidMnemonic = find_invalid_word(mnemonic)
    return String(cString: firstInvalidMnemonic!)
  }
  
  func validateMnemonic(mnemonic: String) -> Bool {
    return validate_mnemonic(mnemonic)
  }

  /**
   Fetches all mnemonic IDs, which are used as keys to access the actual mnemonics in the native keychain secure key-value store.
   
   - returns: array of mnemonic IDs
   */
  @objc(getMnemonicIds:reject:)
  func getMnemonicIds(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonicIds = keychain.allKeys.filter { key in
      key.contains(mnemonicPrefix)
    }.map { key in
      key.replacingOccurrences(of: entireMnemonicPrefix, with: "")
    }
    resolve(mnemonicIds)
  }
  
  /**
   Derives private key from mnemonic with derivation index 0 and retrieves associated public address. Stores imported mnemonic in native keychain with the mnemonic ID key as the public address.
   
   - parameter mnemonic: The mnemonic phrase to import
   - returns: public address from the mnemonic's first derived private key
   */
  @objc(importMnemonic:resolve:reject:)
  func importMnemonic(
    mnemonic: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let private_key = private_key_from_mnemonic(
      mnemonic, UInt32(exactly: 0)!)
    let address = String(cString: private_key.address!)
    
    let res = storeNewMnemonic(mnemonic: mnemonic, address: address)
    if res != nil {
      resolve(res)
      return
    }
    
    reject("Unable to import new mnemonic", "Failed store new mnemonic in ethers library", nil)
    return
  }
  
  @objc(removeMnemonic:resolve:reject:)
  func removeMnemonic(
    mnemonicId: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let res = keychain.delete(keychainKeyForMnemonicId(mnemonicId: mnemonicId))
    resolve(res)
  }
  
  /**
   Generates a new mnemonic and retrieves associated public address. Stores new mnemonic in native keychain with the mnemonic ID key as the public address.
   
   - returns: public address from the mnemonic's first derived private key
   */
  @objc(generateAndStoreMnemonic:reject:)
  func generateAndStoreMnemonic(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonic_ptr = generate_mnemonic()
    let mnemonic_str = String(cString: mnemonic_ptr.mnemonic!)
    let address_str = String(cString: mnemonic_ptr.address!)
    let res = storeNewMnemonic(mnemonic: mnemonic_str, address: address_str)
    mnemonic_free(mnemonic_ptr)
    resolve(res)
  }
  
  /**
   Stores mnemonic phrase in Native Keychain under the address
   
   - returns: public address if successfully stored in native keychain
   */
  func storeNewMnemonic(mnemonic: String, address: String) -> String? {
    let checkStored = retrieveMnemonic(mnemonicId: address)
    
    if checkStored == nil {
      let newMnemonicKey = keychainKeyForMnemonicId(mnemonicId: address);
      keychain.set(mnemonic, forKey: newMnemonicKey, withAccess: .accessibleWhenUnlockedThisDeviceOnly)
      return address
    }
    
    return address
  }
  
  func keychainKeyForMnemonicId(mnemonicId: String) -> String {
    return mnemonicPrefix + mnemonicId
  }
  
  func retrieveMnemonic(mnemonicId: String) -> String? {
    return keychain.get(keychainKeyForMnemonicId(mnemonicId: mnemonicId))
  }
  
  /**
   Fetches all public addresses from private keys stored under `privateKeyPrefix` in native keychain. Used from React Native to verify the native keychain has the private key for an account that is attempting create a NativeSigner that calls native signing methods
   
   - returns: public addresses for all stored private keys
   */
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
    let newKey = keychainKeyForPrivateKey(address: address);
    keychain.set(privateKey, forKey: newKey, withAccess: .accessibleWhenUnlockedThisDeviceOnly)
  }
  
  /**
   Derives public address from mnemonic for given `derivationIndex`.

   - parameter mnemonic: mnemonic to generate public key for
   - parameter derivationIndex: number used to specify a which derivation index to use for deriving a private key from the mnemonic
   - returns: public address associated with private key generated from the mnemonic at given derivation index
   */
  @objc(generateAddressForMnemonic:derivationIndex:resolve:reject:)
  func generateAddressForMnemonic(
    mnemonic: String, derivationIndex: Int, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let private_key = private_key_from_mnemonic(
      mnemonic, UInt32(exactly: derivationIndex)!)
    let address = String(cString: private_key.address!)
    private_key_free(private_key)
    resolve(address)
  }

  /**
   Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`. Stores the private key in native keychain with key.
   
   - parameter mnemonicId: key string associated with mnemonic to generate private key for (currently convention is to use public address associated with mnemonic)
   - parameter derivationIndex: number used to specify a which derivation index to use for deriving a private key from the mnemonic
   - returns: public address associated with private key generated from the mnemonic at given derivation index
   */
  @objc(generateAndStorePrivateKey:derivationIndex:resolve:reject:)
  func generateAndStorePrivateKey(
    mnemonicId: String, derivationIndex: Int, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let mnemonic = retrieveMnemonic(mnemonicId: mnemonicId)
    
    if (mnemonic == nil) {
      reject("Mnemonic not found", "Could not find mnemonic for given mnemonicId", nil)
      return
    }
    
    let private_key = private_key_from_mnemonic(
      mnemonic, UInt32(exactly: derivationIndex)!)
    let xprv = String(cString: private_key.private_key!)
    let address = String(cString: private_key.address!)
    storeNewPrivateKey(address: address, privateKey: xprv)
    private_key_free(private_key)
    resolve(address)
  }

  @objc(removePrivateKey:resolve:reject:)
  func removePrivateKey(
    address: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock
  ) {
    let res = keychain.delete(keychainKeyForPrivateKey(address: address))
    resolve(res)
  }
  
  @objc(signTransactionHashForAddress:hash:chainId:resolve:reject:)
  func signTransactionForAddress(
    address: String, hash: String, chainId: NSNumber, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedHash = sign_tx_with_wallet(wallet, hash, UInt64(chainId))
    let result = String(cString: signedHash.signature!)
    resolve(result);
  }
  
  @objc(signMessageForAddress:message:resolve:reject:)
  func signMessageForAddress(
    address: String, message: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedMessage = sign_message_with_wallet(wallet, message)
    let result = String(cString: signedMessage!)
    string_free(signedMessage)
    resolve(result)
  }
  
  @objc(signHashForAddress:hash:chainId:resolve:reject:)
  func signHashForAddress(
    address: String, hash: String, chainId: NSNumber, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedHash = sign_hash_with_wallet(wallet, hash, UInt64(chainId))
    let result = String(cString: signedHash!)
    string_free(signedHash)
    resolve(result)
  }
  
  func retrieveOrCreateWalletForAddress(address: String) -> OpaquePointer {
    if walletCache[address] != nil {
      return walletCache[address]!
    }
    let privateKey = retrievePrivateKey(address: address)
    let wallet = wallet_from_private_key(privateKey)
    walletCache[address] = wallet
    return wallet!
  }
  
  func retrievePrivateKey(address: String) -> String? {
    return keychain.get(keychainKeyForPrivateKey(address: address))
  }
  
  func keychainKeyForPrivateKey(address: String) -> String {
    return privateKeyPrefix + address
  }
}
