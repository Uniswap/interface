/**
 * Base64 <-> byte-array helpers shared across the passkey feature (`pinCrypto.ts`,
 * `hpkeExport.ts`, etc.). `atob` / `btoa` expect latin-1 strings, so we thread bytes
 * through `String.fromCharCode` / `charCodeAt` to round-trip binary data.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
