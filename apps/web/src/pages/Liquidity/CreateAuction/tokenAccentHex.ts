/**
 * `#RRGGBB` accent from token image extraction. Callers obtain values only via
 * {@link parseTokenAccentHex} so downstream UI (calendar CSS vars, charts) never sees malformed hex.
 */
export type TokenAccentHex = string & { readonly __brand: 'TokenAccentHex' }

export const HEX_RGB_PATTERN = /^#[0-9a-fA-F]{6}$/

/** Returns a branded hex when `value` matches `#RRGGBB`; otherwise `undefined`. */
export function parseTokenAccentHex(value: string | undefined | null): TokenAccentHex | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (!HEX_RGB_PATTERN.test(value)) {
    return undefined
  }
  return value as TokenAccentHex
}
