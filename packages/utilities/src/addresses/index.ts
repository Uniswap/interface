import { getAddress } from '@ethersproject/address'
import { logger } from 'utilities/src/logger/logger'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value?: string | null | undefined): `0x${string}` | false {
  if (!value) {
    return false
  }
  try {
    // Alphabetical letters must be made lowercase for getAddress to work.
    // See documentation here: https://docs.ethers.io/v5/api/utils/address/
    // eslint-disable-next-line local-rules/no-hex-string-casting
    return getAddress(value.toLowerCase()) as `0x${string}`
  } catch {
    return false
  }
}

export function isSameAddress(a?: string, b?: string): boolean {
  return a === b || a?.toLowerCase() === b?.toLowerCase() // Lazy-lowercases the addresses
}

function getShortenParams(chars: number, charsEnd?: number): { start: number; end: number } {
  if (charsEnd === undefined) {
    charsEnd = chars
  }

  if (chars <= 0 && charsEnd <= 0) {
    logger.warn('utilities/src/addresses/index.ts', 'getShortenParams', 'chars and charsEnd must be positive integers')
    chars = 4
    charsEnd = 4
  }

  return { start: chars, end: charsEnd }
}

/**
 * Shortens an Ethereum address. If the address is not valid, it returns an empty string.
 *
 * @param address - The address to shorten
 * @param chars - The number of characters to show at the beginning after the 0x and end.
 * @param charsEnd - (Optional) The number of characters to show at the end if different from chars.
 */
// eslint-disable-next-line max-params
export function shortenAddress(address = '', chars = 4, charsEnd?: number): string {
  // TODO(WEB-8012): Update to support Solana
  const parsed = isAddress(address)
  if (!parsed) {
    return ''
  }

  const { start, end } = getShortenParams(chars, charsEnd)

  return ellipseAddressAdd0x(parsed, start, end)
}

/**
 * Shortens a hash in the same way as shortenAddress without validating the input
 *
 * @param hash - The hash to shorten
 * @param chars - The number of characters to show at the beginning after the 0x and end.
 * @param charsEnd - (Optional) The number of characters to show at the end if different from chars.
 */
// eslint-disable-next-line max-params
export function shortenHash(hash = '', chars = 4, charsEnd?: number): string {
  if (!hash) {
    return ''
  }

  const { start, end } = getShortenParams(chars, charsEnd)

  return ellipseAddressAdd0x(hash, start, end)
}

/**
 * Shorten an address and add 0x to the start if missing
 * @param address
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
// eslint-disable-next-line max-params
function ellipseAddressAdd0x(address: string, charsStart: number, charsEnd: number): string {
  const hasPrefix = address.startsWith('0x')
  const prefix = hasPrefix ? '' : '0x'
  const wholeAddress = prefix + address
  if (charsStart + charsEnd >= wholeAddress.length) {
    return wholeAddress
  }
  return ellipseMiddle({ str: prefix + address, charsStart: charsStart + 2, charsEnd })
}

/**
 * Shorten a string with "..." in the middle
 * @param target
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
export function ellipseMiddle({
  str,
  charsStart = 4,
  charsEnd = 4,
}: {
  str: string
  charsStart?: number
  charsEnd?: number
}): string {
  return `${str.slice(0, charsStart)}...${str.slice(str.length - charsEnd)}`
}
