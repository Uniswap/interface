import { getAddress } from '@ethersproject/address'
import { logger } from 'utilities/src/logger/logger'

export enum AddressStringFormat {
  Lowercase = 0,
  Uppercase = 1,
  Shortened = 2,
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
 * @param log If logging is enabled in case of errors
 * @returns The normalized address or false if the address is invalid
 */
export function getValidAddress(address: Maybe<string>, withChecksum = false, log = true): Nullable<string> {
  try {
    if (!address) {
      return null
    }

    const addressWith0x = ensureLeading0x(address.trim())

    if (withChecksum) {
      return getAddress(addressWith0x)
    }

    // TODO(WALL-5160): Note that we do not check for [0-9a-fA-F] due to possible performance
    if (addressWith0x.length !== 42) {
      throw new Error('Address has an invalid format')
    }

    return normalizeAddress(addressWith0x, AddressStringFormat.Lowercase)
  } catch (error) {
    if (log) {
      logger.warn('utils/addresses', 'getValidAddress', (error as Error)?.message, {
        data: address,
        stacktrace: new Error().stack,
      })
    }
    return null
  }
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
export function sanitizeAddressText(address?: string): Maybe<string> {
  const zws = '\u{200b}' // Zero-width space unicode
  return address?.replace('x', `x${zws}`)
}

export function areAddressesEqual(a1: Maybe<Address>, a2: Maybe<Address>): boolean {
  const validA1 = getValidAddress(a1)
  const validA2 = getValidAddress(a2)
  return validA1 !== null && validA2 !== null && validA1 === validA2
}

/**
 * Prepend '0x' if the input address does not start with '0x'/'0X'
 */
export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') || input.startsWith('0X') ? input : `0x${input}`
}
