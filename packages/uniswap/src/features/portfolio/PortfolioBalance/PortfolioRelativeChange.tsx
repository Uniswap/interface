import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Shine } from 'ui/src'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'

interface PortfolioRelativeChangeProps {
  isLoading: boolean
  isWarmLoading: boolean
  hasError: boolean
  percentChange?: number
  absoluteChange?: number
}

export function PortfolioRelativeChange({
  isLoading,
  isWarmLoading,
  hasError,
  percentChange,
  absoluteChange,
}: PortfolioRelativeChangeProps): JSX.Element {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  return (
    <Shine disabled={!isWarmLoading}>
      <RelativeChange
        absoluteChange={absoluteChange}
        arrowSize="$icon.16"
        change={percentChange}
        loading={isLoading}
        negativeChangeColor={isWarmLoading || hasError ? '$neutral2' : '$statusCritical'}
        positiveChangeColor={isWarmLoading || hasError ? '$neutral2' : '$statusSuccess'}
        shouldAnimate={isDataLivelinessEnabled}
        variant="body3"
      />
    </Shine>
  )
}
