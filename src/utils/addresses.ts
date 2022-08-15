import { utils } from 'ethers'

export enum AddressStringFormat {
  Lowercase,
  Uppercase,
  Shortened,
}

export function getChecksumAddress(address: string): string {
  return utils.getAddress(address)
}

/**
 * Formats an address to show the first and last #chars with ... in the middle
 *
 * @param address Address to format
 * @param chars Number of chars to show at the beginning and end. This must be between 1 - 19
 * @returns Formatted string
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length !== 42) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  // leave enough space for the ellipsis
  if (chars < 1 || chars > 19) {
    throw Error(`Invalid 'chars' parameter '${chars}'.`)
  }

  return `${address.substring(0, chars)}...${address.substring(42 - chars)}`
}

/**
 * Performs a checksum
 *
 * **NOTE** This is an expensive operation. If you want to get a valid address there's no need to call this method
 * and then call getChecksum. Please, use ${@link getValidAddress}
 *
 * @param address input address
 * @returns true if the checksum was successful and the address is not the NATIVE_ADDRESS, false otherwise
 */
export function isValidAddress(address: NullUndefined<Address>) {
  return !!getValidAddress(address)
}

/**
 * Helper function to get the checksum address if valid.
 *
 * Please use this function when you want to get a checksummed and valid address
 *
 * @param address Address to verify checksum
 * @returns checksummed address if the input address is valid, null otherwise
 */
export function getValidAddress(address: NullUndefined<Address>): Nullable<Address> {
  if (!address) {
    return null
  }

  try {
    return getChecksumAddress(address!)
  } catch (error) {
    return null
  }
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

export function areAddressesEqual(a1: NullUndefined<Address>, a2: NullUndefined<Address>) {
  const validA1 = getValidAddress(a1)
  const validA2 = getValidAddress(a2)
  return validA1 !== null && validA2 !== null && validA1 === validA2
}

export function trimLeading0x(input: Address): string {
  return input.startsWith('0x') ? input.substring(2) : input
}

export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') ? input : `0x${input}`
}
