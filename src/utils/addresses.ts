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

/**
 * Shortens an Ethereum address by N characters (search keywords: .slice .truncate)
 * @param address blockchain address
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
export function shortenAddress(address: string, charsStart = 4, charsEnd?: number): string {
  const parsed = isAddress(address)
  if (!parsed) return ''

  return `${address.substring(0, charsStart + 2)}...${address.substring(42 - (charsEnd || charsStart))}`
}
