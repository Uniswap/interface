import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, Text } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { TableText } from '~/components/Table/shared/TableText'
import { useAuctionTimeRemaining } from '~/features/Toucan/Auction/hooks/useAuctionTimeRemaining'
import { isAuctionFailed } from '~/features/Toucan/Auction/utils/isAuctionFailed'
import { LiquidityLockedBadge } from '~/features/Toucan/Shared/LiquidityLockedBadge'

/** Tabular figures so the live countdown doesn't jitter as digits change. */
const MONOSPACE_NUMERIC_STYLE = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum' 1",
} as const

interface AuctionStatusCellProps {
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
  preBidEndBlockTimestamp?: bigint
  tokenAddress?: string
  chainId?: UniverseChainId
  /** Raw committed volume and launch threshold (same currency units) used to derive the Failed state. */
  totalBidVolume?: string
  requiredCurrencyRaised?: string
  /** QuickLaunch (flag-gated upstream): progress-bar treatment while live, "Live on Uniswap" once completed. */
  isQuickLaunch?: boolean
}

/**
 * Auction status table cell: shows the auction phase (Starting soon / Bidding / Completed / Failed)
 * with the relevant countdown or completion recency underneath. Bidding rows drop the text label and
 * lead with the progress bar, countdown below, to keep the cell compact. For completed (launched)
 * auctions, row hover swaps the status for a quick-swap CTA to reduce clicks to swap.
 */
export function TimeRemainingCell({
  startBlockTimestamp,
  endBlockTimestamp,
  preBidEndBlockTimestamp,
  tokenAddress,
  chainId,
  totalBidVolume,
  requiredCurrencyRaised,
  isQuickLaunch = false,
}: AuctionStatusCellProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { timeString, phase, progressPercentage } = useAuctionTimeRemaining({
    startBlockTimestamp,
    endBlockTimestamp,
    preBidEndBlockTimestamp,
  })

  const canSwap = Boolean(tokenAddress && chainId)

  const handleSwapPress = useEvent((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    // The whole row is a link to the auction page — keep this press from triggering it.
    e.preventDefault()
    e.stopPropagation()
    if (!tokenAddress || !chainId) {
      return
    }
    navigate(getTokenDetailsURL({ address: tokenAddress, chain: toGraphQLChain(chainId) }))
  })

  if (!phase) {
    return <TableText>—</TableText>
  }

  // An ended auction that never met its launch threshold failed — no token launched, so no swap CTA.
  const isFailed = isAuctionFailed({ phase, totalBidVolume, requiredCurrencyRaised })

  // "Live on Uniswap" — not "completed" — is the quick-launch end state: the token keeps trading here.
  const isQuickLaunchLaunched = isQuickLaunch && phase === 'completed' && !isFailed

  const statusLabel = {
    notStarted: t('toucan.auction.status.startingSoon'),
    preBid: t('toucan.auction.status.preBid'),
    live: t('toucan.auction.status.bidding'),
    completed: isFailed
      ? t('toucan.auction.status.failed')
      : isQuickLaunch
        ? t('toucan.auction.status.liveOnUniswap')
        : t('toucan.auction.timeRemaining.completed'),
  }[phase]

  const showSwapOnHover = phase === 'completed' && !isFailed && canSwap

  const statusContent = (
    <Flex
      alignItems="flex-end"
      gap="$spacing2"
      opacity={1}
      $group-hover={showSwapOnHover ? { opacity: 0 } : undefined}
      transition="opacity 0.15s ease"
    >
      {phase === 'live' ? (
        // Bidding rows: no text label — just the progress bar with the countdown underneath.
        <Flex
          width={80}
          height={isQuickLaunch ? '4px' : '6px'}
          mb="$spacing2"
          backgroundColor="$surface3"
          borderRadius="$roundedFull"
          overflow="hidden"
        >
          <Flex
            width={`${Math.min(100, Math.max(0, progressPercentage))}%`}
            height="100%"
            backgroundColor={isQuickLaunch ? '$accent1' : '$neutral2'}
          />
        </Flex>
      ) : (
        <TableText color={isFailed ? '$neutral2' : '$neutral1'}>{statusLabel}</TableText>
      )}
      {isQuickLaunchLaunched ? (
        <LiquidityLockedBadge size="small" />
      ) : (
        <Text
          variant="body4"
          color="$neutral2"
          style={isQuickLaunch && phase === 'live' ? MONOSPACE_NUMERIC_STYLE : undefined}
        >
          {timeString}
        </Text>
      )}
    </Flex>
  )

  if (!showSwapOnHover) {
    return (
      <Flex width="100%" alignItems="flex-end">
        {statusContent}
      </Flex>
    )
  }

  return (
    <Flex width="100%" alignItems="flex-end" justifyContent="center" position="relative">
      {statusContent}
      <Flex
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        justifyContent="center"
        opacity={0}
        pointerEvents="none"
        $group-hover={{ opacity: 1, pointerEvents: 'auto' }}
        transition="opacity 0.15s ease"
      >
        <Trace logPress element={ElementName.AuctionsTableSwapButton}>
          <Button size="xsmall" variant="branded" emphasis="primary" minWidth={80} onPress={handleSwapPress}>
            {t('common.swap')}
          </Button>
        </Trace>
      </Flex>
    </Flex>
  )
}
