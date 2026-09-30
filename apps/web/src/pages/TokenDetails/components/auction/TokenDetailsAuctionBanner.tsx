import { Flex, Skeleton, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { useAuctionCountdown } from '~/pages/TokenDetails/hooks/useAuctionCountdown'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { shouldReserveLiveAuctionBannerSpace } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

function AuctionCountdown({ endsAtMs, onComplete }: { endsAtMs: number; onComplete: () => void }): JSX.Element {
  const colors = useSporeColors()
  const countdown = useAuctionCountdown({ endsAtMs, onComplete })

  return (
    <>
      <PulsingIndicatorDot color={colors.accent1.val} isPulsing />
      <Text variant="body2" color="$accent1">
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
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing12"
      backgroundColor="$accent2"
      borderRadius="$rounded12"
      px="$spacing16"
      py="$spacing12"
    >
      <Text variant="body2" color="$neutral1">
        {t('tdp.auction.inProgress')}
      </Text>
      <Flex row alignItems="center" gap="$spacing8">
        {phaseEndsAtMs !== undefined && <AuctionCountdown endsAtMs={phaseEndsAtMs} onComplete={refetchCurrentBlock} />}
        <RotatableChevron direction="right" size="$icon.16" color="$neutral2" />
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
