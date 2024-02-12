//
//  ScantasticEncryption.swift
//  Uniswap
//
//  Created by Christine Legge on 1/23/24.
//

import Foundation
import CryptoKit

enum ScantasticError: String, Error {
  case publicKeyError = "publicKeyError"
  case cipherTextError = "cipherTextError"
}

@objc(ScantasticEncryption)
class ScantasticEncryption: RCTEventEmitter {
  let rnEthersRS = RNEthersRS()
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return []
  }

  /**
  Retrieves encrypted mnemonic
  
  - parameter mnemonicId: key string associated with mnemonic to backup
  - parameter n: base64encoded value
  - parameter e: base64encoded value
  */
  @objc(getEncryptedMnemonic:n:e:resolve:reject:)
  func getEncryptedMnemonic(
    mnemonicId: String, n: String, e: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {

    guard let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) else {
      return reject(RNEthersRSError.retrieveMnemonicError.rawValue, "Failed to retrieve mnemonic", RNEthersRSError.retrieveMnemonicError)
    }

    let publicKey: SecKey 
    do {
      publicKey = try generatePublicRSAKey(modulus: n, exponent: e)
    } catch {
      return reject(ScantasticError.publicKeyError.rawValue, "Failed to generate public Key ", ScantasticError.publicKeyError)
    }

    let encodedCiphertext: Data
    do {
      encodedCiphertext = try encryptForStorage(plaintext:mnemonic,publicKey:publicKey)
    } catch { 
      return reject(ScantasticError.cipherTextError.rawValue, "Failed to encrypt the mnemonic", ScantasticError.cipherTextError)
    }

    let b64encodedCiphertext = encodedCiphertext.base64EncodedString()
    return resolve(b64encodedCiphertext)
  }
}
