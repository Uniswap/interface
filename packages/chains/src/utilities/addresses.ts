import { getAddress } from '@ethersproject/address'
import { ensure0xHex } from '@universe/encoding'
import type { HexString } from '@universe/encoding'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'
import { tryCatch } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { Platform, type PlatformAddress } from '../platforms/types'
import { chainIdToPlatform } from '../platforms/utils'
import { UniverseChainId } from '../rpc/types'

/**
 * Address helpers — choosing the right one:
 * - Compare two addresses: `areAddressesEqual` (platform-aware) or `areEvmAddressesEqual` (EVM; false when either is missing).
 * - Validate + normalize an address (checksummed/lowercased EVM, base58 SVM): `getValidAddress`.
 * - Format an address string (lowercase/uppercase/shorten): `normalizeAddress` — unconditional casing, EVM-oriented.
 * - Detect which platform an address belongs to: `getPlatformAddress`.
 *
 * Derive a Solana-safe cache/map key from a token address with `normalizeTokenAddressForCache`
 * (below); for a full currencyId use `normalizeCurrencyIdForMapLookup` (uniswap `currencyId`).
 */

export enum AddressStringFormat {
  Lowercase = 0,
  Uppercase = 1,
  Shortened = 2,
}

type GetValidAddressParams = {
  address: string | null | undefined
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
export function getValidAddress(params: GetValidAddressParams): HexString | string | null {
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
  const addressWith0x = ensure0xHex(address.trim())

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
export function normalizeAddress(address: string, format: AddressStringFormat): string {
  switch (format) {
    case AddressStringFormat.Lowercase:
      // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid -- this is the sanctioned normalizer's own implementation
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
export function sanitizeAddressText(address?: string): string | null | undefined {
  const zws = '\u{200b}' // Zero-width space unicode
  return address?.replace('x', `x${zws}`)
}

type AddressInput =
  | {
      address: string | null | undefined
      chainId: UniverseChainId
      platform?: never
    }
  | {
      address: string | null | undefined
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
 * Compare two EVM addresses for equality, returning `false` when either side is missing.
 *
 * Wraps `areAddressesEqual` so callers that may receive an undefined address aren't fooled by its
 * `undefined === undefined → true` short-circuit (which would otherwise mark "no address" as equal).
 */
export function areEvmAddressesEqual(
  addressA: string | null | undefined,
  addressB: string | null | undefined,
): boolean {
  if (!addressA || !addressB) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address: addressA, platform: Platform.EVM },
    addressInput2: { address: addressB, platform: Platform.EVM },
  })
}

export function normalizeTokenAddressForCache(address: string): string
export function normalizeTokenAddressForCache(address: null): null
export function normalizeTokenAddressForCache(address: string | null): string | null
export function normalizeTokenAddressForCache(address: string | null): string | null {
  // Backends may return checksummed or lowercase addresses for the same token.
  // In order to improve local cache hits, avoid unnecessary network requests, and avoid having duplicate `Token` items stored in the cache,
  // we use lowercase addresses when accessing the `Token` object from our local cache.
  // Solana addresses are case sensitive though, so this only applies to EVM addresses.

  if (address === 'NATIVE' || address === 'native') {
    return 'native' // lowercased native address for lowercase consistency
  }
  const normalizedEvmAddress = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: false })

  // if not a valid EVM address, must be SVM address
  return normalizedEvmAddress ?? address ?? null
}

/**
 * Validates a potential address string and returns a PlatformAddress with the detected platform.
 * Tries EVM validation first, then SVM.
 *
 * Note: getValidAddress already caches results internally, so wrapping this in useMemo at callsites
 * is unnecessary unless you need reference stability for the returned object.
 */
export function getPlatformAddress(potentialAddress: string | undefined): PlatformAddress | undefined {
  if (!potentialAddress) {
    return undefined
  }

  const evmAddress = getValidAddress({
    address: potentialAddress,
    platform: Platform.EVM,
    withEVMChecksum: true,
  })
  if (evmAddress) {
    return { address: evmAddress, platform: Platform.EVM }
  }

  const svmAddress = getValidAddress({
    address: potentialAddress,
    platform: Platform.SVM,
  })
  if (svmAddress) {
    return { address: svmAddress, platform: Platform.SVM }
  }

  return undefined
}
