import { DeepPartial } from '@apollo/client/utilities'
import { DataTag, DefaultError, QueryKey, queryOptions, UndefinedInitialDataOptions } from '@tanstack/react-query'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import ms from 'ms'
import { ExploreTab } from 'pages/Explore/constants'
import { TokenStat } from 'state/explore/types'
import { ColorTokens } from 'ui/src'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  fromGraphQLChain,
  isBackendSupportedChain,
  isUniverseChainId,
  toGraphQLChain,
  toSupportedChainId,
} from 'uniswap/src/features/chains/utils'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { getChainIdFromBackendChain, getChainIdFromChainUrlParam } from 'utils/chainParams'
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
export function toHistoryDuration(timePeriod: TimePeriod): GraphQLApi.HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return GraphQLApi.HistoryDuration.Hour
    case TimePeriod.DAY:
      return GraphQLApi.HistoryDuration.Day
    case TimePeriod.WEEK:
      return GraphQLApi.HistoryDuration.Week
    case TimePeriod.MONTH:
      return GraphQLApi.HistoryDuration.Month
    case TimePeriod.YEAR:
      return GraphQLApi.HistoryDuration.Year
  }
}

export type PricePoint = { timestamp: number; value: number }

export function toContractInput(currency: Currency, fallback: UniverseChainId): GraphQLApi.ContractInput {
  const supportedChainId = toSupportedChainId(currency.chainId)
  const chain = toGraphQLChain(supportedChainId ?? fallback)
  return { chain, address: currency.isToken ? currency.address : getNativeTokenDBAddress(chain) }
}

export function gqlToCurrency(token: DeepPartial<GraphQLApi.Token | TokenStat>): Currency | undefined {
  if (!token.chain) {
    return undefined
  }
  const chainId =
    getChainIdFromChainUrlParam(token.chain.toLowerCase()) ?? getChainIdFromBackendChain(token.chain as GqlChainId)
  if (!chainId) {
    return undefined
  }
  if (token.standard === GraphQLApi.TokenStandard.Native || token.address === NATIVE_CHAIN_ID || !token.address) {
    return nativeOnChain(chainId)
  } else {
    return buildCurrency({
      ...token,
      decimals: token.decimals ?? 18,
      symbol: token.symbol ?? undefined,
      name: token.name ?? token.project?.name ?? undefined,
      chainId,
      bypassChecksum: false,
      buyFeeBps: token.feeData?.buyFeeBps,
      sellFeeBps: token.feeData?.sellFeeBps,
    })
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
    return buildCurrency({
      chainId: supportedChainId,
      address: forCurrency.address,
      decimals: 18,
      symbol: forCurrency.cryptoCurrencyCode,
      name: forCurrency.displayName,
    })
  }
}

export function supportedChainIdFromGQLChain(chain: GqlChainId): UniverseChainId
export function supportedChainIdFromGQLChain(chain: GraphQLApi.Chain): UniverseChainId | undefined
export function supportedChainIdFromGQLChain(chain: GraphQLApi.Chain): UniverseChainId | undefined {
  return isBackendSupportedChain(chain) ? (fromGraphQLChain(chain) ?? undefined) : undefined
}

export function getTokenExploreURL({ tab, chainUrlParam }: { tab: ExploreTab; chainUrlParam?: string }) {
  return `/explore/${tab}${chainUrlParam ? `/${chainUrlParam}` : ''}`
}

export function getTokenDetailsURL({
  address,
  chain,
  chainUrlParam,
  inputAddress,
  outputAddress,
}: {
  address?: string | null
  chain?: GraphQLApi.Chain
  chainUrlParam?: string
  inputAddress?: string | null
  outputAddress?: string | null
}) {
  const chainName = chainUrlParam || chain?.toLowerCase() || GraphQLApi.Chain.Ethereum.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  const outputAddressSuffix = outputAddress ? `&outputCurrency=${outputAddress}` : ''
  return `/explore/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}${outputAddressSuffix}`
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

  if (
    !areAddressesEqual({
      addressInput1: { address: token.address, chainId },
      addressInput2: { address: WRAPPED_NATIVE_CURRENCY[chainId]?.address, chainId },
    })
  ) {
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

type ProtocolMeta = { name: string; color: ColorTokens; gradient: { start: string; end: string } }
const PROTOCOL_META: { [source in GraphQLApi.PriceSource]: ProtocolMeta } = {
  [GraphQLApi.PriceSource.SubgraphV2]: {
    name: 'v2',
    color: '$DEP_blue400',
    gradient: { start: 'rgba(96, 123, 238, 0.20)', end: 'rgba(55, 70, 136, 0.00)' },
  },
  [GraphQLApi.PriceSource.SubgraphV3]: {
    name: 'v3',
    color: '$accent1',
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  [GraphQLApi.PriceSource.SubgraphV4]: {
    name: 'v4',
    color: '$chain_137',
    gradient: { start: 'rgba(96, 123, 238, 0.20)', end: 'rgba(55, 70, 136, 0.00)' },
  },
  [GraphQLApi.PriceSource.External]: {
    // TODO (LP-350): Remove this since this protocol chart does not exist anymore
    name: 'external',
    color: '$neutral1',
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  /* [GraphQLApi.PriceSource.UniswapX]: { name: 'UniswapX', color: purple } */
}

export function getProtocolColor(priceSource: GraphQLApi.PriceSource): ColorTokens {
  return PROTOCOL_META[priceSource].color
}

export function getProtocolName(priceSource: GraphQLApi.PriceSource): string {
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
