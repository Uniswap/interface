import { OperationVariables, QueryResult } from '@apollo/client'
import { DeepPartial } from '@apollo/client/utilities'
import { DataTag, DefaultError, QueryKey, UndefinedInitialDataOptions, queryOptions } from '@tanstack/react-query'
import { Currency, Token } from '@uniswap/sdk-core'
import {
  AVERAGE_L1_BLOCK_TIME,
  BACKEND_SUPPORTED_CHAINS,
  CHAIN_NAME_TO_CHAIN_ID,
  InterfaceGqlChain,
  SupportedInterfaceChainId,
  UX_SUPPORTED_GQL_CHAINS,
  chainIdToBackendChain,
  getChainFromChainUrlParam,
  isSupportedChainId,
} from 'constants/chains'

import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { DefaultTheme } from 'lib/styled-components'
import ms from 'ms'
import { ExploreTab } from 'pages/Explore'
import { useEffect } from 'react'
import { TokenStat } from 'state/explore/types'
import { ThemeColors } from 'theme/colors'
import { GQL_MAINNET_CHAINS, UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Chain,
  ContractInput,
  Token as GqlToken,
  HistoryDuration,
  PriceSource,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/types/chains'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export enum PollingInterval {
  Slow = ms(`5m`),
  Normal = ms(`1m`),
  Fast = AVERAGE_L1_BLOCK_TIME,
  LightningMcQueen = ms(`3s`), // approx block interval for polygon
}

// Polls a query only when the current component is mounted, as useQuery's pollInterval prop will continue to poll after unmount
export function usePollQueryWhileMounted<T, K extends OperationVariables>(
  queryResult: QueryResult<T, K>,
  interval: PollingInterval,
) {
  const { startPolling, stopPolling } = queryResult

  useEffect(() => {
    startPolling(interval)
    return stopPolling
  }, [interval, startPolling, stopPolling])

  return queryResult
}

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}

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

export function isPricePoint(p: PricePoint | undefined): p is PricePoint {
  return p !== undefined
}

export function isGqlSupportedChain(chainId?: SupportedInterfaceChainId) {
  return !!chainId && GQL_MAINNET_CHAINS.includes(UNIVERSE_CHAIN_INFO[chainId].backendChain.chain)
}

export function toContractInput(currency: Currency): ContractInput {
  const chain = chainIdToBackendChain({ chainId: currency.chainId as SupportedInterfaceChainId })
  return { chain, address: currency.isToken ? currency.address : getNativeTokenDBAddress(chain) }
}

export function gqlToCurrency(token: DeepPartial<GqlToken | TokenStat>): Currency | undefined {
  if (!token.chain) {
    return undefined
  }
  const chainId = getChainFromChainUrlParam(token.chain.toLowerCase())?.id
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
    )
  }
}

export function fiatOnRampToCurrency(forCurrency: FORSupportedToken): Currency | undefined {
  if (!isSupportedChainId(Number(forCurrency.chainId))) {
    return
  }
  const supportedChainId = Number(forCurrency.chainId) as SupportedInterfaceChainId

  if (!forCurrency.address) {
    return nativeOnChain(supportedChainId)
  } else {
    // The Meld code may not match the currency's symbol (e.g. codes like USDC_BASE), so these should not be used for display.
    return new Token(supportedChainId, forCurrency.address, 18, forCurrency.cryptoCurrencyCode, forCurrency.displayName)
  }
}

export function getSupportedGraphQlChain(
  chain: UniverseChainInfo | undefined,
  options: { fallbackToEthereum: true },
): UniverseChainInfo
export function getSupportedGraphQlChain(
  chain: UniverseChainInfo | undefined,
  options?: { fallbackToEthereum?: boolean },
): UniverseChainInfo | undefined
export function getSupportedGraphQlChain(
  chain: UniverseChainInfo | undefined,
  options?: { fallbackToEthereum?: boolean },
): UniverseChainInfo | undefined {
  const fallbackChain = options?.fallbackToEthereum ? UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet] : undefined
  return chain?.backendChain.backendSupported ? chain : fallbackChain
}

export function isSupportedGQLChain(chain: Chain): chain is InterfaceGqlChain {
  const chains: ReadonlyArray<Chain> = UX_SUPPORTED_GQL_CHAINS
  return chains.includes(chain)
}

export function supportedChainIdFromGQLChain(chain: InterfaceGqlChain): SupportedInterfaceChainId
export function supportedChainIdFromGQLChain(chain: Chain): SupportedInterfaceChainId | undefined
export function supportedChainIdFromGQLChain(chain: Chain): SupportedInterfaceChainId | undefined {
  return isSupportedGQLChain(chain) ? CHAIN_NAME_TO_CHAIN_ID[chain] : undefined
}

export function isBackendSupportedChain(chain: Chain): chain is InterfaceGqlChain {
  return (BACKEND_SUPPORTED_CHAINS as ReadonlyArray<Chain>).includes(chain)
}

export function getTokenExploreURL({ tab, chain }: { tab: ExploreTab; chain?: Chain }) {
  const chainName = chain?.toLowerCase()
  return `/explore/${tab}${chain ? `/${chainName}` : ''}`
}

export function getTokenDetailsURL({
  address,
  chain,
  inputAddress,
}: {
  address?: string | null
  chain: Chain
  inputAddress?: string | null
}) {
  const chainName = chain.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  return `/explore/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}`
}

export function getPoolDetailsURL(address: string, chain: Chain) {
  const chainName = chain.toLowerCase()
  return `/explore/pools/${chainName}/${address}`
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
    color: 'accent1', // TODO(WEB-4618): update the colors when they are available
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  /* [PriceSource.UniswapX]: { name: 'UniswapX', color: purple } */
}

export function getProtocolColor(priceSource: PriceSource, theme: DefaultTheme): string {
  return theme[PROTOCOL_META[priceSource].color]
}

export function getProtocolName(priceSource: PriceSource): string {
  return PROTOCOL_META[priceSource].name
}
export function getProtocolGradient(priceSource: PriceSource): { start: string; end: string } {
  return PROTOCOL_META[priceSource].gradient
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
