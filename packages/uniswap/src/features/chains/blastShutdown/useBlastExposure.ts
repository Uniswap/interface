import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { BLAST_BALANCE_USD_THRESHOLD } from 'uniswap/src/features/chains/blastShutdown/constants'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'

export type BlastExposure = {
  /**
   * Non-spam Blast balances add up to at least BLAST_BALANCE_USD_THRESHOLD. False if the portfolio query errored, so an
   * outage doesn't warn every wallet.
   */
  hasBalance: boolean
  /** Any open LP position on Blast that isn't hidden as spam. */
  hasPositions: boolean
  /** The positions query failed, so `hasPositions` can't rule positions out. */
  positionsUnknown: boolean
  /** True until both queries have real data for the active wallet. Errored queries count as settled. */
  isLoading: boolean
}

/** No exposure once `disable_blast` is on: Blast is gone from the app, so there's nothing left to warn about. */
export function useBlastExposure(): BlastExposure {
  const { evmAddress, svmAddress } = useActiveAddresses()
  const isBlastDisabled = useFeatureFlag(FeatureFlags.DisableBlast)

  // Same addresses and no chainIds filter, so this shares the cache entry with every other portfolio consumer.
  const balances = usePortfolioBalances({ evmAddress, svmAddress })
  const walletPositions = useWalletPositions({
    account: evmAddress ?? '',
    chainIds: [UniverseChainId.Blast],
    autoFetchAllPages: false,
    disabled: !evmAddress || isBlastDisabled,
  })

  const blastBalanceUSD = useMemo(
    () =>
      Object.values(balances.data ?? {}).reduce(
        (sum, balance) =>
          balance.currencyInfo.currency.chainId === UniverseChainId.Blast && !balance.currencyInfo.isSpam
            ? sum + (balance.balanceUSD ?? 0)
            : sum,
        0,
      ),
    [balances.data],
  )

  if (!evmAddress || isBlastDisabled) {
    return { hasBalance: false, hasPositions: false, positionsUnknown: false, isLoading: false }
  }

  // Placeholder data is the previous wallet's portfolio, so it can't answer for this one.
  const balancesLoading = !balances.isError && (balances.isPending || Boolean(balances.isPlaceholderData))
  const positionsLoading = !walletPositions.error && (walletPositions.isLoading || walletPositions.isPlaceholderData)

  return {
    hasBalance: !balancesLoading && blastBalanceUSD >= BLAST_BALANCE_USD_THRESHOLD,
    hasPositions: !positionsLoading && walletPositions.positions.length > 0,
    positionsUnknown: Boolean(walletPositions.error),
    isLoading: balancesLoading || positionsLoading,
  }
}
