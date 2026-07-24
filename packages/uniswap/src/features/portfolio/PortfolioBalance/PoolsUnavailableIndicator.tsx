import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { IconSizeTokens } from 'ui/src/theme'
import { BalanceUnavailableIndicator } from 'uniswap/src/features/portfolio/PortfolioBalance/BalanceUnavailableIndicator'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface PoolsUnavailableIndicatorProps {
  message?: string
  iconSize?: IconSizeTokens
}

export function PoolsUnavailableIndicator({
  message,
  iconSize,
}: PoolsUnavailableIndicatorProps = {}): JSX.Element | null {
  return (
    <BalanceUnavailableIndicator
      categories={[WalletBalanceCategory.POOLS]}
      testID={TestID.PoolsUnavailableIndicator}
      message={message}
      iconSize={iconSize}
    />
  )
}
