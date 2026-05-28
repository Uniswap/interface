import { Buffer } from 'buffer'
import { exportEncryptedSeedPhrase } from 'uniswap/src/features/passkey/embeddedWallet'

export async function exportSeedPhrase(): Promise<string | undefined> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt'],
  )
  // Export the public key in 'spki' format to match BE expectations
  const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicKeyBase64 = Buffer.from(publicKeySpki).toString('base64')
  const encryptedSeedPhrase = await exportEncryptedSeedPhrase(publicKeyBase64)
  if (!encryptedSeedPhrase) {
    return undefined
  }
  const decryptedSeedPhrase = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    keyPair.privateKey,
    Buffer.from(encryptedSeedPhrase, 'base64'),
  )
  return new TextDecoder().decode(decryptedSeedPhrase)
}
