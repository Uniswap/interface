import { Currency } from '@uniswap/sdk-core'
import { Platform, UniverseChainId, areAddressesEqual } from '@universe/chains'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { MELD_NATIVE_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { getStablecoinsForChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { isDefaultNativeAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { ExploreTab, TokenStat } from '~/types/explore'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { CHAIN_SEARCH_PARAM } from '~/utils/params/chainQueryParam'

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
  MAX = 'MAX',
}

// oxlint-disable-next-line typescript/consistent-return
export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return HistoryDuration.Hour
    case TimePeriod.DAY:
      return HistoryDuration.Day
    case TimePeriod.WEEK:
      return HistoryDuration.Week
    case TimePeriod.MONTH:
      return HistoryDuration.Month
    case TimePeriod.YEAR:
      return HistoryDuration.Year
    case TimePeriod.MAX:
      return HistoryDuration.Max
  }
}

export type PricePoint = { timestamp: number; value: number }

export function tokenStatToCurrency(token: Partial<TokenStat>): Currency | undefined {
  const chainId = token.chainId
  if (token.isNative || token.address === NATIVE_CHAIN_ID || !token.address) {
    // Tempo has no displayable native currency — the virtual "USD" is a placeholder.
    // When a Tempo token is flagged native but has a real address (e.g. pathUSD),
    // fall through to buildCurrency so the token is constructed normally.
    // Only return undefined when there's truly no address to build from.
    if (chainId === UniverseChainId.Tempo) {
      if (!token.address || token.address === NATIVE_CHAIN_ID) {
        return undefined
      }
      // Fall through to buildCurrency below
    } else {
      // No address → buildCurrency returns the chain's native currency, or undefined without a chain.
      return buildCurrency({ chainId, decimals: token.decimals ?? 18 })
    }
  }

  return buildCurrency({
    ...token,
    decimals: token.decimals ?? 18,
    symbol: token.symbol ?? undefined,
    name: token.name ?? token.project?.name ?? undefined,
    chainId,
    bypassChecksum: false,
  })
}

export function fiatOnRampToCurrency(forCurrency: FORSupportedToken): Currency | undefined {
  if (!isUniverseChainId(Number(forCurrency.chainId))) {
    return undefined
  }
  const supportedChainId = Number(forCurrency.chainId) as UniverseChainId

  if (!forCurrency.address) {
    return nativeOnChain(supportedChainId)
  }

  // Prefer chain-config metadata when the address is a known stablecoin (e.g. USDG is 6 decimals, not 18).
  // Use the platform-aware comparison so SVM stablecoins (e.g. USDC on Solana) match too, not just EVM ones.
  const chainToken = getStablecoinsForChain(supportedChainId).find((token) =>
    areAddressesEqual({
      addressInput1: { address: token.address, chainId: supportedChainId },
      addressInput2: { address: forCurrency.address, chainId: supportedChainId },
    }),
  )
  if (chainToken) {
    return chainToken
  }

  // The Meld code may not match the currency's symbol (e.g. codes like USDC_BASE), so these should not be used for display.
  return buildCurrency({
    chainId: supportedChainId,
    address: forCurrency.address,
    decimals: 18,
    symbol: forCurrency.cryptoCurrencyCode,
    name: forCurrency.displayName,
  })
}

export function getTokenExploreURL({ tab, chainUrlParam }: { tab: ExploreTab; chainUrlParam?: string }) {
  return `/explore/${tab}${chainUrlParam ? `/${chainUrlParam}` : ''}`
}

export function getTokenDetailsURL({
  address,
  chainId,
  inputAddress,
  outputAddress,
  chainQueryParam,
}: {
  address?: string | null
  chainId?: UniverseChainId
  inputAddress?: string | null
  outputAddress?: string | null
  chainQueryParam?: string
}) {
  const selectedChainId = chainId ?? UniverseChainId.Mainnet
  const chainName = getChainUrlParam(selectedChainId)

  const toTokenPathSegment = (addr: string | null | undefined): string => {
    if (addr === null || addr === undefined) {
      return NATIVE_CHAIN_ID
    }
    // Meld represents native SOL with its own mint address; link to the NATIVE path, not the raw address.
    if (addr === MELD_NATIVE_SOL_ADDRESS_SOLANA) {
      return NATIVE_CHAIN_ID
    }
    // The backend can represent native currency as the zero address (or legacy 0xeee...) even on
    // chains like Celo/Polygon whose native currency has a real token address, which
    // isNativeCurrencyAddress doesn't recognize — no real token lives at either sentinel.
    // Platform.EVM (not selectedChainId, which can be undefined): both sentinels are EVM-only addresses.
    if (isDefaultNativeAddress({ address: addr, platform: Platform.EVM })) {
      return NATIVE_CHAIN_ID
    }
    if (isNativeCurrencyAddress(selectedChainId, addr)) {
      return NATIVE_CHAIN_ID
    }
    return addr
  }

  const tokenAddress = toTokenPathSegment(address)
  const params = new URLSearchParams()
  if (inputAddress) {
    params.set('inputCurrency', inputAddress)
  }
  if (outputAddress) {
    params.set('outputCurrency', outputAddress)
  }
  if (chainQueryParam) {
    params.set(CHAIN_SEARCH_PARAM, chainQueryParam)
  }
  const query = params.toString()
  return `/explore/tokens/${chainName}/${tokenAddress}${query ? `?${query}` : ''}`
}

export function unwrapToken<
  T extends
    | {
        address?: string | null
        project?: { name?: string | null }
      }
    | undefined,
>(chain: number | { chainId: number; nativeCurrencyChainId?: number }, token: T): T {
  const chainId = typeof chain === 'number' ? chain : chain.chainId

  if (!token?.address) {
    return token
  }

  const isWrappedNativeAddress = areAddressesEqual({
    addressInput1: { address: token.address, chainId },
    addressInput2: { address: WRAPPED_NATIVE_CURRENCY[chainId]?.address, chainId },
  })
  // The backend is migrating native tokens from wrapped-native addresses to the zero address
  // (e.g. ListTokens) — accept both formats, matching the isNativeCurrencyAddress shim in currencyId.ts
  const isNativeAddress = isUniverseChainId(chainId) && isNativeCurrencyAddress(chainId, token.address)

  if (!isWrappedNativeAddress && !isNativeAddress) {
    return token
  }

  // native currency metadata is branded per-chain (e.g. Robinhood's native ETH is named "Robinhood ETH");
  // callers representing a token that isn't scoped to `chainId` specifically can override which chain's
  // native currency name/symbol to display by passing `{ chainId, nativeCurrencyChainId }`
  const nativeCurrencyChainId = typeof chain === 'number' ? chain : (chain.nativeCurrencyChainId ?? chain.chainId)
  const nativeToken = nativeOnChain(nativeCurrencyChainId)

  return {
    ...token,
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...nativeToken,
    project: {
      ...token.project,
      name: nativeToken.name,
    },
    address: NATIVE_CHAIN_ID,
    extensions: undefined, // prevents marking cross-chain wrapped tokens as native
  }
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}
