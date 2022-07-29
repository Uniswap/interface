//
//  EncryptionHelper.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/26/22.
//

import CryptoKit

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
 Generate encryption key from user specified password and randomized salt using PBKDF2
 
 PBKDF2 requires a number of iterations, where the higher the iterations the higher the entropy of the derived key.
 - Uses 310,000 iterations, a recommended value from Open Web Application Security Project written in 2021: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
 - 1Password uses 100,000 iterations for PBKDF2: https://support.1password.com/pbkdf2/
 - The performance tradeoff for 310,000 versus 100,000 is less than 0.2 seconds as tested in EncryptionHelperTests
 
 - parameter password: password to generate encryption key
 - parameter salt: randomized data string used with password to generate encryption key
 - returns: SymmetricKey to be used with CryptoKit encryption functions
 */
func keyFromPassword(password: String, salt: String) throws -> SymmetricKey {
  let iterations = 310000
  let saltData = salt.data(using: .utf8)!
  let derivedKey = pbkdf2SHA256(password:password, salt:saltData, keyByteCount:32, iterations: iterations)!
  let key = SymmetricKey(data: derivedKey)
  return key
}

/**
  Implementation of PBKDF2 using CommonCrypto, inspired by  https://developer.apple.com/forums/thread/133421

 - parameter password: password to generate encryption key
 - parameter salt: randomized data string used with password to generate encryption key
 - parameter keyByteCount: number of bytes desired for derived encryption key
 - parameter iterations: number of iterations to run PBKDF2 (more iterations = more entropy)
 - returns: encryption key data
 */
func pbkdf2SHA256(password: String, salt: Data, keyByteCount: Int, iterations: Int) -> Data? {
  guard let passwordData = password.data(using: .utf8) else { return nil }

  var derivedKeyData = Data(repeating: 0, count: keyByteCount)
  let derivedCount = derivedKeyData.count

  let derivationStatus: OSStatus = derivedKeyData.withUnsafeMutableBytes { derivedKeyBytes in
    let derivedKeyRawBytes = derivedKeyBytes.bindMemory(to: UInt8.self).baseAddress
    return salt.withUnsafeBytes { saltBytes in
      let rawBytes = saltBytes.bindMemory(to: UInt8.self).baseAddress
      return CCKeyDerivationPBKDF(
        CCPBKDFAlgorithm(kCCPBKDF2),
        password,
        passwordData.count,
        rawBytes,
        salt.count,
        CCPBKDFAlgorithm(kCCPRFHmacAlgSHA256),
        UInt32(iterations),
        derivedKeyRawBytes,
        derivedCount)
    }
  }

  return derivationStatus == kCCSuccess ? derivedKeyData : nil
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
