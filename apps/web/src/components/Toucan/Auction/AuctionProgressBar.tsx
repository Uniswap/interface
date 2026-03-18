import { ColorTokens } from 'ui/src'
import { ProgressBar } from '~/components/Toucan/Shared/ProgressBar'

interface AuctionProgressBarProps {
  percentage: number
  color?: ColorTokens
}

export function AuctionProgressBar({ percentage, color }: AuctionProgressBarProps) {
  return <ProgressBar percentage={percentage} color={color} showEndDots={true} showWhiteDot={true} />
}
