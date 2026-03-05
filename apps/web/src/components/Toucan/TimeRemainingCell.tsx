import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { TableText } from '~/components/Table/styled'
import { useAuctionTimeRemaining } from '~/components/Toucan/Auction/hooks/useAuctionTimeRemaining'

interface TimeRemainingCellProps {
  chainId: EVMUniverseChainId | undefined
  startBlock: number | undefined
  endBlock: number | undefined
}

/**
 * Table cell component that displays auction time remaining with a progress bar.
 * Shows time text above a minimal progress bar.
 * Uses real-time block timestamps and updates every second.
 *
 * @param chainId - The chain ID of the auction
 * @param startBlock - The block number when the auction starts
 * @param endBlock - The block number when the auction ends
 */
export function TimeRemainingCell({ chainId, startBlock, endBlock }: TimeRemainingCellProps) {
  const { t } = useTranslation()
  const timeData = useAuctionTimeRemaining({ chainId, startBlock, endBlock })

  if (timeData.durationString === '—') {
    return <TableText>—</TableText>
  }

  let displayText: string
  if (timeData.isCompleted) {
    displayText = t('toucan.auction.timeRemaining.completed')
  } else if (timeData.isNotStarted && timeData.durationString) {
    displayText = t('toucan.auction.startingIn', {
      duration: timeData.durationString,
    })
  } else {
    displayText = timeData.durationString
  }

  const clampedPercentage = Math.min(100, Math.max(0, timeData.progressPercentage))

  return (
    <Flex gap="$spacing4" width="100%" alignItems="flex-end">
      <TableText>{displayText}</TableText>
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
