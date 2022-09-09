import { utils } from 'ethers'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'

export enum AddressStringFormat {
  Lowercase,
  Uppercase,
  Shortened,
}

export function getChecksumAddress(address: string): string {
  return utils.getAddress(address)
}

/**
 * Validates an address and returns the normalized address: lowercased or checksummed depending on the checksum field.
 *
 * When withChecksum === true, this method performs a checksum on the address. Please, use only for validating user input.
 *
 * When withChecksum === false, it checks: length === 42 and startsWith('0x') and returns a lowercased address.
 *
 * Usage:
 * `if(getValidAddress(address, withChecksum))`: Works because strings are truthy and null is falsy
 *
 * @param address The address to validate and normalize
 * @param withChecksum Whether to perform a checksum on the address
 * @returns The normalized address or false if the address is invalid
 */
export function getValidAddress(
  address: NullUndefined<string>,
  withChecksum = false
): Nullable<string> {
  if (!address) {
    return null
  }

  if (withChecksum) {
    try {
      return getChecksumAddress(address)
    } catch (error) {
      logMessage(LogContext.ValidateAddress, `Invalid address at checksum: ${address}`)
      return null
    }
  }

  if (address.length !== 42 || !address.startsWith('0x')) {
    logMessage(LogContext.ValidateAddress, `Address has an invalid format. Address: ${address}`)

    return null
  }

  return normalizeAddress(address, AddressStringFormat.Lowercase)
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
 * Normalizes an address given a format
 *
 * **Note**: To get the checksum address please, use {@link getValidAddress(address, true)}
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

/**
 * Replaces any instance of 'x' letter in address string with an added zero-width-space invisible character
 * this is done to solve an issue with the Inter font where an 'x' character between to numbers will be replaced as a muliplication sign
 *
 * @param address Address to sanitize
 * @returns Sanitized address string
 */
export function sanitizeAddressText(address?: string): NullUndefined<string> {
  const zws = '\u{200b}' // Zero-width space unicode
  return address?.replace('x', `x${zws}`)
}

export function areAddressesEqual(a1: Nullable<Address>, a2: Nullable<Address>) {
  const validA1 = getValidAddress(a1, true)
  const validA2 = getValidAddress(a2, true)
  return validA1 !== null && validA2 !== null && validA1 === validA2
}

export function trimLeading0x(input: Address): string {
  return input.startsWith('0x') ? input.substring(2) : input
}

export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') ? input : `0x${input}`
}
