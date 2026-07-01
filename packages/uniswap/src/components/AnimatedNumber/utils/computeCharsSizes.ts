const DIGIT_ZERO_CHAR_CODE = '0'.charCodeAt(0)
const DIGIT_NINE_CHAR_CODE = '9'.charCodeAt(0)

/** Single-char string is '0'–'9'. Shared with web/native for rail vs non-rail. */
export function isDigitChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return code >= DIGIT_ZERO_CHAR_CODE && code <= DIGIT_NINE_CHAR_CODE
}

/** Cumulative horizontal offsets per character (native odometer layout). */
export function computeCharsSizes({
  chars,
  digitWidths,
  spaceSize,
}: {
  chars: string[]
  digitWidths: number[]
  spaceSize: number
}): number[] {
  let lastSize = 0
  return chars.map((char) => {
    let currentSize = 0
    const isAWhiteSpace = /\s/.test(char)
    if (isDigitChar(char)) {
      const digitWidth = digitWidths[Number(char)] || 0
      currentSize = lastSize + digitWidth + spaceSize
    } else if (isAWhiteSpace) {
      currentSize = lastSize + spaceSize
    }
    lastSize = currentSize
    return currentSize
  })
}
