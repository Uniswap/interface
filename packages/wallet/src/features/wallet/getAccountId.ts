import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'

export function getAccountId(address: Address): string {
  return normalizeAddress(address, AddressStringFormat.Lowercase)
}
