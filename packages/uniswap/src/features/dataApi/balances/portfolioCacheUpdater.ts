import { type PlainMessage } from '@bufbuild/protobuf'
import { useQueryClient, type Query } from '@tanstack/react-query'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import type { Balance, MultichainBalance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import type { GetPortfolioInput } from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolio'
import { doesGetPortfolioQueryMatchAddress } from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolioQueryUtils'
import {
  doesGetWalletBalancesQueryMatchAddress,
  PortfolioBalancePart,
  useWalletBalancesIncludeCategories,
} from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { createWalletBalancesVisibilityUpdater } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/walletBalancesVisibility'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioCacheUpdater } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { matchesCurrency } from 'uniswap/src/features/dataApi/balances/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

function updateBalanceVisibility({
  balances,
  targetCurrency,
  isHidden,
}: {
  // Typed always-present on PlainMessage, but rehydrated/persisted entries can omit it.
  balances: readonly PlainMessage<Balance>[] | undefined
  targetCurrency: Currency
  isHidden: boolean
}): Pick<PlainMessage<Balance>, 'token' | 'amount' | 'priceUsd' | 'pricePercentChange1d' | 'valueUsd' | 'isHidden'>[] {
  return (balances ?? []).map((balance) => {
    const token = balance.token
    if (!token) {
      return balance
    }

    const matches = matchesCurrency(token, targetCurrency)
    return matches ? { ...balance, isHidden } : balance
  })
}

function updateMultichainBalanceVisibility({
  multichainBalances,
  targetCurrency,
  isHidden,
}: {
  multichainBalances: readonly PlainMessage<MultichainBalance>[] | undefined
  targetCurrency: Currency
  isHidden: boolean
}): PlainMessage<MultichainBalance>[] {
  return (multichainBalances ?? []).map((multichainBalance) => {
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- chainBalances can be undefined at runtime despite protobuf typing
    const chainBalances = multichainBalance.chainBalances ?? []
    if (!chainBalances.some((chainBalance) => matchesCurrency(chainBalance, targetCurrency))) {
      return multichainBalance
    }
    return {
      ...multichainBalance,
      chainBalances: chainBalances.map((chainBalance) =>
        matchesCurrency(chainBalance, targetCurrency) ? { ...chainBalance, isHidden } : chainBalance,
      ),
    }
  })
}

function calculateNewTotalValue({
  currentTotal,
  balanceValue,
  isHiding,
}: {
  currentTotal: number
  balanceValue: number
  isHiding: boolean
}): number {
  return Math.max(0, isHiding ? currentTotal - balanceValue : currentTotal + balanceValue)
}

/**
 * Optimistically mutates the cached `GetPortfolio` responses (per-balance `isHidden` + `totalValueUsd`)
 * across every key variant, and optionally forwards the USD delta to `updateWalletBalancesForDelta` to
 * mutate the `GetWalletBalances` entries covering the token's chain — both caches exclude `modifier`
 * from the key, so hide/unhide does not invalidate them naturally.
 */
export const createPortfolioCacheUpdater =
  (ctx: {
    /** Applies `updater` to the cached `GetPortfolio` entries owned by this wallet that cover `chainId`; entries the updater returns `undefined` for are left untouched. */
    updateData: (args: {
      input: GetPortfolioInput['input']
      chainId: number
      updater: (old?: PlainMessage<GetPortfolioResponse>) => PlainMessage<GetPortfolioResponse> | undefined
    }) => void
    /** Optional — when provided, forwards the USD delta plus the token's chain to the `GetWalletBalances` writer. */
    updateWalletBalancesForDelta?: (args: {
      input: GetPortfolioInput['input']
      deltaUsd: number
      chainId: number
    }) => void
  }) =>
  (input: GetPortfolioInput['input']) => {
    return (updateInput: { hidden: boolean; portfolioBalance?: PortfolioBalance }): void => {
      if (!updateInput.portfolioBalance) {
        return
      }

      const targetCurrency = updateInput.portfolioBalance.currencyInfo.currency
      const balanceValue = updateInput.portfolioBalance.balanceUSD || 0

      ctx.updateData({
        input,
        chainId: targetCurrency.chainId,
        updater: (old) => {
          if (!old?.portfolio) {
            return undefined
          }
          const portfolio = old.portfolio
          return {
            ...old,
            portfolio: {
              ...portfolio,
              // Entries hold the legacy or the multichain shape; the absent one is an empty array.
              balances: updateBalanceVisibility({
                balances: portfolio.balances,
                targetCurrency,
                isHidden: updateInput.hidden,
              }),
              multichainBalances: updateMultichainBalanceVisibility({
                multichainBalances: portfolio.multichainBalances,
                targetCurrency,
                isHidden: updateInput.hidden,
              }),
              totalValueUsd: calculateNewTotalValue({
                currentTotal: portfolio.totalValueUsd || 0,
                balanceValue,
                isHiding: updateInput.hidden,
              }),
            },
          } as PlainMessage<GetPortfolioResponse>
        },
      })

      if (ctx.updateWalletBalancesForDelta) {
        const deltaUsd = updateInput.hidden ? -balanceValue : balanceValue
        ctx.updateWalletBalancesForDelta({
          input,
          deltaUsd,
          chainId: targetCurrency.chainId,
        })
      }
    }
  }

/**
 * Matches the `GetPortfolio` entries owned by this wallet, across key variants (multichain, flags).
 * When `chainId` is given, chain-filtered entries that don't cover it are excluded — their totals
 * don't include the token, so the delta must not be applied. Missing/empty chainIds mean all chains.
 */
function matchesGetPortfolioQueries({
  queryKey,
  evmAddress,
  svmAddress,
  chainId,
}: {
  queryKey: readonly unknown[]
  evmAddress?: string
  svmAddress?: string
  chainId?: number
}): boolean {
  const addressMatches =
    (!!evmAddress && doesGetPortfolioQueryMatchAddress({ queryKey, address: evmAddress, platform: Platform.EVM })) ||
    (!!svmAddress && doesGetPortfolioQueryMatchAddress({ queryKey, address: svmAddress, platform: Platform.SVM }))
  if (!addressMatches) {
    return false
  }
  if (chainId === undefined) {
    return true
  }
  const cachedChainIds = (queryKey[2] as { chainIds?: number[] } | undefined)?.chainIds
  return !cachedChainIds || cachedChainIds.length === 0 || cachedChainIds.includes(chainId)
}

/** Matches the `GetPortfolio` / `GetWalletBalances` entries owned by this wallet, across chain filters and categories. */
function matchesWalletBalanceQueries({
  queryKey,
  evmAddress,
  svmAddress,
}: {
  queryKey: readonly unknown[]
  evmAddress?: string
  svmAddress?: string
}): boolean {
  return (
    matchesGetPortfolioQueries({ queryKey, evmAddress, svmAddress }) ||
    (!!evmAddress &&
      doesGetWalletBalancesQueryMatchAddress({ queryKey, address: evmAddress, platform: Platform.EVM })) ||
    (!!svmAddress && doesGetWalletBalancesQueryMatchAddress({ queryKey, address: svmAddress, platform: Platform.SVM }))
  )
}

export function usePortfolioCacheUpdater(evmAddress?: string, svmAddress?: string): PortfolioCacheUpdater {
  const { chains: chainIds } = useEnabledChains()
  const queryClient = useQueryClient()
  const includeCategories = useWalletBalancesIncludeCategories()

  // TODO(CONS-1074): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  // Memoizes only the factory — `modifier`/`chainIds`/addresses are passed fresh at call time.
  const cacheUpdater = useMemo(() => {
    const writeWalletBalancesDelta = createWalletBalancesVisibilityUpdater(queryClient)
    return createPortfolioCacheUpdater({
      // Broad-scan: cached GetPortfolio keys carry inputs this hook doesn't know (multichain,
      // useSubstreamData, chain filters), so an exact-key write would miss every rendered entry.
      updateData: ({ input, chainId, updater }) => {
        queryClient.setQueriesData<PlainMessage<GetPortfolioResponse>>(
          {
            predicate: (query) =>
              matchesGetPortfolioQueries({
                queryKey: query.queryKey,
                evmAddress: input?.evmAddress,
                svmAddress: input?.svmAddress,
                chainId,
              }),
          },
          updater,
        )
      },
      // Broad-scan: rendered queries can be chain-filtered or category-keyed, which exact-key writes miss.
      updateWalletBalancesForDelta: ({ input, deltaUsd, chainId }) =>
        writeWalletBalancesDelta({
          input: { ...input, includeCategories },
          deltaUsd,
          part: PortfolioBalancePart.Tokens,
          scanChainId: chainId,
        }),
    })
  }, [queryClient, includeCategories])

  const applyVisibilityUpdate = useEvent(async (hidden: boolean, portfolioBalance?: PortfolioBalance) => {
    const predicate = (query: Query): boolean =>
      matchesWalletBalanceQueries({ queryKey: query.queryKey, evmAddress, svmAddress })

    // Cancel all matching in-flight fetches — they carry the pre-toggle modifier. A data-bearing one
    // would clobber the optimistic write; a data-less one (first load, prefetch) would be reused as-is
    // by the reconcile below (query.fetch only cancel-restarts when data !== undefined) and land stale.
    await queryClient.cancelQueries({ predicate })

    cacheUpdater({ evmAddress, svmAddress, chainIds, modifier })({ hidden, portfolioBalance })

    // Neither cache keys on `modifier`, so reconcile with the server explicitly. Deferred a
    // tick so refetches pick up the queryFn built with the updated visibility state.
    setTimeout(() => {
      queryClient.invalidateQueries({ predicate }).catch(onUpdaterError)
    }, 0)
  })

  return useEvent((hidden: boolean, portfolioBalance?: PortfolioBalance) => {
    applyVisibilityUpdate(hidden, portfolioBalance).catch(onUpdaterError)
  })
}

function onUpdaterError(error: unknown): void {
  logger.error(error, { tags: { file: 'portfolioCacheUpdater', function: 'usePortfolioCacheUpdater' } })
}
