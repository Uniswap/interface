import { Flex } from 'ui/src'
import { TableText } from '~/components/Table/styled'
import { useAuctionTimeRemaining } from '~/components/Toucan/Auction/hooks/useAuctionTimeRemaining'

interface TimeRemainingCellProps {
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
}

/**
 * Table cell component that displays auction time remaining with a progress bar.
 * Shows time text above a minimal progress bar.
 * Uses real-time block timestamps and updates every second.
 */
export function TimeRemainingCell({ startBlockTimestamp, endBlockTimestamp }: TimeRemainingCellProps) {
  const { durationString, progressPercentage } = useAuctionTimeRemaining({ startBlockTimestamp, endBlockTimestamp })

  if (!durationString) {
    return <TableText>—</TableText>
  }

  const clampedPercentage = Math.min(100, Math.max(0, progressPercentage))

  return (
    <Flex gap="$spacing4" width="100%" alignItems="flex-end">
      <TableText>{durationString}</TableText>
      <Flex
        maxWidth="80px"
        width="100%"
        height="6px"
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        overflow="hidden"
      >
        <Flex width={`${clampedPercentage}%`} height="100%" backgroundColor="$neutral2" />
      </Flex>
    </Flex>
  )
}
