import { ChainId } from '@uniswap/sdk-core'
import {
  Chain,
  PoolTransactionType,
  useV2TokenTransactionsQuery,
  useV3TokenTransactionsQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCallback, useMemo, useRef } from 'react'

export enum TokenTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
}

const TokenTransactionDefaultQuerySize = 25

export function useTokenTransactions(
  address: string,
  chainId: ChainId,
  filter: TokenTransactionType[] = [TokenTransactionType.BUY, TokenTransactionType.SELL]
) {
  const {
    data: dataV3,
    loading: loadingV3,
    fetchMore: fetchMoreV3,
    error: errorV3,
  } = useV3TokenTransactionsQuery({
    variables: {
      address: address.toLowerCase(),
      chain: chainIdToBackendName(chainId),
      first: TokenTransactionDefaultQuerySize,
    },
  })
  const {
    data: dataV2,
    loading: loadingV2,
    error: errorV2,
    fetchMore: fetchMoreV2,
  } = useV2TokenTransactionsQuery({
    variables: {
      address: address.toLowerCase(),
      first: TokenTransactionDefaultQuerySize,
    },
    skip: chainId !== ChainId.MAINNET,
  })
  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const querySizeRef = useRef(TokenTransactionDefaultQuerySize)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMoreV3.current || (loadingMoreV2.current && chainId === ChainId.MAINNET)) {
        return
      }
      loadingMoreV3.current = true
      loadingMoreV2.current = true
      querySizeRef.current += TokenTransactionDefaultQuerySize
      fetchMoreV3({
        variables: {
          cursor: dataV3?.token?.v3Transactions?.[dataV3.token?.v3Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev
          }
          if (!loadingMoreV2.current || chainId !== ChainId.MAINNET) onComplete?.()
          const mergedData = {
            token: {
              ...prev.token,
              id: prev?.token?.id ?? '',
              chain: prev?.token?.chain ?? Chain.Ethereum,
              v3Transactions: [...(prev.token?.v3Transactions ?? []), ...(fetchMoreResult.token?.v3Transactions ?? [])],
            },
          }
          loadingMoreV3.current = false
          return mergedData
        },
      })
      chainId == ChainId.MAINNET &&
        fetchMoreV2({
          variables: {
            cursor: dataV2?.token?.v2Transactions?.[dataV2.token?.v2Transactions.length - 1]?.timestamp,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev
            if (!loadingMoreV3.current) onComplete?.()
            const mergedData = {
              token: {
                ...prev.token,
                id: prev?.token?.id ?? '',
                chain: prev?.token?.chain ?? Chain.Ethereum,
                v2Transactions: [
                  ...(prev.token?.v2Transactions ?? []),
                  ...(fetchMoreResult.token?.v2Transactions ?? []),
                ],
              },
            }
            loadingMoreV2.current = false
            return mergedData
          },
        })
    },
    [chainId, dataV2?.token?.v2Transactions, dataV3?.token?.v3Transactions, fetchMoreV2, fetchMoreV3]
  )

  const transactions = useMemo(
    () =>
      [
        ...(dataV3?.token?.v3Transactions?.filter((tx) => {
          const tokenBeingSold = parseFloat(tx.token0Quantity) < 0 ? tx.token0 : tx.token1
          const isSell = tokenBeingSold.address?.toLowerCase() === address.toLowerCase()
          return (
            tx.type === PoolTransactionType.Swap &&
            filter.includes(isSell ? TokenTransactionType.SELL : TokenTransactionType.BUY)
          )
        }) ?? []),
        ...(dataV2?.token?.v2Transactions?.filter((tx) => {
          const tokenBeingSold = parseFloat(tx.token0Quantity) < 0 ? tx.token0 : tx.token1
          const isSell = tokenBeingSold.address?.toLowerCase() === address.toLowerCase()
          return (
            tx.type === PoolTransactionType.Swap &&
            filter.includes(isSell ? TokenTransactionType.SELL : TokenTransactionType.BUY)
          )
        }) ?? []),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, querySizeRef.current),
    [address, dataV2?.token?.v2Transactions, dataV3?.token?.v3Transactions, filter]
  )

  return useMemo(() => {
    return {
      transactions,
      loading: loadingV3 || loadingV2,
      loadMore,
      error: errorV2 && errorV3,
    }
  }, [transactions, loadingV3, loadingV2, loadMore, errorV2, errorV3])
}
