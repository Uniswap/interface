/**
 * Converts a base64url string to standard base64.
 *
 * Swaps `-` w/ `+` and `_` w/ `/`, then re-adds any missing `=` padding so
 * the result length is a multiple of 4. Safe to pass directly to `atob`.
 *
 * @param b64url - The base64url string to convert.
 * @returns The equivalent standard base64 string, padded with `=`.
 */
export function base64urlToBase64(b64url: string): string {
  return b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64url.length % 4)) % 4)
}

/**
 * Converts a standard base64 string to base64url.
 *
 * Swaps `+` w/ `-` and `/` w/ `_`, then strips trailing `=` padding.
 *
 * @param b64 - The standard base64 string to convert.
 * @returns The equivalent base64url string, without padding.
 */
export function base64ToBase64url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '')
}
