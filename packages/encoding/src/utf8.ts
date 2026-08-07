/**
 * Encodes a string as UTF-8 bytes. Wraps the platform `TextEncoder` to keep
 * UTF-8 conversion centralized alongside the other encoding primitives.
 *
 * @param value - The string to encode.
 * @returns The UTF-8 encoded bytes.
 */
export function utf8ToUint8(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value)
}

/**
 * Decodes UTF-8 bytes into a string. Uses the
 * `TextDecoder` default (non-fatal) behavior.
 *
 * @param bytes - The UTF-8 bytes to decode.
 * @returns The decoded string.
 */
export function uint8ToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
