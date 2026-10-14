import { Flex, Skeleton, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useColorsFromTokenColor } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { TokenDetailsMoreAuctionsChip } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListEntry'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useAuctionCountdown } from '~/pages/TokenDetails/hooks/useAuctionCountdown'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { shouldReserveLiveAuctionBannerSpace } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

function AuctionCountdown({
  endsAtMs,
  onComplete,
  color,
}: {
  endsAtMs: number
  onComplete: () => void
  color: string
}): JSX.Element {
  const countdown = useAuctionCountdown({ endsAtMs, onComplete })

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
 * "Auction in progress ›" row above the chart and swap widget while a tradeable Custom auction token's
 * auction is still live. Links to the Auction Details page.
 */
export function TokenDetailsAuctionBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const colors = useSporeColors()
  const tokenColor = useTDPStore((state) => state.tokenColor)
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  const accentColor = validTokenColor ?? colors.accent1.val
  const display = useTokenDetailsAuctionDisplay()
  const { auction, chainId, isInitialLoading, phaseEndsAtMs, refetchCurrentBlock } = display

  if (!auction || chainId === undefined || !shouldReserveLiveAuctionBannerSpace(display)) {
    return null
  }

  const auctionUrl = getAuctionDetailsURL({ chainId, auctionAddress: auction.address })
  if (!auctionUrl) {
    return null
  }

  const row = (
    <Flex
      testID={TestID.TokenDetailsAuctionBanner}
      aria-busy={isInitialLoading || undefined}
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
          {t('tdp.auction.inProgress')}
        </Text>
        {!isInitialLoading && <TokenDetailsMoreAuctionsChip />}
      </Flex>
      <Flex row alignItems="center" gap="$spacing8" ml="auto" flexShrink={0}>
        {phaseEndsAtMs !== undefined && (
          <AuctionCountdown endsAtMs={phaseEndsAtMs} onComplete={refetchCurrentBlock} color={accentColor} />
        )}
        <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
      </Flex>
    </Flex>
  )

  return (
    <Flex width="100%" mt="$spacing24" $xxl={{ px: '$spacing40' }} $lg={{ px: '$padding20' }}>
      {isInitialLoading ? (
        <Skeleton>{row}</Skeleton>
      ) : (
        <Trace logPress element={ElementName.AuctionTokenDetailsBanner}>
          <TouchableArea onPress={() => navigate(auctionUrl)}>{row}</TouchableArea>
        </Trace>
      )}
    </Flex>
  )
}
