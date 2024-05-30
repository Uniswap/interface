//
//  EncryptionHelperTests.swift
//  UniswapTests
//
//  Created by Spencer Yen on 7/27/22.
//

import XCTest
import Argon2Swift
@testable import Uniswap

class EncryptionHelperTests: XCTestCase {
  
  private let secret = "student zone flight quote trial case shadow alien yard choose quiz produce"
  private let password = "012345"
  private let saltLength = 16

  func testEncryptAndDecrypt() throws {
    let salt = generateSalt(length: saltLength)
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
    let salt = generateSalt(length: saltLength)
    
    let encryptedSecret = try encrypt(secret: secret, password: password, salt: salt)
    XCTAssertNotNil(encryptedSecret, "Failed to encrypt secret")
    
    XCTAssertThrowsError(try decrypt(encryptedSecret: encryptedSecret, password: "wrong", salt: salt), "No error thrown when decrypting with invalid password")
  }
  
  func testArgon2KDF1Iteration1GBMemory() throws {
     measure {
       do {
         let iterations = 1
         let memory = 2 << 19 // 2^20 KiB = 1024MiB
         let salt = generateSalt(length: saltLength)
         let _ = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: iterations, memory: memory, parallelism: 4, length: 32, type: .id)
       } catch {
         XCTAssertNil(error, "Error hashing password with Argon2")
       }
     }
   }
  
  func testArgon2KDF3Iteration512MBMemory() throws {
     measure {
       do {
         let iterations = 3
         let memory = 2 << 18 // 2^19 KiB = 512MiB
         let salt = generateSalt(length: saltLength)
         let _ = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: iterations, memory: memory, parallelism: 4, length: 32, type: .id)
       } catch {
         XCTAssertNil(error, "Error hashing password with Argon2")
       }
     }
   }
  
  func testArgon2KDF3Iteration256MBMemory() throws {
     measure {
       do {
         let iterations = 3
         let memory = 2 << 17 // 2^18 KiB = 256MiB
         let salt = generateSalt(length: saltLength)
         let _ = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: iterations, memory: memory, parallelism: 4, length: 32, type: .id)
       } catch {
         XCTAssertNil(error, "Error hashing password with Argon2")
       }
     }
   }
 
  func testArgon2KDF3Iteration128MBMemory() throws {
     measure {
       do {
         let iterations = 3
         let memory = 2 << 16 // 2^17 KiB = 128MiB
         let salt = generateSalt(length: saltLength)
         let _ = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: iterations, memory: memory, parallelism: 4, length: 32, type: .id)
       } catch {
         XCTAssertNil(error, "Error hashing password with Argon2")
       }
     }
   }
  
  func testArgon2KDF3Iteration64MBMemory() throws {
     measure {
       do {
         let iterations = 3
         let memory = 2 << 15 // 2^16 KiB = 64MiB
         let salt = generateSalt(length: saltLength)
         let _ = try Argon2Swift.hashPasswordString(password: password, salt: Salt(bytes: Data(salt.utf8)), iterations: iterations, memory: memory, parallelism: 4, length: 32, type: .id)
       } catch {
         XCTAssertNil(error, "Error hashing password with Argon2")
       }
     }
   }
  
}
