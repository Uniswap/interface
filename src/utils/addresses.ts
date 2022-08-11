import { utils } from 'ethers'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { logger } from 'src/utils/logger'

export enum AddressStringFormat {
  Lowercase,
  Uppercase,
  Shortened,
}

export function getChecksumAddress(address: string): string {
  return utils.getAddress(address)
}

// shorten the checksummed version of the input address to have 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isValidAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, chars)}...${address.substring(42 - chars)}`
}

export function isValidAddress(address: Nullable<Address>, allowZero = true) {
  // Need to catch because ethers' isAddress throws in some cases (bad checksum)
  try {
    const isValid = address && utils.isAddress(address)
    if (allowZero) return !!isValid
    else return !!isValid && address !== NATIVE_ADDRESS
  } catch (error) {
    return false
  }
}

export function validateAddress(address: Nullable<Address>, context?: string) {
  if (!isValidAddress(address)) {
    const errorMsg = `Invalid addresses ${address} (${context})`
    logger.error('addresses', 'validateAddress', errorMsg)
    throw new Error(errorMsg)
  }
  return address as Address
}

/**
 * Normalizes an address given a format
 *
 * **Note**: To get the checksum address please, use {@link getChecksumAddress}
 *
 * @param address
 * @param format One of AddressStringFormat
 * @returns the normalized address
 */
export function normalizeAddress(address: Address, format: AddressStringFormat): Address {
  switch (format) {
    case AddressStringFormat.Lowercase:
      return address.toLowerCase()
    case AddressStringFormat.Uppercase:
      return address.toUpperCase()
    case AddressStringFormat.Shortened:
      return address.substr(0, 8)
    default:
      throw new Error(`Invalid AddressStringFormat: ${format}`)
  }
}

export function parseAddress(input: Nullable<string>): Address | null {
  if (isValidAddress(input)) {
    return getChecksumAddress(input!)
  } else {
    return null
  }
}

export function areAddressesEqual(_a1: Nullable<Address>, _a2: Nullable<Address>) {
  const a1 = validateAddress(_a1, 'compare')
  const a2 = validateAddress(_a2, 'compare')
  return getChecksumAddress(a1) === getChecksumAddress(a2)
}

export function trimLeading0x(input: Address): string {
  return input.startsWith('0x') ? input.substring(2) : input
}

export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') ? input : `0x${input}`
}
