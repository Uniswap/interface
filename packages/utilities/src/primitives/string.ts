export function trimToLength(value: string, maxLength: number): string {
  if (!value) {
    return ''
  }
  const trimmed = value.trim()
  return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed
}

export function normalizeTextInput(input: string, toLowerCase = true): string {
  // Trim and replace all white spaces with a single space
  const trimmed = input.trim().replace(/\s+/g, ' ')
  return toLowerCase ? trimmed.toLowerCase() : trimmed
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function normalizeTwitterUsername(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, '') // must be alphanumeric or an underscore
}

export function concatStrings(list: string[], endAdornmentText: string): string {
  let result = list.join(', ')
  // replacing last comma with ' and'
  const lastCommaIndex = result.lastIndexOf(',')
  if (lastCommaIndex !== -1) {
    const before = result.slice(0, lastCommaIndex)
    const after = result.slice(lastCommaIndex + 1)
    result = before + ' ' + endAdornmentText + after
  }
  return result
}

export function containsNonPrintableChars(msg: string): boolean {
  // Matches control characters and space separators.
  const regex = /[\p{C}\p{Z}]/gu

  if (regex.test(msg)) {
    return ![...msg].every((char) => char === '\n' || char === '\r' || char === '\t' || !/\p{C}/u.test(char))
  }

  return false
}

/**
 * A string of a single space. This is useful since sometimes a stray space might look
 * unintentionally in the code. This makes its explicit.
 */
export const SPACE_STRING = ' '
