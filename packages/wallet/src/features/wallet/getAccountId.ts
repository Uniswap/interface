import { AddressStringFormat, normalizeAddress } from 'wallet/src/utils/addresses'

export function getAccountId(address: Address): string {
  return normalizeAddress(address, AddressStringFormat.Lowercase)
}
