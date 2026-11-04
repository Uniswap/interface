import { useInfiniteQuery } from '@tanstack/react-query'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { isSVMChain, UniverseChainId, areAddressesEqual, normalizeTokenAddressForCache } from '@universe/chains'
import { useCallback, useMemo, useRef } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import {
  getListTransactionsQueryOptions,
  type ListTransactionsTokenScope,
} from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { parseUniswapTransaction, type PoolTransaction } from '~/data/transactions/poolTransaction'
import { useInfiniteLoadMore } from '~/features/Explore/hooks/useInfiniteLoadMore'

const TRANSACTIONS_PAGE_SIZE = 25

export enum TokenTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
}

type TokenTransaction = PoolTransaction & {
  direction: TokenTransactionType
  /** Which leg was sold, as classified alongside `direction` — consumers must not re-derive it. */
  token0IsBeingSold: boolean
}

type UseTokenTransactionsResult = {
  transactions: TokenTransaction[]
  isLoading: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
  error: Error | null
}

export function useTokenTransactions({
  address,
  chainId,
  filter = [TokenTransactionType.BUY, TokenTransactionType.SELL],
  multichain,
  multichainId,
  multichainAddresses,
}: {
  address: string
  chainId: UniverseChainId
  filter?: TokenTransactionType[]
  multichain?: boolean
  multichainId?: string
  multichainAddresses?: Record<string, string>
}): UseTokenTransactionsResult {
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

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getListTransactionsQueryOptions({
      chainIds: v2ChainIds,
      tokenScope: v2TokenScope,
      // TDP only shows swaps; static filter, so it's safe server-side (no query-key churn).
      eventTypes: [TransactionEventType.SWAP],
      pageSize: TRANSACTIONS_PAGE_SIZE,
    }),
  )

  const transactions = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.transactions)
        .map((tx, index) => parseUniswapTransaction(tx, index))
        .filter((tx): tx is PoolTransaction => tx !== undefined),
    [data?.pages],
  )

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  // The multichain view returns rows from every chain, so the reference token must be matched
  // per-chain.
  const referenceAddressByChain = useMemo(() => {
    const map = new Map<UniverseChainId, string>()
    const addEntry = (entryChainId: UniverseChainId, deploymentAddress: string) => {
      const comparableAddress = toComparableAddress(entryChainId, deploymentAddress)
      if (comparableAddress) {
        map.set(entryChainId, comparableAddress)
      }
    }
    for (const [key, deploymentAddress] of Object.entries(multichainAddresses ?? {})) {
      const addressChainId = Number(key)
      if (isUniverseChainId(addressChainId)) {
        addEntry(addressChainId, deploymentAddress)
      }
    }
    addEntry(chainId, address)
    return map
  }, [address, chainId, multichainAddresses])

  // Re-classification replays the whole accumulated list, so warn once per leg-chain pair, not per row.
  const warnedUnmatchedChainPairsRef = useRef(new Set<string>())

  // Single source of truth for a row's direction — the table renders the same value the filter
  // matched on, so the two can never disagree (mismatches previously left Sell-only filters empty,
  // auto-paginating forever). Rows where neither leg matches the reference (chain missing from the
  // map) are dropped rather than mislabeled.
  const classifyDirection = useCallback(
    ({
      tx,
      token0IsBeingSold,
    }: {
      tx: PoolTransaction
      token0IsBeingSold: boolean
    }): TokenTransactionType | undefined => {
      const soldLeg = token0IsBeingSold ? tx.token0 : tx.token1
      const boughtLeg = token0IsBeingSold ? tx.token1 : tx.token0
      const legMatchesReference = (leg: ParsedToken): boolean => {
        const legChainId = leg.chainId
        const referenceAddress = referenceAddressByChain.get(legChainId)
        const legAddress = toComparableAddress(legChainId, leg.address)
        return (
          Boolean(referenceAddress && legAddress) &&
          areAddressesEqual({
            addressInput1: { address: legAddress, chainId: legChainId },
            addressInput2: { address: referenceAddress, chainId: legChainId },
          })
        )
      }
      if (legMatchesReference(soldLeg)) {
        return TokenTransactionType.SELL
      }
      if (legMatchesReference(boughtLeg)) {
        return TokenTransactionType.BUY
      }
      const chainPairKey = `${soldLeg.chainId}:${boughtLeg.chainId}`
      if (!warnedUnmatchedChainPairsRef.current.has(chainPairKey)) {
        warnedUnmatchedChainPairsRef.current.add(chainPairKey)
        logger.warn(
          'useTokenTransactions',
          'classifyDirection',
          `Dropping transactions with legs on ${soldLeg.chainId}/${boughtLeg.chainId}: neither leg matches the reference token — multichain addresses may under-cover the chains the endpoint returns`,
        )
      }
      return undefined
    },
    [referenceAddressByChain],
  )

  const filterAndClassify = useCallback(
    (txs: readonly PoolTransaction[]): TokenTransaction[] =>
      txs.flatMap((tx) => {
        if (tx.eventType !== TransactionEventType.SWAP) {
          return []
        }
        const token0IsBeingSold = parseFloat(tx.token0Quantity) > 0
        const direction = classifyDirection({ tx, token0IsBeingSold })
        return direction && filter.includes(direction) ? [{ ...tx, direction, token0IsBeingSold }] : []
      }),
    [classifyDirection, filter],
  )

  const filteredTransactions = useMemo(() => {
    // Server-sorted and swap-only already; filterAndClassify applies the client Buy/Sell filter.
    return filterAndClassify(transactions)
  }, [transactions, filterAndClassify])

  return useMemo(
    () => ({
      transactions: filteredTransactions,
      isLoading,
      loadMore,
      error,
    }),
    [isLoading, loadMore, error, filteredTransactions],
  )
}

// Swap legs trade as the wrapped token, so native (sentinel or absent address) compares as wrapped.
// Chains without wrapped-native metadata fall back to the raw address — both sides of a comparison
// go through this helper, so any deterministic mapping still matches.
function toComparableAddress(tokenChainId: UniverseChainId, tokenAddress: string | undefined): string | undefined {
  if (!tokenAddress || isNativeCurrencyAddress(tokenChainId, tokenAddress)) {
    return WRAPPED_NATIVE_CURRENCY[tokenChainId]?.address ?? tokenAddress
  }
  return tokenAddress
}
