import { getAddress } from 'ethers/lib/utils'

/**
 * Check an Ethereum address for validity
 * @param address blockchain address
 * @returns original address or "false"
 */
export function isAddress(value: string): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}
/**
 * Shortens an Ethereum address by N characters
 * @param address blockchain address
 * @param charsStart amount of character to shorten (from both ends / in the beginning)
 * @param charsEnd amount of characters to shorten in the end
 * @returns formatted string
 */
export function shortenAddress(address: string, charsStart = 4, charsEnd?: number): string {
  const parsed = isAddress(address)
  if (!parsed) throw Error(`Invalid 'address' parameter '${address}'.`)

  return `${parsed.substring(0, charsStart + 2)}...${parsed.substring(42 - (charsEnd || charsStart))}`
}

export function shortenEnsName(name?: string): string | undefined {
  return !name || name.length <= 12 ? name : `${name.substring(0, 6)}...eth`
}
