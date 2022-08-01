//
//  EncryptionHelperTests.swift
//  UniswapTests
//
//  Created by Spencer Yen on 7/27/22.
//

import XCTest
@testable import Uniswap

class EncryptionHelperTests: XCTestCase {
  
  private var secret = "student zone flight quote trial case shadow alien yard choose quiz produce"
  private var password = "012345"

  func testEncryptAndDecrypt() throws {
    let salt = generateSalt(length: 32)
    print("Secret: \(secret)")
    print("Password: \(password)")
    print("Salt: \(salt)")
    
    let encryptedSecret = try encrypt(secret: secret, password: password, salt: salt)
    XCTAssertNotNil(encryptedSecret, "Failed to encrypt secret")
    print("Encrypted Secret: \(encryptedSecret)")
    
    let decryptedSecret = try decrypt(encryptedSecret: encryptedSecret, password: password, salt: salt)
    XCTAssertEqual(secret, decryptedSecret, "Decrypted secret does not match plaintext secret")
    print("Decrypted Secret: \(decryptedSecret)")
  }
  
  func testEncryptAndDecryptFail() throws {
    let salt = generateSalt(length: 32)
    
    let encryptedSecret = try encrypt(secret: secret, password: password, salt: salt)
    XCTAssertNotNil(encryptedSecret, "Failed to encrypt secret")
    
    XCTAssertThrowsError(try decrypt(encryptedSecret: encryptedSecret, password: "wrong", salt: salt), "No error thrown when decrypting with invalid password")
  }
  
  func testPbkdf2Iterations100000() throws {
    self.measure {
      let iterations = 100000
      let salt = generateSalt(length: 32)
      let saltData = salt.data(using: .utf8)!
      let _ = pbkdf2SHA256(password: password, salt: saltData, keyByteCount: 32, iterations: iterations)
    }
  }
  
  func testPbkdf2Iterations310000() throws {
    self.measure {
      let iterations = 310000
      let salt = generateSalt(length: 32)
      let saltData = salt.data(using: .utf8)!
      let _ = pbkdf2SHA256(password: password, salt: saltData, keyByteCount: 32, iterations: iterations)
    }
  }
}
