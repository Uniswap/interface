/**
 * Encodes a byte array as a standard base64 string. Using `btoa` to keep
 * implementation environment agnostic and similar to what we're replacing.
 *
 * @param bytes - The bytes to encode.
 * @returns The base64-encoded string.
 */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/**
 * Decodes a standard base64 string into a byte array.
 *
 * Accepts input with or without `=` padding per the underlying `atob`
 * behavior. Using `atob` to keep implementation environment agnostic and
 * similar to what we're replacing.
 *
 * @param b64 - The base64 string to decode.
 * @returns The decoded bytes.
 */
export function base64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}
