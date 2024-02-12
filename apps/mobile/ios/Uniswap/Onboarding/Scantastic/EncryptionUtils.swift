//	
//  EncryptionUtils.swift
//  Uniswap
//	
//  Created by Christine Legge on 1/23/24.
//

import CryptoKit
import Foundation

enum EncryptionError: Error {
    case invalidModulus
    case invalidExponent
    case invalidPublicKey
    case unknown
}

// Convert Base64URL to Base64 and add padding if necessary
func Base64URLToBase64(base64url: String) -> String {
    var base64 = base64url
        .replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")
    if base64.count % 4 != 0 {
        base64.append(String(repeating: "=", count: 4 - base64.count % 4))
    }
    return base64
}

// Calculate the length field for an ASN.1 sequence.
func lengthField(of valueField: [UInt8]) throws -> [UInt8] {
    var count = valueField.count

    if count < 128 {
        return [ UInt8(count) ]
    }

    // The number of bytes needed to encode count.
    let lengthBytesCount = Int((log2(Double(count)) / 8) + 1)

    // The first byte in the length field encoding the number of remaining bytes.
    let firstLengthFieldByte = UInt8(128 + lengthBytesCount)

    var lengthField: [UInt8] = []
    for _ in 0..<lengthBytesCount {
        // Take the last 8 bits of count.
        let lengthByte = UInt8(count & 0xff)
        // Add them to the length field.
        lengthField.insert(lengthByte, at: 0)
        // Delete the last 8 bits of count.
        count = count >> 8
    }

    // Include the first byte.
    lengthField.insert(firstLengthFieldByte, at: 0)

    return lengthField
}

func generatePublicRSAKey(modulus: String, exponent: String) throws -> SecKey {
    // Lets encode them from b64 url to b64 
    let encodedModulus = Base64URLToBase64(base64url: modulus)
    let encodedExponent = Base64URLToBase64(base64url: exponent)

    // First we need to get our modulus and exponent into UInt8 arrays
    // We can do this by decoding the Base64 strings (URL safe) into Data 
    // and then converting the Data into UInt8 arrays
    guard let modulusData = Data(base64Encoded: encodedModulus) else {
        throw EncryptionError.invalidModulus
    }

    guard let exponentData = Data(base64Encoded: encodedExponent) else {
        throw EncryptionError.invalidExponent
    }

    var modulus = modulusData.withUnsafeBytes { Data(Array($0)).withUnsafeBytes { Array($0) } }
    let exponent = exponentData.withUnsafeBytes { Data(Array($0)).withUnsafeBytes { Array($0) } }

    // Lets add 0x00 at the front of the modulus
    modulus.insert(0x00, at: 0)

    var sequenceEncoded: [UInt8] = []
    do {
      // encode as integers
      var modulusEncoded: [UInt8] = []
      modulusEncoded.append(0x02)
      modulusEncoded.append(contentsOf: try lengthField(of: modulus))
      modulusEncoded.append(contentsOf: modulus)

      var exponentEncoded: [UInt8] = []
      exponentEncoded.append(0x02)
      exponentEncoded.append(contentsOf: try lengthField(of: exponent))
      exponentEncoded.append(contentsOf: exponent)

      sequenceEncoded.append(0x30)
      sequenceEncoded.append(contentsOf: try lengthField(of: (modulusEncoded + exponentEncoded)))
      sequenceEncoded.append(contentsOf: (modulusEncoded + exponentEncoded))
    } catch {
        throw EncryptionError.invalidPublicKey
    }

    let keyData = Data(sequenceEncoded)

    // RSA key size is the number of bits of the modulus.
    let keySize = (modulus.count * 8)

    let attributes: [String: Any] = [
        kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
        kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
        kSecAttrKeySizeInBits as String: keySize
    ]

    guard let publicKey = SecKeyCreateWithData(keyData as CFData, attributes as CFDictionary, nil) else {
        throw EncryptionError.invalidPublicKey
    }

    return publicKey
}

func encryptForStorage(plaintext: String, publicKey: SecKey) throws -> Data
{
    // Encrypt the plaintext
    let plaintextData = Data(plaintext.utf8)
    let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256

    guard SecKeyIsAlgorithmSupported(publicKey, .encrypt, algorithm) else {
        throw EncryptionError.invalidPublicKey
    }

    var error: Unmanaged<CFError>?
    guard let ciphertextData = SecKeyCreateEncryptedData(publicKey, algorithm, plaintextData as CFData, &error) else {
        if let error = error {
          throw error.takeRetainedValue() as Error
        } else {
          throw EncryptionError.unknown
        }
    }

    return ciphertextData as Data
}
