import { useInfiniteQuery } from '@tanstack/react-query'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { areAddressesEqual, isSVMChain, UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getListTransactionsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isNativeParsedToken, type ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { parseUniswapTransaction, type PoolTransaction } from '~/data/transactions/poolTransaction'
import {
  getPoolTableTransactionTypeTranslation,
  PoolTableTransaction,
  PoolTableTransactionType,
} from '~/features/Explore/state/transactions/poolTransactionTypes'
import { useInfiniteLoadMore } from '~/hooks/useInfiniteLoadMore'

export { getPoolTableTransactionTypeTranslation, PoolTableTransactionType }
export type { PoolTableTransaction }

const TRANSACTIONS_PAGE_SIZE = 25

/** A native leg arrives with an absent or zero-address `address` (see `ParsedToken`); resolve it to the
 * wrapped-native address so it can be matched against `token0Address`, which uses the same wrapped convention. */
function resolvePoolTransactionLegAddress(token: ParsedToken): string | undefined {
  return isNativeParsedToken(token) ? WRAPPED_NATIVE_CURRENCY[token.chainId]?.address : token.address
}

interface UsePoolTransactionsResult {
  transactions: PoolTableTransaction[]
  loading: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
  error: Error | null
}

export function usePoolTransactions({
  address,
  chainId,
  filter = [
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.REMOVE,
    PoolTableTransactionType.ADD,
  ],
  token0Address,
  isPoolDataLoading = false,
}: {
  address: string
  chainId?: UniverseChainId
  // sortState: PoolTxTableSortState, TODO(WEB-3706): Implement sorting when BE supports
  filter?: PoolTableTransactionType[]
  /** The pool's token0 address (NATIVE_CHAIN_ID sentinel allowed) — used to derive Buy/Sell. */
  token0Address?: string
  /** Whether the pool query that supplies `token0Address` is still in flight. See `isAwaitingPoolToken0`. */
  isPoolDataLoading?: boolean
}): UsePoolTransactionsResult {
  const { defaultChainId } = useEnabledChains()
  const isSolanaChain = chainId && isSVMChain(chainId)

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getListTransactionsQueryOptions({
      chainIds: [chainId ?? defaultChainId],
      tokenScope: { case: 'poolId', value: address },
      pageSize: TRANSACTIONS_PAGE_SIZE,
      enabled: !isSolanaChain,
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

  // Transactions are marked as loading until we have enough info to classify them as Buy/Sell
  const isPoolToken0Resolved = token0Address !== undefined

  // Ensure we don't show infinite loading if the pool data is never coming
  const isAwaitingPoolToken0 = !isPoolToken0Resolved && isPoolDataLoading

  const filteredTransactions = useMemo(() => {
    if (!isPoolToken0Resolved) {
      return []
    }
    const resolvedToken0Address =
      token0Address === NATIVE_CHAIN_ID || token0Address === ZERO_ADDRESS
        ? WRAPPED_NATIVE_CURRENCY[chainId ?? UniverseChainId.Mainnet]?.address
        : token0Address

    return transactions
      .map((tx) => {
        const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
        // tokenIn.address is undefined for a native leg (see ParsedToken), so it needs the
        // same wrapped-native resolution as token0Address above or a native-token0 swap never matches.
        const resolvedTokenInAddress = resolvePoolTransactionLegAddress(tokenIn)
        const isSell = areAddressesEqual({
          addressInput1: { address: resolvedTokenInAddress, chainId: tokenIn.chainId },
          addressInput2: { address: resolvedToken0Address, chainId: chainId ?? UniverseChainId.Mainnet },
        })
        const type =
          tx.eventType === TransactionEventType.SWAP
            ? isSell
              ? PoolTableTransactionType.SELL
              : PoolTableTransactionType.BUY
            : tx.eventType === TransactionEventType.REMOVE
              ? PoolTableTransactionType.REMOVE
              : PoolTableTransactionType.ADD
        if (!filter.includes(type)) {
          return undefined
        }
        return {
          timestamp: tx.timestamp,
          transaction: tx.hash,
          pool: {
            token0: {
              id: resolvePoolTransactionLegAddress(tx.token0) ?? null,
              symbol: tx.token0.symbol ?? '',
            },
            token1: {
              id: resolvePoolTransactionLegAddress(tx.token1) ?? null,
              symbol: tx.token1.symbol ?? '',
            },
          },
          maker: tx.account,
          amount0: parseFloat(tx.token0Quantity),
          amount1: parseFloat(tx.token1Quantity),
          amountUSD: tx.usdValue,
          type,
        }
      })
      .filter((value: PoolTableTransaction | undefined): value is PoolTableTransaction => value !== undefined)
  }, [transactions, token0Address, chainId, filter, isPoolToken0Resolved])

  return useMemo(() => {
    return {
      transactions: filteredTransactions,
      loading: isAwaitingPoolToken0 || isLoading,
      loadMore,
      error,
    }
  }, [filteredTransactions, isAwaitingPoolToken0, error, isLoading, loadMore])
}
