import { BigNumber } from '@ethersproject/bignumber'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { sortKeysRecursively } from 'utilities/src/primitives/objects'

type BuildCurrencyParams = {
  chainId?: Nullable<UniverseChainId>
  address?: Nullable<string>
  decimals?: Nullable<number>
  symbol?: Nullable<string>
  name?: Nullable<string>
  bypassChecksum?: boolean
  buyFeeBps?: string
  sellFeeBps?: string
}

// use inverse check here (instead of isNativeAddress) so we can typeguard address as must be string if this is true
function isNonNativeAddress(chainId: UniverseChainId, address: Maybe<string>): address is string {
  return !isNativeCurrencyAddress(chainId, address)
}

const CURRENCY_CACHE = new Map<string, Token | NativeCurrency | undefined>()

/**
 * Creates a new instance of Token or NativeCurrency, or returns an existing copy if one was already created.
 *
 * @param params The parameters for building the currency.
 * @param params.chainId The ID of the chain where the token resides. If not provided, the function will return undefined.
 * @param params.address The token's address. If not provided, an instance of NativeCurrency is returned.
 * @param params.decimals The decimal count used by the token. If not provided, the function will return undefined.
 * @param params.symbol The token's symbol. This parameter is optional.
 * @param params.name The token's name. This parameter is optional.
 * @param params.bypassChecksum If true, bypasses the EIP-55 checksum on the token address. This parameter is optional and defaults to true.
 * @param params.buyFeeBps The buy fee in basis points. This parameter is optional.
 * @param params.sellFeeBps The sell fee in basis points. This parameter is optional.
 * @returns A new instance of Token or NativeCurrency if the parameters are valid, otherwise returns undefined.
 */
// eslint-disable-next-line complexity
export function buildCurrency(args: BuildCurrencyParams): Token | NativeCurrency | undefined {
  const { chainId, address, decimals, symbol, name, bypassChecksum = true, buyFeeBps, sellFeeBps } = args

  if (!chainId || decimals === undefined || decimals === null) {
    return undefined
  }

  const cacheKey = JSON.stringify(
    sortKeysRecursively({ ...args, address: normalizeTokenAddressForCache(address ?? null) }),
  )

  if (CURRENCY_CACHE.has(cacheKey)) {
    // This allows us to better memoize components that use a `Currency` as a dependency.
    return CURRENCY_CACHE.get(cacheKey)
  }

  let result: Token | NativeCurrency | undefined
  if (chainId === UniverseChainId.Solana && address) {
    try {
      if (isNativeCurrencyAddress(chainId, address)) {
        // Return native SOL for native addresses
        result = nativeOnChain(chainId)
      } else if (address === WRAPPED_SOL_ADDRESS_SOLANA) {
        // Return singleton WSOL for wrapped address
        result = WRAPPED_NATIVE_CURRENCY[chainId]
      } else {
        // Return regular SPL token for other addresses
        result = new SolanaToken(chainId, address, decimals, symbol ?? undefined, name ?? undefined)
      }
    } catch (error) {
      // TODO(SWAP-262): Investigate remaining source of lowercased SPL token addresses
      const isLowercasedAddress = address.toLowerCase() === address
      const displayError = isLowercasedAddress ? new Error(`Invalid lowercased SPL token address: ${address}`) : error

      logger.error(displayError, {
        tags: { file: 'buildCurrency.ts', function: 'buildCurrency' },
      })
    }
  } else {
    const buyFee = buyFeeBps && BigNumber.from(buyFeeBps).gt(0) ? BigNumber.from(buyFeeBps) : undefined
    const sellFee = sellFeeBps && BigNumber.from(sellFeeBps).gt(0) ? BigNumber.from(sellFeeBps) : undefined

    result = isNonNativeAddress(chainId, address)
      ? new Token(chainId, address, decimals, symbol ?? undefined, name ?? undefined, bypassChecksum, buyFee, sellFee)
      : nativeOnChain(chainId)
  }

  CURRENCY_CACHE.set(cacheKey, result)
  return result
}

const CURRENCY_INFO_CACHE = new Map<string, CurrencyInfo>()

export function buildCurrencyInfo(args: CurrencyInfo): CurrencyInfo {
  const cacheKey = JSON.stringify(sortKeysRecursively(args))

  const cachedCurrencyInfo = CURRENCY_INFO_CACHE.get(cacheKey)

  if (cachedCurrencyInfo) {
    // This allows us to better memoize components that use a `CurrencyInfo` as a dependency.
    return cachedCurrencyInfo
  }

  CURRENCY_INFO_CACHE.set(cacheKey, args)
  return args
}
