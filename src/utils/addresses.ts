import { utils } from 'ethers'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { logger } from 'src/utils/logger'

export enum AddressStringFormat {
  lowercase,
  uppercase,
  checksum,
  shortened,
}

export function isValidAddress(address: Nullable<Address>, allowZero = true) {
  // Need to catch because ethers' isAddress throws in some cases (bad checksum)
  try {
    const isValid = address && utils.isAddress(address)
    if (allowZero) return !!isValid
    else return !!isValid && address !== NULL_ADDRESS
  } catch (error) {
    logger.warn('Invalid address', error, address)
    return false
  }
}

export function validateAddress(address: Nullable<Address>, context?: string) {
  if (!isValidAddress(address)) {
    const errorMsg = `Invalid addresses ${address} (${context})`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }
  return address as Address
}

export function normalizeAddress(
  _address: Nullable<Address>,
  format = AddressStringFormat.checksum
): Address {
  const address = validateAddress(_address, 'normalize')
  switch (format) {
    case AddressStringFormat.lowercase:
      return address.toLowerCase()
    case AddressStringFormat.uppercase:
      return address.toUpperCase()
    case AddressStringFormat.shortened:
      return address.substr(0, 8)
    case AddressStringFormat.checksum:
    default:
      return utils.getAddress(address)
  }
}

export function parseAddress(input: Nullable<string>): Address | null {
  if (isValidAddress(input)) return normalizeAddress(input)
  else return null
}

export function areAddressesEqual(_a1: Nullable<Address>, _a2: Nullable<Address>) {
  const a1 = validateAddress(_a1, 'compare')
  const a2 = validateAddress(_a2, 'compare')
  return utils.getAddress(a1) === utils.getAddress(a2)
}

export function trimLeading0x(input: Address): string {
  return input.startsWith('0x') ? input.substring(2) : input
}

export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') ? input : `0x${input}`
}
