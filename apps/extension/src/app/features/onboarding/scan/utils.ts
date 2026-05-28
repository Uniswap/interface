import { base64ToUint8 } from '@universe/encoding'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams } from 'wallet/src/features/scantastic/types'

export const KEY_PARAMS = {
  name: 'RSA-OAEP',
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
}

export async function cryptoKeyToJWK(key: CryptoKey): Promise<JsonWebKey> {
  const exportedKeyData = await window.crypto.subtle.exportKey('jwk', key)
  return exportedKeyData
}

export function getScantasticUrl({ uuid, publicKey, vendor, model, browser }: ScantasticParams): string {
  let qrURI = `uniswap://scantastic?pubKey=${JSON.stringify(publicKey)}&uuid=${encodeURIComponent(uuid)}`
  if (vendor) {
    qrURI = qrURI.concat(`&vendor=${encodeURIComponent(vendor)}`)
  }
  if (model) {
    qrURI = qrURI.concat(`&model=${encodeURIComponent(model)}`)
  }
  if (browser) {
    qrURI = qrURI.concat(`&browser=${encodeURIComponent(browser)}`)
  }
  return qrURI
}

export async function decryptMessage(privateKey: CryptoKey, ciphertext: string): Promise<string> {
  try {
    const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      base64ToUint8(ciphertext),
    )

    const textDecoder = new TextDecoder()
    return textDecoder.decode(decryptedArrayBuffer)
  } catch (e) {
    logger.error(e, { tags: { file: 'scan/utils.ts', function: 'decryptMessage' } })
    return ''
  }
}
