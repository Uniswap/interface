/**
 * Approximate width of each glyph relative to a typical "wide" Latin glyph,
 * where `maxCharWidthAtMaxFontSize` is treated as one unit (~widest common digit/letter).
 * Unlisted characters default to 1.0.
 * Digits and `.` are biased slightly high vs. ideal typography so long decimals (many `1`s)
 * do not underestimate width and overflow the field.
 */
const RELATIVE_CHAR_WIDTH: Record<string, number> = {
  ' ': 0.5,
  '.': 0.52,
  ',': 0.48,
  ':': 0.42,
  ';': 0.42,
  '`': 0.4,
  "'": 0.32,
  '\u2018': 0.32, // ‘
  '\u2019': 0.32, // ’
  '!': 0.48,
  '|': 0.42,
  '-': 0.58,
  '+': 0.78,
  '=': 0.78,

  // digits —
  '1': 0.62,
  '7': 0.9,

  // narrow
  i: 0.45,
  I: 0.55,
  l: 0.45,
  L: 0.55,
  j: 0.48,
  J: 0.55,
  t: 0.55,
  T: 0.65,
  f: 0.55,
  F: 0.72,
  r: 0.58,
  R: 0.78,

  // wide
  m: 1.28,
  M: 1.22,
  w: 1.28,
  W: 1.25,
  '@': 1.22,
  '%': 1.18,
  '&': 1.12,
  Q: 1.08,
  q: 0.95,
}

export function getRelativeCharWidth(char: string): number {
  return RELATIVE_CHAR_WIDTH[char] ?? 1
}
