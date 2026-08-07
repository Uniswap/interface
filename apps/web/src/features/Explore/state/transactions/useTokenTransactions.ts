import { useInfiniteQuery } from '@tanstack/react-query'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useRef } from 'react'
import {
  getListTransactionsQueryOptions,
  type ListTransactionsTokenScope,
} from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import i18n from 'uniswap/src/i18n'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { connectErrorToApolloError, uniswapTransactionToPoolTx } from '~/appGraphql/data/v2/uniswapTransactionAdapters'
import { useInfiniteLoadMore } from '~/features/Explore/state/hooks/useInfiniteLoadMore'

export enum TokenTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
}

export const getTokenTransactionTypeTranslation = (type: TokenTransactionType): string => {
  switch (type) {
    case TokenTransactionType.BUY:
      return i18n.t('common.buy.label')
    case TokenTransactionType.SELL:
      return i18n.t('common.sell.label')
    default:
      return ''
  }
}

const TokenTransactionDefaultQuerySize = 25

export function useTokenTransactions({
  address,
  chainId,
  filter = [TokenTransactionType.BUY, TokenTransactionType.SELL],
  multichain,
  multichainId,
}: {
  address: string
  chainId: UniverseChainId
  filter?: TokenTransactionType[]
  multichain?: boolean
  /** Multichain identity for the multichain view (v2 only — BE resolves every chain + native/wrapped; legacy GQL resolves multichain server-side). */
  multichainId?: string
}) {
  const skipV3V4Solana = isSVMChain(chainId) // Solana token txs data are surfaced via Gql Token.V2Transactions
  const v2Enabled = useFeatureFlag(FeatureFlags.V2EndpointsTransactions) && !isSVMChain(chainId)

  const { chains: enabledChains } = useEnabledChains()

  // Multichain view scopes by the token's multichain id and lets the BE resolve every chain +
  // native/wrapped; single-chain view scopes by that one chain + address.
  const useMultichainScope = Boolean(multichain && multichainId)
  const v2ChainIds = useMemo(
    () => (useMultichainScope ? enabledChains.filter((chain) => !isSVMChain(chain)) : [chainId]),
    [useMultichainScope, enabledChains, chainId],
  )
  const v2TokenScope: ListTransactionsTokenScope = useMultichainScope
    ? { case: 'multichainId', value: multichainId ?? '' }
    : { case: 'tokensOnChain', value: { tokens: [{ chainId, address: normalizeTokenAddressForCache(address) }] } }

  const {
    data: v2Data,
    isLoading: v2Loading,
    error: v2Error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getListTransactionsQueryOptions({
      chainIds: v2ChainIds,
      tokenScope: v2TokenScope,
      // TDP only shows swaps; static filter, so it's safe server-side (no query-key churn).
      eventTypes: [TransactionEventType.SWAP],
      pageSize: TokenTransactionDefaultQuerySize,
      enabled: v2Enabled,
    }),
  )

  const v2Transactions = useMemo(
    () =>
      (v2Data?.pages ?? [])
        .flatMap((page) => page.transactions)
        .map((tx, index) => uniswapTransactionToPoolTx(tx, index))
        .filter((tx): tx is GraphQLApi.PoolTxFragment => tx !== undefined),
    [v2Data?.pages],
  )

  const v2LoadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: v2Transactions.length,
  })

  const {
    data: dataV4,
    loading: loadingV4,
    fetchMore: fetchMoreV4,
    error: errorV4,
  } = GraphQLApi.useV4TokenTransactionsQuery({
    variables: {
      address: normalizeTokenAddressForCache(address),
      chain: toGraphQLChain(chainId),
      first: TokenTransactionDefaultQuerySize,
      multichain,
    },
    skip: skipV3V4Solana || v2Enabled,
  })
  const {
    data: dataV3,
    loading: loadingV3,
    fetchMore: fetchMoreV3,
    error: errorV3,
  } = GraphQLApi.useV3TokenTransactionsQuery({
    variables: {
      address: normalizeTokenAddressForCache(address),
      chain: toGraphQLChain(chainId),
      first: TokenTransactionDefaultQuerySize,
      multichain,
    },
    skip: skipV3V4Solana || v2Enabled,
  })
  const {
    data: dataV2,
    loading: loadingV2,
    error: errorV2,
    fetchMore: fetchMoreV2,
  } = GraphQLApi.useV2TokenTransactionsQuery({
    variables: {
      address: normalizeTokenAddressForCache(address),
      first: TokenTransactionDefaultQuerySize,
      chain: toGraphQLChain(chainId),
      multichain,
    },
    skip: v2Enabled,
  })
  const loadingMoreV4 = useRef(false)
  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const querySizeRef = useRef(TokenTransactionDefaultQuerySize)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMoreV4.current || loadingMoreV3.current || loadingMoreV2.current) {
        return
      }
      loadingMoreV4.current = true
      loadingMoreV3.current = true
      loadingMoreV2.current = true
      querySizeRef.current += TokenTransactionDefaultQuerySize
      fetchMoreV4({
        variables: {
          cursor: dataV4?.token?.v4Transactions?.[dataV4.token.v4Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!loadingMoreV3.current && !loadingMoreV2.current) {
            onComplete?.()
          }
          const mergedData = {
            token: {
              ...prev.token,
              id: prev.token?.id ?? '',
              chain: prev.token?.chain ?? GraphQLApi.Chain.Ethereum,
              v4Transactions: [...(prev.token?.v4Transactions ?? []), ...(fetchMoreResult.token?.v4Transactions ?? [])],
            },
          }
          loadingMoreV4.current = false
          return mergedData
        },
      })
      fetchMoreV3({
        variables: {
          cursor: dataV3?.token?.v3Transactions?.[dataV3.token.v3Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!loadingMoreV2.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            token: {
              ...prev.token,
              id: prev.token?.id ?? '',
              chain: prev.token?.chain ?? GraphQLApi.Chain.Ethereum,
              v3Transactions: [...(prev.token?.v3Transactions ?? []), ...(fetchMoreResult.token?.v3Transactions ?? [])],
            },
          }
          loadingMoreV3.current = false
          return mergedData
        },
      })
      fetchMoreV2({
        variables: {
          cursor: dataV2?.token?.v2Transactions?.[dataV2.token.v2Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!loadingMoreV3.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            token: {
              ...prev.token,
              id: prev.token?.id ?? '',
              chain: prev.token?.chain ?? GraphQLApi.Chain.Ethereum,
              v2Transactions: [...(prev.token?.v2Transactions ?? []), ...(fetchMoreResult.token?.v2Transactions ?? [])],
            },
          }
          loadingMoreV2.current = false
          return mergedData
        },
      })
    },
    [
      dataV2?.token?.v2Transactions,
      dataV3?.token?.v3Transactions,
      dataV4?.token?.v4Transactions,
      fetchMoreV2,
      fetchMoreV3,
      fetchMoreV4,
    ],
  )

  const filterTransaction = useCallback(
    (tx: GraphQLApi.PoolTxFragment | undefined) => {
      if (!tx) {
        return false
      }
      const tokenBeingSold = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
      const isSell = areAddressesEqual({
        addressInput1: {
          address: tokenBeingSold.address,
          chainId: fromGraphQLChain(tokenBeingSold.chain) ?? chainId,
        },
        addressInput2: { address, chainId },
      })
      return (
        tx.type === GraphQLApi.PoolTransactionType.Swap &&
        filter.includes(isSell ? TokenTransactionType.SELL : TokenTransactionType.BUY)
      )
    },
    [address, chainId, filter],
  )

  const transactions = useMemo(() => {
    if (v2Enabled) {
      // Server-sorted and swap-only already; filterTransaction applies the client Buy/Sell filter.
      return v2Transactions.filter(filterTransaction)
    }
    return [
      ...(dataV4?.token?.v4Transactions ?? []),
      ...(dataV3?.token?.v3Transactions ?? []),
      ...(dataV2?.token?.v2Transactions ?? []),
    ]
      .filter(filterTransaction)
      .sort((a, b): number => (a?.timestamp && b?.timestamp ? b.timestamp - a.timestamp : 1))
      .slice(0, querySizeRef.current)
  }, [
    v2Enabled,
    v2Transactions,
    dataV2?.token?.v2Transactions,
    dataV3?.token?.v3Transactions,
    dataV4?.token?.v4Transactions,
    filterTransaction,
  ])

  // The table's full-error state keys off all three version errors; surface the single v2 error as all of them.
  // Memoized so a persistent v2 error doesn't mint a new ApolloError each render and churn the returned object.
  const wrappedV2Error = useMemo(() => connectErrorToApolloError(v2Error), [v2Error])

  return useMemo(
    () => ({
      transactions: transactions as GraphQLApi.PoolTransaction[],
      loading: v2Enabled ? v2Loading : loadingV4 || loadingV3 || loadingV2,
      loadMore: v2Enabled ? v2LoadMore : loadMore,
      errorV2: v2Enabled ? wrappedV2Error : errorV2,
      errorV3: v2Enabled ? wrappedV2Error : errorV3,
      errorV4: v2Enabled ? wrappedV2Error : errorV4,
    }),
    [
      transactions,
      loadingV4,
      loadingV3,
      loadingV2,
      loadMore,
      errorV2,
      errorV3,
      errorV4,
      v2Enabled,
      v2Loading,
      v2LoadMore,
      wrappedV2Error,
    ],
  )
}
