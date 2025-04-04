import { getAddress } from '@ethersproject/address'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value?: string | null | undefined): `0x${string}` | false {
  if (!value) {
    return false
  }
  try {
    // Alphabetical letters must be made lowercase for getAddress to work.
    // See documentation here: https://docs.ethers.io/v5/api/utils/address/
    return getAddress(value.toLowerCase()) as `0x${string}`
  } catch {
    return false
  }
}

export function isSameAddress(a?: string, b?: string): boolean {
  return a === b || a?.toLowerCase() === b?.toLowerCase() // Lazy-lowercases the addresses
}

/**
 * Shortens an Ethereum address. If the address is not valid, it returns an empty string.
 *
 * @param address - The address to shorten
 * @param chars - The number of characters to show at the beginning after the 0x and end.
 * @param charsEnd - (Optional) The number of characters to show at the end if different from chars.
 */
export function shortenAddress(address = '', chars = 4, charsEnd?: number): string {
  const parsed = isAddress(address)
  if (!parsed) {
    return ''
  }
  if (charsEnd === undefined) {
    charsEnd = chars
  }

  return ellipseAddressAdd0x(parsed, chars, charsEnd)
}

/**
 * Shorten an address and add 0x to the start if missing
 * @param targetAddress
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
function ellipseAddressAdd0x(targetAddress: string, charsStart = 4, charsEnd = 4): string {
  const hasPrefix = targetAddress.startsWith('0x')
  const prefix = hasPrefix ? '' : '0x'
  const wholeAddress = prefix + targetAddress
  if (charsStart + charsEnd >= wholeAddress.length) {
    return wholeAddress
  }
  return ellipseMiddle(prefix + targetAddress, charsStart + 2, charsEnd)
}

/**
 * Shorten a string with "..." in the middle
 * @param target
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
export function ellipseMiddle(target: string, charsStart = 4, charsEnd = 4): string {
  return `${target.slice(0, charsStart)}...${target.slice(target.length - charsEnd)}`
}
