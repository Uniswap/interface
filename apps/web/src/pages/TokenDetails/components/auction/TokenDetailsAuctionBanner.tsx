import { Flex, Skeleton, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { opacifyRaw, useSporeColors, useColorsFromTokenColor } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { TokenDetailsMoreAuctionsChip } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListEntry'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useAuctionCountdown } from '~/pages/TokenDetails/hooks/useAuctionCountdown'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'
import {
  shouldReserveAuctionBannerSpace,
  shouldShowAuctionBanner,
} from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import {
  getTokenDetailsProvenanceProperties,
  sendTokenDetailsProvenanceEvent,
} from '~/pages/TokenDetails/utils/tokenDetailsProvenanceAnalytics'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

function AuctionCountdown({
  endsAtMs,
  onComplete,
  color,
  isUpcoming,
}: {
  endsAtMs: number
  onComplete: () => void
  color: string
  isUpcoming: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const countdown = useAuctionCountdown({ endsAtMs, onComplete })

  if (isUpcoming) {
    return (
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="body2" color="$neutral2">
          {t('tdp.auction.startsIn')}
        </Text>
        <Text variant="body2" color="$neutral1">
          {countdown}
        </Text>
      </Flex>
    )
  }

  return (
    <>
      <PulsingIndicatorDot color={color} isPulsing />
      <Text variant="body2" color={color}>
        {countdown}
      </Text>
    </>
  )
}

/**
 * "Upcoming auction ›" / "Auction in progress ›" row above the chart and swap widget while a tradeable Custom
 * auction token's auction has not ended. Links to the Auction Details page.
 */
export function TokenDetailsAuctionBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const colors = useSporeColors()
  const tokenColor = useTDPStore((state) => state.tokenColor)
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  const accentColor = validTokenColor ?? colors.accent1.val
  const display = useTokenDetailsAuctionDisplay()
  // One denominator for every auction event on the page: the selector's CCA population, not the
  // claimable subset, so an impression and the selector-open it leads to can share a funnel.
  const auctionCount = useTokenDetailsCcaAuctions().length
  const { auction, chainId, phaseEndsAtMs, refetchCurrentBlock } = display

  if (!auction || chainId === undefined || !shouldReserveAuctionBannerSpace(display)) {
    return null
  }

  const isPlaceholder = !shouldShowAuctionBanner(display)
  const isUpcoming = display.phase === AuctionDisplayPhase.Upcoming

  const auctionUrl = getAuctionDetailsURL({ chainId, auctionAddress: auction.address })
  if (!auctionUrl) {
    return null
  }

  const onPress = (): void => {
    sendTokenDetailsProvenanceEvent({
      eventName: AuctionEventName.TokenDetailsToAuctionDetailsClicked,
      display,
      entry_point: 'tdp_auction_banner',
      auction_count: auctionCount,
    })
    navigate(auctionUrl)
  }

  const row = (
    <Flex
      testID={TestID.TokenDetailsAuctionBanner}
      aria-busy={isPlaceholder || undefined}
      row
      flexWrap="wrap"
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing16"
      backgroundColor={opacifyRaw(8, accentColor)}
      borderColor={opacifyRaw(8, accentColor)}
      borderWidth="$spacing1"
      borderRadius="$rounded16"
      px="$spacing16"
      py="$spacing12"
    >
      <Flex row alignItems="center" gap="$spacing16" flexWrap="wrap" minWidth={0}>
        <Text variant="body2" color="$neutral1">
          {isUpcoming ? t('tdp.auction.upcoming') : t('tdp.auction.inProgress')}
        </Text>
        {!isPlaceholder && <TokenDetailsMoreAuctionsChip />}
      </Flex>
      <Flex row alignItems="center" gap="$spacing8" ml="auto" flexShrink={0}>
        {phaseEndsAtMs !== undefined && (
          <AuctionCountdown
            endsAtMs={phaseEndsAtMs}
            onComplete={refetchCurrentBlock}
            color={accentColor}
            isUpcoming={isUpcoming}
          />
        )}
        <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
      </Flex>
    </Flex>
  )

  return (
    <Flex width="100%" mt="$spacing24" $xxl={{ px: '$spacing40' }} $lg={{ px: '$padding20' }}>
      {isPlaceholder ? (
        <Skeleton>{row}</Skeleton>
      ) : (
        <Trace
          key={auction.address}
          logImpression
          eventOnTrigger={AuctionEventName.AuctionBannerViewed}
          properties={getTokenDetailsProvenanceProperties(display, {
            entry_point: 'tdp_auction_banner',
            auction_count: auctionCount,
          })}
        >
          <Trace logPress element={ElementName.AuctionTokenDetailsBanner}>
            <TouchableArea onPress={onPress}>{row}</TouchableArea>
          </Trace>
        </Trace>
      )}
    </Flex>
  )
}
