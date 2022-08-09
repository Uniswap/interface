import { isAddress } from '@ethersproject/address'

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

  return `${address.substring(0, charsStart + 2)}...${address.substring(42 - (charsEnd || charsStart))}`
}

export function shortenEnsName(name?: string): string | undefined {
  return !name || name.length <= 12 ? name : `${name.substring(0, 6)}...eth`
}
