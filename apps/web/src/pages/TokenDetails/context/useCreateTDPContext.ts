import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useLocation, useParams } from 'react-router'
import { useSporeColors } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  getGetTokenMultiChainQueryOptions,
  getGetTokenQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import type { RWACandidate } from 'uniswap/src/features/rwa/rwaMatch'
import { usePreferProjectMarketData } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  isNativeCurrencyAddress,
  normalizeCurrencyIdForMapLookup,
} from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { gqlToCurrency } from '~/data/util'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useSrcColor } from '~/hooks/useColor'
import {
  adaptLegacyTokenToV2MultichainToken,
  adaptLegacyTokenToV2Token,
} from '~/pages/TokenDetails/context/adaptLegacyTdpData'
import type { LoadedTDPContext, MultiChainMap, PendingTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** React Query names refetched by the TDP heartbeat's full tick when the V2 flag is on. Price-bearing queries are owned by the price tick instead (see useTDPHeartbeatCoordinator). */
const TDP_DATA_API_QUERY_NAMES = [
  'getTokenMarkets',
  'getTokenMarketsMultiChain',
  'getTokenHistoryVolume',
  'getTokenHistoryTVL',
]

/** True when the legacy GraphQL source is missing the token logo or any headline stat — the trigger for the Robinhood V2 fallback (see effectiveV2 in useCreateTDPContext). */
function isLegacyTdpDataMissing({
  metadataToken,
  marketToken,
}: {
  metadataToken: NonNullable<GraphQLApi.TokenProjectWebQuery['token']>
  marketToken: GraphQLApi.TokenWebQuery['token'] | undefined
}): boolean {
  if (!metadataToken.project?.logoUrl) {
    return true
  }
  const market = marketToken?.market
  const projectMarket = marketToken?.project?.markets?.[0]
  const stats = [
    market?.totalValueLocked?.value,
    projectMarket?.marketCap?.value,
    projectMarket?.fullyDilutedValuation?.value,
    projectMarket?.volume24H?.value ?? market?.volume24H?.value,
    projectMarket?.priceHigh52W?.value ?? market?.priceHigh52W?.value,
    projectMarket?.priceLow52W?.value ?? market?.priceLow52W?.value,
  ]
  return stats.some((value) => value == null)
}

export function useCreateTDPContext(): {
  state: PendingTDPContext | LoadedTDPContext
  balancesRefetch: () => void
  tokenRefetch: () => Promise<unknown>
  isV2TokensEnabled: boolean
} {
  const { tokenAddress } = useParams<{ tokenAddress: string; chainName: string }>()
  if (!tokenAddress) {
    throw new Error('Invalid token details route: token address URL param is undefined')
  }

  const currencyChainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChainInfo.backendChain.chain) : tokenAddress
  const rwaCoinGeckoDataEnabled = useFeatureFlag(FeatureFlags.RWACoinGeckoData)
  const isV2TokensEnabledFlag = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const isRobinhoodChain = currencyChainInfo.id === UniverseChainId.Robinhood
  // On Robinhood the legacy GraphQL source is often incomplete (missing logo / stats). Prefetch the
  // V2 endpoints there so the page can fall back to them the moment we detect legacy is missing data
  // (`effectiveV2` below), with no extra request latency. Elsewhere only the flag drives V2.
  const shouldFetchV2 = isV2TokensEnabledFlag || isRobinhoodChain

  // currencyIdToRestContractInput cache-normalizes the address, so this query key matches the ones
  // the shared token hooks build from the checksummed currency — GetToken never double-fetches.
  const restTokenIdentifier = useMemo(() => {
    const chainId = currencyChainInfo.id
    const pageCurrencyId = isNative ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, tokenAddress)
    return currencyIdToRestContractInput(pageCurrencyId)
  }, [isNative, tokenAddress, currencyChainInfo.id])

  const getTokenQuery = useQuery(
    getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: shouldFetchV2,
    }),
  )
  const getTokenMultiChainQuery = useQuery(
    getGetTokenMultiChainQueryOptions({
      params: { identifier: { case: 'token', value: restTokenIdentifier } },
      enabled: shouldFetchV2,
    }),
  )

  // Split query: this lightweight metadata query (no market fields, so no ClickHouse/Aurora) gates
  // the page and powers the header; the heavier market `useTokenWebQuery` below stays non-blocking.
  const tokenProjectQuery = GraphQLApi.useTokenProjectWebQuery({
    variables: {
      address: tokenDBAddress,
      chain: currencyChainInfo.backendChain.chain,
    },
    errorPolicy: 'all',
    skip: isV2TokensEnabledFlag,
  })

  const restToken = getTokenQuery.data?.token
  const legacyMetadataToken = tokenProjectQuery.data?.token

  const nativeCurrency = useMemo(() => {
    if (!isNative) {
      return undefined
    }
    // Tempo has a virtual "USD" native currency placeholder that is not a real token
    // and must not be displayed on the token details page.
    if (currencyChainInfo.id === UniverseChainId.Tempo) {
      return undefined
    }
    return nativeOnChain(currencyChainInfo.id)
  }, [isNative, currencyChainInfo.id])
  const restCurrency = useMemo(
    () => (restToken ? restV2TokenToCurrencyInfo(restToken)?.currency : undefined),
    [restToken],
  )
  const legacyCurrency = useMemo(
    () => (legacyMetadataToken ? gqlToCurrency(legacyMetadataToken) : undefined),
    [legacyMetadataToken],
  )

  // RWA candidates derived source-agnostically (currency + cross-chain deployments) so the TokenWeb
  // skip decision below never depends on TokenWeb's own response — nor on the `effectiveV2` decision,
  // which is itself derived from TokenWeb's stats.
  const rwaAddresses = useMemo(
    () =>
      getTokenMultiChainQuery.data?.token?.addresses ??
      adaptLegacyTokenToV2MultichainToken(legacyMetadataToken)?.addresses,
    [getTokenMultiChainQuery.data?.token?.addresses, legacyMetadataToken],
  )
  const rwaCandidates = useMemo(() => {
    const currencyForRwa = isNative ? nativeCurrency : (restCurrency ?? legacyCurrency)
    const candidates: RWACandidate[] = currencyForRwa ? getRWACandidatesFromCurrency(currencyForRwa) : []
    for (const [chainIdKey, address] of Object.entries(rwaAddresses ?? {})) {
      const chainId = Number(chainIdKey)
      if (isUniverseChainId(chainId)) {
        candidates.push({ chainId, address })
      }
    }
    return candidates
  }, [isNative, nativeCurrency, restCurrency, legacyCurrency, rwaAddresses])
  const preferProjectMarketData = usePreferProjectMarketData(rwaCandidates)

  // RWA carve-out: when project market data is preferred (RWA-matched token + RWACoinGeckoData flag),
  // the shared token hooks still read Apollo fragments that only TokenWeb populates — keep it firing.
  // Gated on the raw flag (not effectiveV2) so legacy stays loaded to power the fallback detection.
  const skipTokenWebQuery = isV2TokensEnabledFlag && !preferProjectMarketData

  const tokenQuery = GraphQLApi.useTokenWebQuery({
    variables: {
      address: tokenDBAddress,
      chain: currencyChainInfo.backendChain.chain,
      multichain: true,
      // Fetch project market fields whenever the data flag is on so RWA consumers can opt in
      // after matching without a second token query waterfall.
      preferProjectMarketData: rwaCoinGeckoDataEnabled,
    },
    errorPolicy: 'all',
    skip: skipTokenWebQuery,
  })

  // Pending means loading with nothing to render — Apollo's cache-and-network default reports
  // loading on every remount even on a full cache hit, and a populated page must never bounce
  // back to a skeleton.
  const legacyMetadataPending = tokenProjectQuery.loading && !legacyMetadataToken
  const legacyMarketPending = tokenQuery.loading && !tokenQuery.data?.token

  // Robinhood fallback: once the legacy queries have settled, fall back to the V2 endpoints if the
  // token image or any headline stat is missing from GraphQL. `effectiveV2` is the single value the
  // whole TDP reads (via the override provider) so image/stats/chart never disagree on the source.
  // Settled is the same data-gated notion the commit gate below uses, so a warm remount decides the
  // source on the cached data instead of committing legacy and swapping after revalidation.
  const effectiveV2 = useMemo(() => {
    if (isV2TokensEnabledFlag) {
      return true
    }
    const legacyLoaded = !legacyMetadataPending && !legacyMarketPending && !!legacyMetadataToken
    if (!isRobinhoodChain || !legacyLoaded) {
      return false
    }
    return isLegacyTdpDataMissing({ metadataToken: legacyMetadataToken, marketToken: tokenQuery.data?.token })
  }, [
    isV2TokensEnabledFlag,
    isRobinhoodChain,
    legacyMetadataPending,
    legacyMarketPending,
    tokenQuery.data?.token,
    legacyMetadataToken,
  ])

  const currency = useMemo(() => {
    if (isNative) {
      return nativeCurrency
    }
    // Prefer V2 when the fallback is active, but keep legacy visible until GetToken resolves so the
    // header never blanks out mid-fallback.
    return effectiveV2 ? (restCurrency ?? legacyCurrency) : legacyCurrency
  }, [isNative, effectiveV2, nativeCurrency, restCurrency, legacyCurrency])

  const multichainToken = useMemo((): PlainMessage<MultichainToken> | undefined => {
    if (!effectiveV2) {
      return adaptLegacyTokenToV2MultichainToken(legacyMetadataToken)
    }
    if (getTokenMultiChainQuery.data?.token) {
      return getTokenMultiChainQuery.data.token
    }
    // GetTokenMultiChain throws not_found for tokens outside the canonical multichain index;
    // synthesize a single-deployment result from GetToken so the page behaves as single-chain.
    if (getTokenMultiChainQuery.isError && restToken) {
      return {
        multichainId: restToken.multichain?.id ?? '',
        addresses: { [String(restToken.chainId)]: restToken.address },
        symbol: restToken.symbol,
        decimals: restToken.decimals,
        name: restToken.name,
        type: restToken.type,
        price: restToken.price,
        safety: restToken.safety,
        fees: restToken.fees,
        project: restToken.project,
      }
    }
    // Robinhood fallback: keep legacy deployments visible until GetTokenMultiChain resolves.
    return adaptLegacyTokenToV2MultichainToken(legacyMetadataToken)
  }, [
    effectiveV2,
    legacyMetadataToken,
    getTokenMultiChainQuery.data?.token,
    getTokenMultiChainQuery.isError,
    restToken,
  ])

  const token = useMemo(() => {
    const legacyToken = adaptLegacyTokenToV2Token({
      metadataToken: legacyMetadataToken,
      marketToken: tokenQuery.data?.token,
      chainId: currencyChainInfo.id,
    })
    if (effectiveV2) {
      return restToken ?? legacyToken
    }
    return legacyToken
  }, [effectiveV2, restToken, legacyMetadataToken, tokenQuery.data?.token, currencyChainInfo.id])

  const { multiChainMap, balanceError, balancesRefetch } = useMultiChainMap(multichainToken)

  // Extract color for page usage
  const colors = useSporeColors()
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const { preloadedLogoSrc } = (useLocation().state as { preloadedLogoSrc?: string }) ?? {}
  const extractedColorSrc = token?.project?.logoUrl ?? preloadedLogoSrc
  const tokenColor =
    useSrcColor({
      src: extractedColorSrc,
      currencyName: currency?.name,
      backgroundColor: colors.surface2.val,
    }).tokenColor ?? undefined

  // The Robinhood V2 fallback decision (effectiveV2) needs BOTH legacy queries resolved. Until then
  // we can't know the final source, so hold the skeleton rather than render incomplete legacy data
  // that the fallback would immediately replace with a skeleton + V2 data. No-op under the V2 flag
  // (legacy is skipped) and off Robinhood.
  const robinhoodFallbackUndecided =
    isRobinhoodChain && !isV2TokensEnabledFlag && (legacyMetadataPending || legacyMarketPending)

  // Once the source is decided, V2 reads wait on the V2 token (not legacy) so a fallback page renders
  // straight to V2 data instead of flashing the legacy data it's replacing.
  const { pageQueryLoading, chainDataLoading, marketDataLoading, multichainTokenLoaded } = useMemo(() => {
    const hasLegacyMetadata = legacyMetadataToken?.project?.tokens !== undefined
    if (robinhoodFallbackUndecided) {
      return { pageQueryLoading: true, chainDataLoading: true, marketDataLoading: true, multichainTokenLoaded: false }
    }
    return {
      pageQueryLoading: effectiveV2 ? getTokenQuery.isLoading && !restToken : legacyMetadataPending,
      chainDataLoading: effectiveV2
        ? (getTokenQuery.isLoading || getTokenMultiChainQuery.isLoading) && !restToken
        : legacyMetadataPending,
      marketDataLoading: effectiveV2 ? false : legacyMarketPending,
      multichainTokenLoaded: effectiveV2
        ? getTokenMultiChainQuery.isSuccess || getTokenMultiChainQuery.isError || hasLegacyMetadata
        : hasLegacyMetadata,
    }
  }, [
    robinhoodFallbackUndecided,
    effectiveV2,
    getTokenQuery.isLoading,
    getTokenMultiChainQuery.isLoading,
    getTokenMultiChainQuery.isSuccess,
    getTokenMultiChainQuery.isError,
    legacyMetadataPending,
    legacyMarketPending,
    legacyMetadataToken,
    restToken,
  ])

  const queryClient = useQueryClient()
  const tokenQueryRefetch = tokenQuery.refetch
  const tokenRefetch = useCallback(async () => {
    if (!effectiveV2) {
      return tokenQueryRefetch()
    }
    const tasks: Promise<unknown>[] = TDP_DATA_API_QUERY_NAMES.map((name) =>
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }),
    )
    if (!skipTokenWebQuery) {
      tasks.push(tokenQueryRefetch())
    }
    return Promise.allSettled(tasks)
  }, [effectiveV2, skipTokenWebQuery, queryClient, tokenQueryRefetch])

  const state = useMemo(() => {
    return {
      currency,
      currencyChain: currencyChainInfo.backendChain.chain,
      currencyChainId: currencyChainInfo.id,
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: (currency?.isNative ? NATIVE_CHAIN_ID : currency?.address) ?? tokenAddress,
      tokenQuery,
      tokenProjectQuery,
      multiChainMap,
      balanceError,
      selectedMultichainChainId: undefined,
      tokenColor,
      pathTokenDbAddress: tokenDBAddress,
      token,
      multichainToken,
      multichainTokenLoaded,
      pageQueryLoading,
      chainDataLoading,
      marketDataLoading,
    }
  }, [
    currency,
    currencyChainInfo.backendChain.chain,
    currencyChainInfo.id,
    tokenAddress,
    tokenQuery,
    tokenProjectQuery,
    multiChainMap,
    balanceError,
    tokenColor,
    tokenDBAddress,
    token,
    multichainToken,
    multichainTokenLoaded,
    pageQueryLoading,
    chainDataLoading,
    marketDataLoading,
  ])

  return { state, balancesRefetch, tokenRefetch, isV2TokensEnabled: effectiveV2 }
}

/** Returns a map to store addresses and balances of the TDP token on other chains */
function useMultiChainMap(multichainToken: PlainMessage<MultichainToken> | undefined): {
  multiChainMap: MultiChainMap
  balanceError?: Error
  balancesRefetch: () => void
} {
  const activeAddresses = useActiveAddresses()
  const evmAddress = activeAddresses.evmAddress
  const svmAddress = activeAddresses.svmAddress

  const {
    data: balancesById,
    error: balanceError,
    refetch: balancesRefetchRaw,
  } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    skip: !evmAddress && !svmAddress,
  })

  // A loaded-but-empty portfolio has nothing to go stale, and swap confirmations invalidate these
  // queries directly (see refetchQueriesViaOnchainOverrideVariantSaga) — skip heartbeat refetches.
  const isPortfolioEmpty = balancesById !== undefined && Object.keys(balancesById).length === 0
  const balancesRefetch = useCallback(() => {
    if (!isPortfolioEmpty) {
      balancesRefetchRaw()
    }
  }, [isPortfolioEmpty, balancesRefetchRaw])

  const multiChainMap = useMemo(() => {
    const addresses = multichainToken?.addresses
    if (!addresses) {
      return {}
    }

    // GetTokenMultiChain returns checksummed addresses while portfolio balance ids are built from
    // REST portfolio casing (typically lowercase); legacy GraphQL rows are lowercase. Normalize
    // both sides of the lookup so balances never miss on address case.
    const balancesByNormalizedId =
      balancesById &&
      Object.fromEntries(
        Object.entries(balancesById).map(([id, balance]) => [normalizeCurrencyIdForMapLookup(id), balance]),
      )

    return Object.entries(addresses).reduce<MultiChainMap>((map, [chainIdKey, deploymentAddress]) => {
      const chainId = Number(chainIdKey)
      if (!isUniverseChainId(chainId)) {
        return map
      }
      const chain = toGraphQLChain(chainId)
      const isNativeDeployment = isNativeCurrencyAddress(chainId, deploymentAddress)

      const update = map[chain] ?? {}
      // Native deployments keep an undefined address (parity with GraphQL's null-address rows)
      update.address = isNativeDeployment ? undefined : deploymentAddress

      if (balancesByNormalizedId) {
        const currencyId = isNativeDeployment
          ? buildNativeCurrencyId(chainId)
          : buildCurrencyId(chainId, deploymentAddress)
        update.balance = balancesByNormalizedId[normalizeCurrencyIdForMapLookup(currencyId)]
      }

      map[chain] = update
      return map
    }, {})
  }, [balancesById, multichainToken?.addresses])

  return { multiChainMap, balanceError, balancesRefetch }
}
