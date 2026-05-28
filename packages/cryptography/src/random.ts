/**
 * Generates a cryptographically random byte array of the requested length.
 *
 * @param length - The number of random bytes to generate.
 * @returns A `Uint8Array` of `length` random bytes.
 */
export function generateRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length))
}
