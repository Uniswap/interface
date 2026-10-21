import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useMemo } from 'react'
import { useLocation, useParams } from 'react-router'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { deriveTokenFromMultichainToken } from 'uniswap/src/data/apiClients/dataApiService/tokens/utils'
import { normalizeBackendNativeAddress } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  isNativeCurrencyAddress,
  normalizeCurrencyIdForMapLookup,
} from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useSrcColor } from '~/hooks/useColor'
import type { LoadedTDPContext, MultiChainMap, PendingTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { useTokenDetailsAuction } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { getTdpTokenMultiChainQueryOptions } from '~/pages/TokenDetails/tdpTokenQueryOptions'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** React Query names refetched by the TDP heartbeat's full tick. Price-bearing queries are owned by the price tick instead (see useTDPHeartbeatCoordinator). */
const TDP_DATA_API_QUERY_NAMES = [
  'getTokenMarkets',
  'getTokenMarketsMultiChain',
  'getTokenHistoryVolume',
  'getTokenHistoryTVL',
]

export function useCreateTDPContext(): {
  state: PendingTDPContext | LoadedTDPContext
  balancesRefetch: () => void
  tokenRefetch: () => Promise<unknown>
} {
  const { tokenAddress } = useParams<{ tokenAddress: string; chainName: string }>()
  if (!tokenAddress) {
    throw new Error('Invalid token details route: token address URL param is undefined')
  }

  const currencyChainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const auctionSource = useTokenDetailsAuction({ chainId: currencyChainInfo.id, tokenAddress, isNative })

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChainInfo.backendChain.chain) : tokenAddress

  // getTdpTokenMultiChainQueryOptions cache-normalizes the address, so this query key matches the ones
  // the shared token hooks (and the Launches hover-prefetch) build — GetTokenMultiChain never double-fetches.
  const tokenMultiChainQueryOptions = getTdpTokenMultiChainQueryOptions({
    chainId: currencyChainInfo.id,
    address: tokenAddress,
    isNative,
  })
  // Legacy rows without deployments must refetch on mount and when navigating between tokens.
  const staleTime: typeof tokenMultiChainQueryOptions.staleTime = (query) => {
    const persistedToken = query.state.data?.token
    // `deployments` is typed required, so widen it to see the key an older client's row lacks.
    if (persistedToken && !(persistedToken as Partial<typeof persistedToken>).deployments) {
      return 0
    }
    return typeof tokenMultiChainQueryOptions.staleTime === 'function'
      ? tokenMultiChainQueryOptions.staleTime(query)
      : (tokenMultiChainQueryOptions.staleTime ?? 0)
  }
  const getTokenMultiChainQuery = useQuery({ ...tokenMultiChainQueryOptions, staleTime })

  const token = useMemo(
    () =>
      deriveTokenFromMultichainToken({
        multichainToken: getTokenMultiChainQuery.data?.token,
        chainId: currencyChainInfo.id,
      }),
    [getTokenMultiChainQuery.data?.token, currencyChainInfo.id],
  )

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
  const restCurrency = useMemo(() => (token ? restV2TokenToCurrencyInfo(token)?.currency : undefined), [token])

  const multichainToken = getTokenMultiChainQuery.data?.token

  const currency = useMemo(() => {
    return isNative ? nativeCurrency : restCurrency
  }, [isNative, nativeCurrency, restCurrency])

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

  const { pageQueryLoading, chainDataLoading, multichainTokenLoaded } = useMemo(() => {
    // keepPreviousData can serve a stale, chain-mismatched token with isLoading: false during a nav,
    // so isPlaceholderData must count as unsettled too — it's false again on a same-key refetch.
    // A persisted row without a usable deployment gives no currency but isLoading: false, so a refetch in flight
    // with no currency must also count as unsettled, or the page redirects to "Token not found" before it lands.
    const isRestTokenUnsettled =
      getTokenMultiChainQuery.isLoading ||
      getTokenMultiChainQuery.isPlaceholderData ||
      (getTokenMultiChainQuery.isFetching && !currency)
    return {
      pageQueryLoading: isRestTokenUnsettled,
      chainDataLoading: isRestTokenUnsettled,
      multichainTokenLoaded: getTokenMultiChainQuery.isSuccess || getTokenMultiChainQuery.isError,
    }
  }, [
    getTokenMultiChainQuery.isLoading,
    getTokenMultiChainQuery.isPlaceholderData,
    getTokenMultiChainQuery.isFetching,
    getTokenMultiChainQuery.isSuccess,
    getTokenMultiChainQuery.isError,
    currency,
  ])

  const queryClient = useQueryClient()
  const tokenRefetch = useCallback(async () => {
    const tasks: Promise<unknown>[] = TDP_DATA_API_QUERY_NAMES.map((name) =>
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }),
    )
    return Promise.allSettled(tasks)
  }, [queryClient])

  const state = useMemo(() => {
    return {
      currency,
      currencyChain: currencyChainInfo.backendChain.chain,
      currencyChainId: currencyChainInfo.id,
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: (currency?.isNative ? NATIVE_CHAIN_ID : currency?.address) ?? tokenAddress,
      multiChainMap,
      balanceError,
      selectedMultichainChainId: undefined,
      tokenColor,
      pathTokenDbAddress: tokenDBAddress,
      token,
      multichainToken,
      multichainTokenLoaded,
      pageQueryLoading,
      auctionSource,
      chainDataLoading,
    }
  }, [
    currency,
    currencyChainInfo.backendChain.chain,
    currencyChainInfo.id,
    tokenAddress,
    multiChainMap,
    balanceError,
    tokenColor,
    tokenDBAddress,
    token,
    multichainToken,
    multichainTokenLoaded,
    pageQueryLoading,
    auctionSource,
    chainDataLoading,
  ])
  return { state, balancesRefetch, tokenRefetch }
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
      // The backend's v2 endpoints serve native tokens under placeholder addresses ('ETH', the legacy
      // 0xeee… sentinel, or the zero address) that don't match chains like Polygon/Celo whose canonical
      // native address is a real contract address — normalize before checking/building the currency id.
      const normalizedAddress = normalizeBackendNativeAddress({ chainId, address: deploymentAddress })
      const isNativeDeployment = isNativeCurrencyAddress(chainId, normalizedAddress)

      const update = map[chainId] ?? {}
      // Native deployments keep an undefined address (parity with GraphQL's null-address rows)
      update.address = isNativeDeployment ? undefined : deploymentAddress

      if (balancesByNormalizedId) {
        const currencyId = isNativeDeployment
          ? buildNativeCurrencyId(chainId)
          : buildCurrencyId(chainId, deploymentAddress)
        update.balance = balancesByNormalizedId[normalizeCurrencyIdForMapLookup(currencyId)]
      }

      map[chainId] = update
      return map
    }, {})
  }, [balancesById, multichainToken?.addresses])

  return { multiChainMap, balanceError, balancesRefetch }
}
