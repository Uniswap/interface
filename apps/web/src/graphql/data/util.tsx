import { DeepPartial } from '@apollo/client/utilities'
import { BigNumber } from '@ethersproject/bignumber'
import { DataTag, DefaultError, QueryKey, UndefinedInitialDataOptions, queryOptions } from '@tanstack/react-query'
import { Currency, Token } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { DefaultTheme } from 'lib/styled-components'
import ms from 'ms'
import { ExploreTab } from 'pages/Explore'
import { TokenStat } from 'state/explore/types'
import { ThemeColors } from 'theme/colors'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Chain,
  ContractInput,
  Token as GqlToken,
  HistoryDuration,
  PriceSource,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlChainId, UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import {
  fromGraphQLChain,
  isBackendSupportedChain,
  toGraphQLChain,
  toSupportedChainId,
} from 'uniswap/src/features/chains/utils'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export enum PollingInterval {
  Slow = ms(`5m`),
  Normal = ms(`1m`),
  Fast = AVERAGE_L1_BLOCK_TIME_MS,
  LightningMcQueen = ms(`3s`), // approx block interval for polygon
}

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}

// eslint-disable-next-line consistent-return
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
  }
}

export type PricePoint = { timestamp: number; value: number }

export function toContractInput(currency: Currency, fallback: UniverseChainId): ContractInput {
  const supportedChainId = toSupportedChainId(currency.chainId)
  const chain = toGraphQLChain(supportedChainId ?? fallback)
  return { chain, address: currency.isToken ? currency.address : getNativeTokenDBAddress(chain) }
}

export function gqlToCurrency(token: DeepPartial<GqlToken | TokenStat>): Currency | undefined {
  if (!token.chain) {
    return undefined
  }
  const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase())
  if (!chainId) {
    return undefined
  }
  if (token.standard === TokenStandard.Native || token.address === NATIVE_CHAIN_ID || !token.address) {
    return nativeOnChain(chainId)
  } else {
    return new Token(
      chainId,
      token.address,
      token.decimals ?? 18,
      token.symbol ?? undefined,
      token.name ?? token.project?.name ?? undefined,
      undefined,
      token.feeData?.buyFeeBps ? BigNumber.from(token.feeData.buyFeeBps) : undefined,
      token.feeData?.sellFeeBps ? BigNumber.from(token.feeData.sellFeeBps) : undefined,
    )
  }
}

export function fiatOnRampToCurrency(forCurrency: FORSupportedToken): Currency | undefined {
  if (!isUniverseChainId(Number(forCurrency.chainId))) {
    return undefined
  }
  const supportedChainId = Number(forCurrency.chainId) as UniverseChainId

  if (!forCurrency.address) {
    return nativeOnChain(supportedChainId)
  } else {
    // The Meld code may not match the currency's symbol (e.g. codes like USDC_BASE), so these should not be used for display.
    return new Token(supportedChainId, forCurrency.address, 18, forCurrency.cryptoCurrencyCode, forCurrency.displayName)
  }
}

export function supportedChainIdFromGQLChain(chain: GqlChainId): UniverseChainId
export function supportedChainIdFromGQLChain(chain: Chain): UniverseChainId | undefined
export function supportedChainIdFromGQLChain(chain: Chain): UniverseChainId | undefined {
  return isBackendSupportedChain(chain) ? fromGraphQLChain(chain) ?? undefined : undefined
}

export function getTokenExploreURL({ tab, chain }: { tab: ExploreTab; chain?: Chain }) {
  const chainName = chain?.toLowerCase()
  return `/explore/${tab}${chain ? `/${chainName}` : ''}`
}

export function getTokenDetailsURL({
  address,
  chain,
  chainUrlParam,
  inputAddress,
}: {
  address?: string | null
  chain?: Chain
  chainUrlParam?: string
  inputAddress?: string | null
}) {
  const chainName = chainUrlParam || chain?.toLowerCase() || Chain.Ethereum.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  return `/explore/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}`
}

export function unwrapToken<
  T extends
    | {
        address?: string | null
        project?: { name?: string | null }
      }
    | undefined,
>(chainId: number, token: T): T {
  if (!token?.address) {
    return token
  }

  const address = token.address.toLowerCase()
  const nativeAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase()
  if (address !== nativeAddress) {
    return token
  }

  const nativeToken = nativeOnChain(chainId)

  return {
    ...token,
    ...nativeToken,
    project: {
      ...token.project,
      name: nativeToken.name,
    },
    address: NATIVE_CHAIN_ID,
    extensions: undefined, // prevents marking cross-chain wrapped tokens as native
  }
}

type ProtocolMeta = { name: string; color: keyof ThemeColors; gradient: { start: string; end: string } }
const PROTOCOL_META: { [source in PriceSource]: ProtocolMeta } = {
  [PriceSource.SubgraphV2]: {
    name: 'v2',
    color: 'accent3',
    gradient: { start: 'rgba(96, 123, 238, 0.20)', end: 'rgba(55, 70, 136, 0.00)' },
  },
  [PriceSource.SubgraphV3]: {
    name: 'v3',
    color: 'accent1',
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  [PriceSource.SubgraphV4]: {
    name: 'v4',
    color: 'chain_137',
    gradient: { start: 'rgba(96, 123, 238, 0.20)', end: 'rgba(55, 70, 136, 0.00)' },
  },
  /* [PriceSource.UniswapX]: { name: 'UniswapX', color: purple } */
}

export function getProtocolColor(priceSource: PriceSource, theme: DefaultTheme): string {
  return theme[PROTOCOL_META[priceSource].color]
}

export function getProtocolName(priceSource: PriceSource): string {
  return PROTOCOL_META[priceSource].name
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * A wrapper around react-query's queryOptions that disables its caching
 * behavior, so that we can use the Apollo client in the queryFn without
 * worrying about the caches conflicting.
 */
export function apolloQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Pick<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
): Pick<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData>
  },
  'queryKey' | 'queryFn'
> {
  return queryOptions({
    ...options,
    staleTime: 0,
  })
}
