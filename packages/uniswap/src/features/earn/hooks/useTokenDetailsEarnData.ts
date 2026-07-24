import { useMemo } from 'react'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { getProjectedAnnualEarnings } from 'uniswap/src/features/earn/amount'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  selectEarnVaultForToken,
  type TokenProjectTokenForEarn,
} from 'uniswap/src/features/earn/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

export type TokenDetailsEarnData = {
  balanceUsd: number | undefined
  earnPosition: EarnPositionInfo | undefined
  earnVault: EarnVaultInfo | undefined
  hasLoadedPositions: boolean
  /** True when the underlying earn queries failed to load. */
  isError: boolean
  isLoggedIn: boolean
  projectedAnnualEarningsUsd: number | undefined
  /** Refetches the underlying earn queries. */
  refetch: () => void
  /** Gated on a vault existing so a failed vaults lookup doesn't error every token. */
  showEarnError: boolean
  tokenSymbol: string
  userHasEarnPosition: boolean
}

type UseTokenDetailsEarnDataParams = {
  enabled: boolean
  account: Address | undefined
  /** Currency id for the token on the current page chain. */
  activeCurrencyId: string | undefined
  /** Aggregate (cross-chain) balance of the project token for this user. */
  aggregateBalance: PortfolioBalance | undefined
  /** Project tokens used to build the candidate currency id list when matching vaults. */
  tokenProjectTokens: readonly TokenProjectTokenForEarn[] | undefined
  /** Token USD price; used together with aggregateBalance to derive USD balance. */
  tokenPriceUsd: number | undefined
  /** Fallback symbol used when neither the vault nor the aggregate balance has one. */
  tokenSymbolFallback: string | undefined
}

/**
 * Shared TDP earn data hook. Inputs are passed in explicitly so the hook works
 * identically on web (TDP store) and mobile (TokenDetails context + cross-chain
 * balances).
 */
export function useTokenDetailsEarnData({
  enabled,
  account,
  activeCurrencyId,
  aggregateBalance,
  tokenProjectTokens,
  tokenPriceUsd,
  tokenSymbolFallback,
}: UseTokenDetailsEarnDataParams): TokenDetailsEarnData {
  const tokenCurrencyIds = useMemo(() => {
    const ids = new Set(getTokenProjectCurrencyIds(tokenProjectTokens))
    if (activeCurrencyId) {
      ids.add(activeCurrencyId)
    }
    return Array.from(ids)
  }, [activeCurrencyId, tokenProjectTokens])

  const {
    hasLoadedPositions,
    isError,
    positionsByVaultId,
    refetch,
    vaults: earnVaults,
  } = useEarnVaults({
    account,
    enabled: enabled && tokenCurrencyIds.length > 0,
  })

  const earnVault = useMemo(
    () => selectEarnVaultForToken({ tokenCurrencyIds, vaults: earnVaults }),
    [earnVaults, tokenCurrencyIds],
  )
  const earnVaultDisplayCurrencyInfo = useCurrencyInfo(earnVault?.displayCurrencyId)
  const earnPosition = earnVault ? positionsByVaultId.get(earnVault.id) : undefined
  const isLoggedIn = !!account
  const userHasEarnPosition = hasEarnPosition(earnPosition)
  const showEarnError = isError && !!earnVault && !userHasEarnPosition
  const balanceUsd = getTokenBalanceUsd({
    balance: aggregateBalance,
    tokenPriceUsd,
  })
  const projectedAnnualEarningsUsd = earnVault
    ? getProjectedAnnualEarnings({
        balance: balanceUsd ?? 0,
        apyPercent: earnVault.apyPercent,
      })
    : undefined
  const tokenSymbol =
    earnVaultDisplayCurrencyInfo?.currency.symbol ??
    tokenSymbolFallback ??
    aggregateBalance?.currencyInfo.currency.symbol ??
    ''

  return {
    balanceUsd,
    earnPosition,
    earnVault,
    hasLoadedPositions,
    isError,
    isLoggedIn,
    projectedAnnualEarningsUsd,
    refetch,
    showEarnError,
    tokenSymbol,
    userHasEarnPosition,
  }
}
