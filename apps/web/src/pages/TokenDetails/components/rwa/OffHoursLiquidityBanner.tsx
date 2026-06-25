import { OffHoursWarningCard } from 'uniswap/src/features/rwa/OffHoursWarningCard'
import { useIsEquityOffHours } from 'uniswap/src/features/rwa/useIsEquityOffHours'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'

export function OffHoursLiquidityBanner(): JSX.Element | null {
  const rwaMatch = useRWATokenDetailsMatch()
  const isOffHours = useIsEquityOffHours()

  if (!rwaMatch || !isOffHours) {
    return null
  }

  return (
    <OffHoursWarningCard
      assetName={rwaMatch.asset.name}
      descriptionMaxWidth={600}
      descriptionTestId={TestID.TokenDetailsRWAOffHoursBanner}
    />
  )
}
