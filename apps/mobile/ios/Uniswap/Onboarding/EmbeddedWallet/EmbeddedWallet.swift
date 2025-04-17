//
//  EmbeddedWallet.swift
//  Uniswap
//
//  Created by Bruno R. Nunes on 11/5/24.
//

import Foundation

@objc(EmbeddedWallet)
class EmbeddedWallet: NSObject {

  private let queue = DispatchQueue(label: "com.uniswap.EmbeddedWallet", qos: .background)

  private var publicKeyPairMap: [String: SecKey] = [:]

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  /**
  Decrypts an encrypted mnemonic using the private key corresponding to the provided public key.

  - parameter encryptedMnemonic: The Base64 encoded encrypted mnemonic.
  - parameter publicKeyBase64: The Base64 encoded public key in SPKI format.
  - returns: Resolves with the decrypted mnemonic.
  */
  @objc func decryptMnemonicForPublicKey(_ encryptedMnemonic: String, publicKeyBase64: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    queue.async {
      guard let privateKey = self.publicKeyPairMap[publicKeyBase64] else {
        let error = NSError(domain: "EmbeddedWalletModule", code: 404, userInfo: [NSLocalizedDescriptionKey: "Key pair not found for public key \(publicKeyBase64)"])
        rejecter("KEY_PAIR_NOT_FOUND", "Key pair not found for public key \(publicKeyBase64)", error)
        return
      }

      do {
        let decryptedSeedPhrase = try decryptMnemonic(encryptedMnemonic: encryptedMnemonic, privateKey: privateKey)
        self.publicKeyPairMap.removeValue(forKey: publicKeyBase64)
        resolver(decryptedSeedPhrase)
      } catch {
        rejecter("DECRYPTION_FAILED", "Failed to decrypt mnemonic", error)
      }
    }
  }

  /**
  Generates an RSA key pair for encrypting/decrypting seed phrases.
  Stores the private key in memory in publicKeyPairMap, to be used later for decryption.

  - returns: Resolves with the Base64 encoded public key in SPKI format.
  */
  @objc func generateKeyPair(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    queue.async {
      do {
        let (publicKey, privateKey) = try generateRSAKeyPair()
        self.publicKeyPairMap[publicKey] = privateKey
        resolver(publicKey)
      } catch {
        rejecter("KEY_PAIR_GENERATION_FAILED", "Failed to generate RSA key pair", error)
      }
    }
  }
}

enum EmbeddedWalletError: Error {
    case keyGenerationFailed
    case keyExportFailed
    case invalidEncryptedData
    case decryptionFailed
    case invalidDecryptedData
}

/**
 Generates an RSA key pair for encrypting/decrypting seed phrases.
 Matches the web implementation using RSA-OAEP with SHA-256.

 - returns: A tuple containing the Base64 encoded public key in SPKI format and the SecKeyPair for later decryption.
 */
func generateRSAKeyPair() throws -> (publicKeyBase64: String, privateKey: SecKey) {
    // Define key pair attributes
    let keyPairAttr: [String: Any] = [
        kSecAttrKeyType as String:            kSecAttrKeyTypeRSA,
        kSecAttrKeySizeInBits as String:      2048,
        kSecPrivateKeyAttrs as String: [
            kSecAttrIsPermanent as String:    false
        ]
    ]

    var error: Unmanaged<CFError>?

    // Generate private key using SecKeyCreateRandomKey
    guard let privateKey = SecKeyCreateRandomKey(keyPairAttr as CFDictionary, &error) else {
        if let error = error?.takeRetainedValue() {
            throw error
        }
        throw EmbeddedWalletError.keyGenerationFailed
    }

    // Obtain the public key from the private key
    guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
        throw EmbeddedWalletError.keyGenerationFailed
    }

    // Export the public key in SPKI format
    let spkiData = try exportPublicKeySPKI(publicKey: publicKey)
    let publicKeyBase64 = spkiData.base64EncodedString()

    return (publicKeyBase64, privateKey)
}

/**
 Decrypts an encrypted seed phrase using the provided RSA private key.

 - parameter encryptedMnemonic: The Base64 encoded encrypted seed phrase.
 - parameter privateKey: The RSA private key for decryption.
 - returns: The decrypted seed phrase string.
 */
func decryptMnemonic(encryptedMnemonic: String, privateKey: SecKey) throws -> String {
    guard let encryptedData = Data(base64Encoded: encryptedMnemonic) else {
        throw EmbeddedWalletError.invalidEncryptedData
    }

    var error: Unmanaged<CFError>?
    guard let decryptedData = SecKeyCreateDecryptedData(privateKey, .rsaEncryptionOAEPSHA256, encryptedData as CFData, &error) as Data? else {
        throw EmbeddedWalletError.decryptionFailed
    }

    guard let decryptedString = String(data: decryptedData, encoding: .utf8) else {
        throw EmbeddedWalletError.invalidDecryptedData
    }

    return decryptedString
}

enum ASN1Error: Error {
    case encodingFailed
}

// OID for rsaEncryption: 1.2.840.113549.1.1.1
let rsaOID: [UInt8] = [
    0x30, 0x0D,             // SEQUENCE, length 13
    0x06, 0x09,             // OBJECT IDENTIFIER, length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01,
    0x05, 0x00              // NULL
]

func encodeASN1Length(_ length: Int) -> Data {
    if length < 128 {
        // Short form: single byte
        return Data([UInt8(length)])
    } else {
        // Determine the number of bytes needed to represent the length
        var tempLength = length
        var lengthBytes: [UInt8] = []
        while tempLength > 0 {
            lengthBytes.insert(UInt8(tempLength & 0xFF), at: 0)
            tempLength >>= 8
        }
        let lengthOfLength = UInt8(lengthBytes.count)
        // First byte: 0x80 | number of length bytes
        var encoded = Data([0x80 | lengthOfLength])
        encoded.append(contentsOf: lengthBytes)
        return encoded
    }
}

func encodeASN1Sequence(_ sequence: Data) -> Data {
    var encoded = Data([0x30]) // SEQUENCE tag
    let length = encodeASN1Length(sequence.count)
    encoded.append(length)
    encoded.append(sequence)
    return encoded
}

func encodeASN1BitString(_ bitString: Data) -> Data {
    var encoded = Data([0x03]) // BIT STRING tag
    // Add a leading 0x00 to indicate no unused bits
    let bitStringWithPadding = Data([0x00]) + bitString
    let length = encodeASN1Length(bitStringWithPadding.count)
    encoded.append(length)
    encoded.append(bitStringWithPadding)
    return encoded
}

func exportPublicKeySPKI(publicKey: SecKey) throws -> Data {
    // Retrieve the raw public key data (PKCS#1)
    guard let keyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
        throw ASN1Error.encodingFailed
    }

    // Encode the AlgorithmIdentifier (rsaEncryption OID with NULL parameters)
    let algorithmIdentifier = Data(rsaOID)
    // Encode the BIT STRING
    let bitString = encodeASN1BitString(keyData)
    // Combine AlgorithmIdentifier and BIT STRING into SubjectPublicKeyInfo SEQUENCE
    let subjectPublicKeyInfo = encodeASN1Sequence(algorithmIdentifier + bitString)

    return subjectPublicKeyInfo
}
