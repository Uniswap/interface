import { ColorTokens } from '@universe/mycelium'
import { ProgressBar } from '~/features/Toucan/Shared/ProgressBar'

interface AuctionProgressBarProps {
  percentage: number
  color?: ColorTokens | (string & {})
}

export function AuctionProgressBar({ percentage, color }: AuctionProgressBarProps) {
  return <ProgressBar percentage={percentage} color={color} showEndDots={true} showWhiteDot={true} />
}
