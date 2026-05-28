import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { LegacyTokenBalances } from 'src/components/TokenDetails/LegacyTokenBalances'
import { MultichainTokenBalances } from 'src/components/TokenDetails/MultichainTokenBalances'
import type { DataApiOutageProps } from 'uniswap/src/features/dataApi/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export function TokenBalances({
  currentChainBalance,
  otherChainBalances,
  isOutage,
  dataUpdatedAt,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} & DataApiOutageProps): JSX.Element | null {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  const hasCurrentChainBalances = Boolean(currentChainBalance)
  const hasOtherChainBalances = Boolean(otherChainBalances && otherChainBalances.length > 0)

  if (!hasCurrentChainBalances && !hasOtherChainBalances) {
    return null
  }

  if (multichainTokenUxEnabled) {
    return (
      <MultichainTokenBalances
        currentChainBalance={currentChainBalance}
        otherChainBalances={otherChainBalances}
        isOutage={isOutage}
        dataUpdatedAt={dataUpdatedAt}
      />
    )
  }

  return (
    <LegacyTokenBalances
      currentChainBalance={currentChainBalance}
      otherChainBalances={otherChainBalances}
      isOutage={isOutage}
      dataUpdatedAt={dataUpdatedAt}
    />
  )
}
