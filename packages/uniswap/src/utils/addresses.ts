import { getAddress } from '@ethersproject/address'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { HexString } from 'utilities/src/addresses/hex'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'
import { tryCatch } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'

export enum AddressStringFormat {
  Lowercase = 0,
  Uppercase = 1,
  Shortened = 2,
}

type GetValidAddressParams = {
  address: Maybe<string>
  withEVMChecksum?: boolean
  log?: boolean
} & (
  | {
      platform: Platform
      chainId?: never
    }
  | {
      platform?: never
      chainId: UniverseChainId
    }
)

const VALIDATION_CACHE_KEY_FN_MAP = {
  [Platform.EVM]: (params: GetValidAddressParams) =>
    `${Platform.EVM}-${params.address}-${Boolean(params.withEVMChecksum)}`,
  [Platform.SVM]: (params: GetValidAddressParams) => `${Platform.SVM}-${params.address}`,
} as const

const ADDRESS_VALIDATION_CACHE = new Map<string, string | null>()

function getCachedAddress(params: GetValidAddressParams): {
  cachedAddress: string | null | undefined
  cacheKey: string
} {
  const platform = params.platform ?? chainIdToPlatform(params.chainId)

  const cacheKey = VALIDATION_CACHE_KEY_FN_MAP[platform](params)
  return { cachedAddress: ADDRESS_VALIDATION_CACHE.get(cacheKey), cacheKey }
}

const VALIDATION_FN_MAP = {
  [Platform.EVM]: getValidEVMAddress,
  [Platform.SVM]: getValidSVMAddress,
} as const

/**
 * Validates an EVM or SVM address and returns the normalized address. EVM addresses will be lowercased or checksummed depending on the `withEVMChecksum` field.
 *
 * FOR EVM ADDRESSES:
 * When withEVMChecksum === true, this method performs a checksum on the address. Please, use only for validating user input.
 * When withEVMChecksum === false, it checks: length === 42 and startsWith('0x') and returns a lowercased address.
 *
 * FOR SVM ADDRESSES:
 * withEVMChecksum is ignored. SVM does not have checksum; addresses are validated to ensure they are 32 byte base58 strings.
 *
 * @param address The address to validate and normalize
 * @param withEVMChecksum Whether to perform a checksum on the address if it is an EVM address
 * @param platform The blockchain platform of the address, determines what validation is performed
 * @param log If logging is enabled in case of errors
 *
 * @returns The normalized address or false if the address is invalid
 */
export function getValidAddress(params: GetValidAddressParams): Nullable<HexString | string> {
  const { address, withEVMChecksum, log } = params
  if (!address) {
    return null
  }

  const platform = params.platform ?? chainIdToPlatform(params.chainId)

  const { cachedAddress, cacheKey } = getCachedAddress(params)
  if (cachedAddress !== undefined) {
    return cachedAddress
  }

  const { data: result, error } = tryCatch(() => VALIDATION_FN_MAP[platform]({ address, withEVMChecksum }))
  if (error && log) {
    logger.warn('utils/addresses', 'getValidAddress', (error as Error).message, {
      data: address,
      stacktrace: new Error().stack,
    })
  }

  ADDRESS_VALIDATION_CACHE.set(cacheKey, result)
  return result
}

/**
 * Validates an EVM address and returns the normalized address.
 *
 * @param address The address to validate and normalize
 * @param withEVMChecksum Whether to perform a checksum on the address
 * @returns The normalized address or null if the address is invalid
 * @throws {Error} If the address is invalid
 */
function getValidEVMAddress({ address, withEVMChecksum }: { address: string; withEVMChecksum?: boolean }): HexString {
  const addressWith0x = ensureLeading0x(address.trim())

  if (withEVMChecksum) {
    return getAddress(addressWith0x) as HexString
  }

  if (!isEVMAddress(addressWith0x)) {
    throw new Error('Address has an invalid format')
  }
  return normalizeAddress(addressWith0x, AddressStringFormat.Lowercase) as HexString
}

/**
 * Validates a Solana address and returns the normalized address.
 *
 * @param address The address to validate and normalize
 * @returns The input address, if it is a valid SVM address (32 byte base58 string)
 * @throws {Error} If the address is invalid
 */
function getValidSVMAddress({ address }: { address: string }): string {
  if (!isSVMAddress(address)) {
    throw new Error('Address has an invalid format')
  }

  return address
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

type AddressInput =
  | {
      address: Maybe<string>
      chainId: UniverseChainId
      platform?: never
    }
  | {
      address: Maybe<string>
      chainId?: never
      platform: Platform
    }

type AreAddressesEqualParams = {
  addressInput1: AddressInput
  addressInput2: AddressInput
}

export function areAddressesEqual(params: AreAddressesEqualParams): boolean {
  const { addressInput1, addressInput2 } = params
  const platform1 = addressInput1.platform ?? chainIdToPlatform(addressInput1.chainId)
  const platform2 = addressInput2.platform ?? chainIdToPlatform(addressInput2.chainId)

  if (platform1 !== platform2) {
    return false
  }

  // Solana addresses are Base58 encoded, so they are case-sensitive. Can compare strings directly.
  if (addressInput1.address === addressInput2.address) {
    return true
  }

  if (platform1 === Platform.EVM) {
    return (
      normalizeAddress(addressInput1.address ?? '', AddressStringFormat.Lowercase) ===
      normalizeAddress(addressInput2.address ?? '', AddressStringFormat.Lowercase)
    )
  }

  return false
}

/**
 * Prepend '0x' if the input address does not start with '0x'/'0X'
 */
export function ensureLeading0x(input: Address): Address {
  return input.startsWith('0x') || input.startsWith('0X') ? input : `0x${input}`
}
