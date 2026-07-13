import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router'
import { useSporeColors } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { buildCurrencyId, buildNativeCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useSrcColor } from '~/hooks/useColor'
import type { LoadedTDPContext, MultiChainMap, PendingTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export function useCreateTDPContext(): {
  state: PendingTDPContext | LoadedTDPContext
  balancesRefetch: () => void
} {
  const { tokenAddress } = useParams<{ tokenAddress: string; chainName: string }>()
  if (!tokenAddress) {
    throw new Error('Invalid token details route: token address URL param is undefined')
  }

  const currencyChainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChainInfo.backendChain.chain) : tokenAddress
  const rwaCoinGeckoDataEnabled = useFeatureFlag(FeatureFlags.RWACoinGeckoData)

  // Split query: this lightweight metadata query (no market fields, so no ClickHouse/Aurora) gates
  // the page and powers the header; the heavier market `useTokenWebQuery` below stays non-blocking.
  const tokenProjectQuery = GraphQLApi.useTokenProjectWebQuery({
    variables: {
      address: tokenDBAddress,
      chain: currencyChainInfo.backendChain.chain,
    },
    errorPolicy: 'all',
  })

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
  })
  const currency = useMemo(() => {
    if (isNative) {
      // Tempo has a virtual "USD" native currency placeholder that is not a real token
      // and must not be displayed on the token details page.
      if (currencyChainInfo.id === UniverseChainId.Tempo) {
        return undefined
      }
      return nativeOnChain(currencyChainInfo.id)
    }
    if (tokenProjectQuery.data?.token) {
      return gqlToCurrency(tokenProjectQuery.data.token)
    }
    return undefined
  }, [tokenProjectQuery.data?.token, isNative, currencyChainInfo.id])

  const { multiChainMap, balanceError, balancesRefetch } = useMultiChainMap(tokenProjectQuery)

  // Extract color for page usage
  const colors = useSporeColors()
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const { preloadedLogoSrc } = (useLocation().state as { preloadedLogoSrc?: string }) ?? {}
  const extractedColorSrc = tokenProjectQuery.data?.token?.project?.logoUrl ?? preloadedLogoSrc
  const tokenColor =
    useSrcColor({
      src: extractedColorSrc,
      currencyName: currency?.name,
      backgroundColor: colors.surface2.val,
    }).tokenColor ?? undefined

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
  ])

  return { state, balancesRefetch }
}

/** Returns a map to store addresses and balances of the TDP token on other chains */
function useMultiChainMap(tokenProjectQuery: ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>): {
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
    refetch: balancesRefetch,
  } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    skip: !evmAddress && !svmAddress,
  })

  const multiChainMap = useMemo(() => {
    const tokensAcrossChains = tokenProjectQuery.data?.token?.project?.tokens
    if (!tokensAcrossChains) {
      return {}
    }

    return tokensAcrossChains.reduce<MultiChainMap>((map, current) => {
      if (!map[current.chain]) {
        map[current.chain] = {}
      }
      const update = map[current.chain] ?? {}
      update.address = current.address

      // Find the balance for this token using the balancesById map
      if (balancesById) {
        // Convert GraphQL chain to UniverseChainId and construct currency ID
        const chainId = fromGraphQLChain(current.chain)
        if (chainId) {
          // For native tokens (no address or NATIVE_CHAIN_ID), use the native address
          // For non-native tokens, use the token address
          const currencyId =
            !current.address || isNativeCurrencyAddress(chainId, current.address)
              ? buildNativeCurrencyId(chainId)
              : buildCurrencyId(chainId, current.address)
          update.balance = balancesById[currencyId]
        }
      }

      map[current.chain] = update
      return map
    }, {})
  }, [balancesById, tokenProjectQuery.data?.token?.project?.tokens])

  return { multiChainMap, balanceError, balancesRefetch }
}
