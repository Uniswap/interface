import { Currency } from '@uniswap/sdk-core'
import { Platform, UniverseChainId, areAddressesEqual } from '@universe/chains'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { isDefaultNativeAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

/** Parsed v2-native token shape shared by REST-backed surfaces (transaction tables, pool data). */
export interface ParsedToken {
  chainId: UniverseChainId
  /** Absent for native currency; the NATIVE placeholder and the native sentinels (zero address, legacy 0xeee…) also resolve as native. */
  address?: string
  decimals?: number
  symbol?: string
  name?: string
  logoUrl?: string
}

/** Whether the parsed token represents its chain's native currency (absent address or any native sentinel). */
export function isNativeParsedToken(token: ParsedToken): boolean {
  const { chainId, address } = token
  return (
    !address ||
    address === NATIVE_TOKEN_PLACEHOLDER ||
    // Covers both sentinels (zero address, legacy 0xeee…) on chains like Celo/Polygon whose native
    // currency has a real token address, where isNativeCurrencyAddress doesn't recognize them.
    // Platform.EVM: the sentinels are EVM-only; Solana native (11111…) is caught by isNativeCurrencyAddress.
    isDefaultNativeAddress({ address, platform: Platform.EVM }) ||
    isNativeCurrencyAddress(chainId, address)
  )
}

/**
 * Builds a Currency from a v2 token: native currency resolves from the chain, everything else
 * builds an ERC-20.
 */
export function v2TokenToCurrency(token: ParsedToken): Currency | undefined {
  const { chainId, address } = token
  if (isNativeParsedToken(token)) {
    // Tempo has no displayable native currency (mirrors gqlToCurrency).
    if (chainId === UniverseChainId.Tempo) {
      return undefined
    }
    return nativeOnChain(chainId)
  }
  return buildCurrency({
    chainId,
    address,
    decimals: token.decimals ?? 18,
    symbol: token.symbol,
    name: token.name,
    // Checksum like gqlToCurrency does — downstream URLs and equality checks expect EIP-55 addresses.
    bypassChecksum: false,
  })
}

/**
 * The v2-native counterpart of web's `unwrapToken`: if the token is the chain's wrapped-native
 * token, returns it re-branded as the native currency — address becomes absent (the parsed shape's
 * native representation) and symbol/name/decimals take the native currency's metadata. Anything
 * else passes through unchanged.
 *
 * Callers representing a token that isn't scoped to `chainId` specifically can override which
 * chain's native metadata to display by passing `{ chainId, nativeCurrencyChainId }` (native
 * currency metadata is branded per-chain, e.g. Robinhood's native ETH is named "Robinhood ETH").
 */
export function v2UnwrapToken<T extends ParsedToken>(
  chain: UniverseChainId | { chainId: UniverseChainId; nativeCurrencyChainId?: UniverseChainId },
  token: T,
): T {
  const chainId = typeof chain === 'number' ? chain : chain.chainId
  if (
    !token.address ||
    !areAddressesEqual({
      addressInput1: { address: token.address, chainId },
      addressInput2: { address: WRAPPED_NATIVE_CURRENCY[chainId]?.address, chainId },
    })
  ) {
    return token
  }

  const nativeCurrencyChainId = typeof chain === 'number' ? chain : (chain.nativeCurrencyChainId ?? chain.chainId)
  const nativeToken = nativeOnChain(nativeCurrencyChainId)
  return {
    ...token,
    address: undefined,
    symbol: nativeToken.symbol,
    name: nativeToken.name,
    decimals: nativeToken.decimals,
  }
}
