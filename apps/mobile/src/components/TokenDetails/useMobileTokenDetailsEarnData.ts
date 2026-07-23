import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenDetailsCrossChainBalances } from 'src/components/TokenDetails/useTokenDetailsCrossChainBalances'
import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import {
  useTokenDetailsEarnData,
  type TokenDetailsEarnData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function useMobileTokenDetailsEarnData(): {
  enabled: boolean
  activeAddress: Address | undefined
  earnData: TokenDetailsEarnData
} {
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const enabled = isEarnEnabled && !isTestnetModeEnabled

  const { currencyId } = useTokenDetailsContext()
  const activeAddress = useActiveAccountAddress() ?? undefined

  const { crossChainTokens, currentChainBalance, otherChainBalances } = useTokenDetailsCrossChainBalances({
    evmAddress: activeAddress,
  })

  const aggregateBalance = useMemo(() => {
    const balances = [currentChainBalance, ...(otherChainBalances ?? [])].filter(
      (balance): balance is NonNullable<typeof balance> => !!balance,
    )
    return computeAggregateBalance(balances)
  }, [currentChainBalance, otherChainBalances])

  const earnData = useTokenDetailsEarnData({
    enabled,
    account: activeAddress,
    activeCurrencyId: currencyId,
    aggregateBalance,
    tokenProjectTokens: crossChainTokens,
    // Mobile relies on PortfolioBalance.balanceUSD from useCrossChainBalances, which is
    // already populated. No separate price source is plumbed through the mobile TDP query.
    tokenPriceUsd: undefined,
    tokenSymbolFallback: undefined,
  })

  return { enabled, activeAddress, earnData }
}
