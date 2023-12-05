import { getAddress } from '@ethersproject/address'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    // Alphabetical letters must be made lowercase for getAddress to work.
    // See documentation here: https://docs.ethers.io/v5/api/utils/address/
    return getAddress(value.toLowerCase())
  } catch {
    return false
  }
}

export function isSameAddress(a?: string, b?: string) {
  return a === b || a?.toLowerCase() === b?.toLowerCase() // Lazy-lowercases the addresses
}

// Shortens an Ethereum address
export function shortenAddress(address = '', charsStart = 4, charsEnd = 4): string {
  const parsed = isAddress(address)
  if (!parsed) return ''
  return ellipseAddressAdd0x(parsed, charsStart, charsEnd)
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
  return ellipseMiddle(prefix + targetAddress, charsStart + 2, charsEnd)
}

/**
 * Shorten a string with "..." in the middle
 * @param target
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
function ellipseMiddle(target: string, charsStart = 4, charsEnd = 4): string {
  return `${target.slice(0, charsStart)}...${target.slice(target.length - charsEnd)}`
}
