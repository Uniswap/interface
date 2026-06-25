import { useQueryClient } from '@tanstack/react-query'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import type { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import type { GetPortfolioInput } from 'uniswap/src/data/rest/getPortfolio'
import {
  PortfolioBalancePart,
  useWalletBalancesIncludeCategories,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { createWalletBalancesVisibilityUpdater } from 'uniswap/src/data/rest/getWalletBalances/walletBalancesVisibility'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioCacheUpdater } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { matchesCurrency } from 'uniswap/src/features/dataApi/balances/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useEvent } from 'utilities/src/react/hooks'

function updateBalanceVisibility({
  balances,
  targetCurrency,
  isHidden,
}: {
  balances: Balance[]
  targetCurrency: Currency
  isHidden: boolean
}): Pick<Balance, 'token' | 'amount' | 'priceUsd' | 'pricePercentChange1d' | 'valueUsd' | 'isHidden'>[] {
  return balances.map((balance) => {
    const token = balance.token
    if (!token) {
      return balance
    }

    const matches = matchesCurrency(token, targetCurrency)
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    return matches ? { ...balance, isHidden } : balance
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
  return isHiding ? currentTotal - balanceValue : currentTotal + balanceValue
}

/**
 * Optimistically mutates the cached `GetPortfolio` response (per-balance `isHidden` + `totalValueUsd`).
 * Optionally forwards the USD delta to `updateWalletBalancesForDelta` to mutate the matching
 * `GetWalletBalances` entry — both caches exclude `modifier` from the key, so hide/unhide does not
 * invalidate them naturally.
 */
export const createPortfolioCacheUpdater =
  (ctx: {
    updateData: (
      input: GetPortfolioInput['input'],
      updater: (old?: GetPortfolioResponse) => GetPortfolioResponse,
    ) => void
    getCurrentData: (input: GetPortfolioInput['input']) => GetPortfolioResponse | undefined
    /** Optional — when provided, mutates the exact `GetWalletBalances` entry for the same input tuple. */
    updateWalletBalancesForDelta?: (args: { input: GetPortfolioInput['input']; deltaUsd: number }) => void
  }) =>
  (input: GetPortfolioInput['input']) => {
    return (updateInput: { hidden: boolean; portfolioBalance?: PortfolioBalance }): void => {
      if (!updateInput.portfolioBalance) {
        return
      }

      const currentData = ctx.getCurrentData(input)

      if (!currentData?.portfolio?.balances) {
        return
      }

      const updatedBalances = updateBalanceVisibility({
        balances: currentData.portfolio.balances,
        targetCurrency: updateInput.portfolioBalance.currencyInfo.currency,
        isHidden: updateInput.hidden,
      })

      const balanceValue = updateInput.portfolioBalance.balanceUSD || 0
      const newTotal = calculateNewTotalValue({
        currentTotal: currentData.portfolio.totalValueUsd || 0,
        balanceValue,
        isHiding: updateInput.hidden,
      })

      ctx.updateData(
        input,
        (old) =>
          ({
            // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
            ...(old || currentData),
            portfolio: {
              // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
              ...currentData.portfolio,
              balances: updatedBalances,
              totalValueUsd: newTotal,
            },
          }) as GetPortfolioResponse,
      )

      if (ctx.updateWalletBalancesForDelta) {
        const deltaUsd = updateInput.hidden ? -balanceValue : balanceValue
        ctx.updateWalletBalancesForDelta({ input, deltaUsd })
      }
    }
  }

export function usePortfolioCacheUpdater(evmAddress?: string, svmAddress?: string): PortfolioCacheUpdater {
  const { chains: chainIds } = useEnabledChains()
  const queryClient = useQueryClient()
  const includeCategories = useWalletBalancesIncludeCategories()

  // TODO(CONS-1074): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const cacheUpdater = useMemo(() => {
    const writeWalletBalancesDelta = createWalletBalancesVisibilityUpdater(queryClient)
    return createPortfolioCacheUpdater({
      getCurrentData: (input) => queryClient.getQueryData(getPortfolioQuery({ input }).queryKey),
      updateData: (input, dataUpdater) => {
        queryClient.setQueryData(getPortfolioQuery({ input }).queryKey, dataUpdater)
      },
      // The wallet-balances entry the header reads is keyed by `includeCategories`, so the optimistic
      // token-side delta must carry the same categories to hit it (rather than the tokens-only key).
      updateWalletBalancesForDelta: ({ input, deltaUsd }) =>
        writeWalletBalancesDelta({
          input: { ...input, includeCategories },
          deltaUsd,
          part: PortfolioBalancePart.Tokens,
        }),
    })
  }, [queryClient, includeCategories])

  return useEvent((hidden: boolean, portfolioBalance?: PortfolioBalance) =>
    cacheUpdater({ evmAddress, svmAddress, chainIds, modifier })({ hidden, portfolioBalance }),
  )
}
