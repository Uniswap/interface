//
//  EncryptionHelper.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/26/22.
//

import CryptoKit
import Argon2Swift

/**
 Encrypts given secret using AES-GCM cipher secured by symmetric key derived from given password.
 
 - parameter secret: plaintext secret to encrypt
 - parameter password: password to generate encryption key
 - parameter salt: randomized data string used with password to generate encryption key
 - returns: encrypted secret string
 */
func encrypt(secret: String, password: String, salt: String) throws -> String {
  let key = try keyFromPassword(password: password, salt: salt)
  let secretData = secret.data(using: .utf8)!

  // Encrypt data into SealedBox, return as string
  let sealedBox = try AES.GCM.seal(secretData, using: key)
  let encryptedData = sealedBox.combined
  let encryptedSecret = encryptedData!.base64EncodedString()

  return encryptedSecret
}

/**
 Attempts to decrypt AES-GCM encrypted secret using symmetric key derived from given user pin.
 
 - parameter encryptedSecret: secret in cipher encrypted form
 - parameter password: password to generate encryption key
 - parameter salt: randomized data string used when secret was originally encrypted
 - returns: decrypted secret string
 */
func decrypt(encryptedSecret: String, password: String, salt: String) throws -> String {
  let key = try keyFromPassword(password: password, salt: salt)

  // Recreate SealedBox from encrypted string
  let encryptedData = Data(base64Encoded: encryptedSecret)!
  let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)

  // Decrypt SealedBox and decode result to string
  let decryptedData = try AES.GCM.open(sealedBox, using: key)
  let decryptedSecret = String(data: decryptedData, encoding: .utf8)!

  return decryptedSecret
}

/**
 Generate encryption key from user specified password and randomized salt using argon2id.
 
 The parameters used for Argon2 are based on recommended values from the security audit and the Argon2 RFC (https://datatracker.ietf.org/doc/rfc9106/)
 The memory and iterations values are tuned based on benchmark timing tests to take ~1s (see EncryptionHelperTests)
 - Mode: argon2id
 - Parallelism: 4
 - Memory: 128MiB (2^17 KiB)
 - Hash length: 32 bytes
 - Iterations: 3
 
 - parameter password: password to generate encryption key
 - parameter salt: randomized data string used with password to generate encryption key
 - returns: SymmetricKey to be used with CryptoKit encryption functions
 */

func keyFromPassword(password: String, salt: String) throws -> SymmetricKey {
  let derivedKey = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: 3, memory: 2 << 16, parallelism: 4, length: 32, type: .id)
  let key = SymmetricKey(data: derivedKey.hashData())
  return key
}

/**
 Generate random data string of specified byte length
 
 - parameter length:number of bytes for random data string
 - returns: randomized string
 */
func generateSalt(length: Int) -> String {
  var bytes = [UInt8](repeating: 0, count: length)
  _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
  return Data(bytes).base64EncodedString()
}
