import { Buffer } from 'buffer'
import { exportEncryptedSeedPhrase } from 'uniswap/src/features/passkey/embeddedWallet'

export async function exportSeedPhrase(walletId?: string): Promise<string | undefined> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey'],
  )
  // Export the public key in 'spki' format to match BE expectations
  const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicKeyBase64 = Buffer.from(publicKeySpki).toString('base64')
  const encryptedSeedPhrase = await exportEncryptedSeedPhrase(publicKeyBase64, walletId)
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
