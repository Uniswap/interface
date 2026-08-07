/**
 * Overwrites the contents of one or more byte arrays with zeros.
 *
 * Used to wipe key material and other secrets from memory as soon as they are
 * no longer needed, limiting how long they linger on the heap. `undefined`
 * entries are skipped so callers can pass optional buffers without guarding.
 *
 * @param buffers - The byte arrays to zero out
 */
export function zeroBuffers(...buffers: (Uint8Array | undefined)[]): void {
  for (const buffer of buffers) {
    buffer?.fill(0)
  }
}
