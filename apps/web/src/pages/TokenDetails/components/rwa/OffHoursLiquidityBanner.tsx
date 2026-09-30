import { TestID } from '@universe/test'
import { OffHoursWarningCard } from 'uniswap/src/features/rwa/OffHoursWarningCard'
import { useIsEquityOffHours } from 'uniswap/src/features/rwa/useIsEquityOffHours'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

export function OffHoursLiquidityBanner(): JSX.Element | null {
  const rwaMatch = useTDPRWAMatch()
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
