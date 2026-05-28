/**
 * Type guard to check if an address is a defined (non-empty) string.
 */
function isDefinedAddress(address: string | undefined | null): address is string {
  return typeof address === 'string' && address.length > 0
}

/**
 * Filters out undefined, null, and empty string values from an array of wallet addresses.
 *
 * @param addresses - Array of potentially undefined/null wallet addresses
 * @returns Array of defined wallet addresses (non-empty strings)
 *
 * @example
 * ```ts
 * filterDefinedWalletAddresses([evmAddress, svmAddress])
 * // Returns: ['0x123...', '9WzDX...'] (only defined addresses)
 * ```
 */
export function filterDefinedWalletAddresses(addresses: ReadonlyArray<string | undefined | null>): string[] {
  return addresses.filter(isDefinedAddress)
}
