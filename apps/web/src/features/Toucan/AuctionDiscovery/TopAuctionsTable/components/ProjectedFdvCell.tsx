import { Flex } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { Cell } from '~/components/Table/Cell'
import { MouseoverTooltip } from '~/components/Tooltip'
import { CommittedVolumeTooltipContent } from '~/features/Toucan/Auction/Banners/AuctionStatsBanner/CommittedVolumeTooltipContent'
import type { TopAuctionsTableValue } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import {
  type AuctionFdvWarningThresholds,
  getAuctionCancelThresholdDisplay,
  getAuctionCommittedVolumeDisplay,
  isLowEngagementHighFdvAuction,
} from '~/features/Toucan/utils/auctionFdvWarning'

export function ProjectedFdvCell({
  value,
  loading,
  convertFiatAmountFormatted,
  fdvWarningThresholds,
}: {
  value?: TopAuctionsTableValue
  loading: boolean
  convertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted']
  fdvWarningThresholds: AuctionFdvWarningThresholds
}) {
  const auction = value?.auction.auction
  const projectedFdv = value?.projectedFdv
  const fdvFormatted =
    projectedFdv?.usd !== undefined
      ? convertFiatAmountFormatted(projectedFdv.usd, NumberType.FiatTokenStats)
      : projectedFdv?.formattedBidToken
  const committedVolumeUsd = auction?.totalBidVolumeUsd !== undefined ? Number(auction.totalBidVolumeUsd) : undefined
  const isLowEngagement = isLowEngagementHighFdvAuction(
    { committedVolumeUsd, bidCount: undefined, fdvUsd: projectedFdv?.usd },
    fdvWarningThresholds,
  )
  const cancelThresholdDisplay = getAuctionCancelThresholdDisplay(auction, convertFiatAmountFormatted)
  const committedVolumeDisplay = getAuctionCommittedVolumeDisplay(auction, convertFiatAmountFormatted)

  const fdvContent = (
    <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing4">
      <AnimatedNumber
        numericValue={projectedFdv?.usd}
        textVariant="$body2"
        color={isLowEngagement ? '$neutral3' : undefined}
        value={fdvFormatted ?? '-'}
      />
      {isLowEngagement && <InfoCircleFilled color="$neutral3" size="$icon.16" />}
    </Flex>
  )

  return (
    <Cell justifyContent="flex-end" loading={loading}>
      {isLowEngagement ? (
        <MouseoverTooltip
          placement="top"
          text={
            <CommittedVolumeTooltipContent
              total={committedVolumeDisplay}
              required={cancelThresholdDisplay}
              showLowVolumeHighFdv={isLowEngagement}
              minFdv={fdvFormatted}
              isCompleted={value?.auction.timeRemaining.isCompleted ?? false}
            />
          }
        >
          {fdvContent}
        </MouseoverTooltip>
      ) : (
        fdvContent
      )}
    </Cell>
  )
}
