import { Flex, Skeleton, Text, TouchableArea } from '@universe/mycelium'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, getContrastPassingTextColor, useColorsFromTokenColor } from 'ui/src'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { getAuctionLaunchMethodCopy } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { LaunchMethodExplainerModal } from '~/features/Toucan/Shared/LaunchMethodExplainerModal'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useAuctionCountdown } from '~/pages/TokenDetails/hooks/useAuctionCountdown'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

function getPhaseTitle({ phase, t }: { phase: AuctionDisplayPhase; t: TFunction }): string | undefined {
  switch (phase) {
    case AuctionDisplayPhase.Live:
      return t('tdp.auction.launchInProgress')
    case AuctionDisplayPhase.Upcoming:
      return t('toucan.auction.status.startingSoon')
    case AuctionDisplayPhase.Ended:
      return t('tdp.auction.ended')
    case AuctionDisplayPhase.Unknown:
      return t('tdp.auction.statusUnavailable')
    default:
      return undefined
  }
}

function SkeletonLine({ width, height }: { width: number; height: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex width={width} height={height} borderRadius="$rounded4" backgroundColor="$surface3" />
    </Skeleton>
  )
}

/**
 * Replaces the swap widget before a Custom auction ends while its token has no pool: phase title, launch-method pill,
 * countdown and a link to the auction page. The phase comes from the chain head, never from the clock.
 */
export function TokenDetailsAuctionCard(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const colors = useSporeColors()
  const tokenColor = useTDPStore((state) => state.tokenColor)
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  const accentColor = validTokenColor ?? colors.accent1.val
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const { auction, chainId, launchMethod, phase, phaseEndsAtMs, refetchCurrentBlock } = useTokenDetailsAuctionDisplay()
  const countdown = useAuctionCountdown({ endsAtMs: phaseEndsAtMs, onComplete: refetchCurrentBlock })

  if (!auction || chainId === undefined || launchMethod === undefined) {
    return null
  }

  const auctionUrl = getAuctionDetailsURL({ chainId, auctionAddress: auction.address })
  const { label: methodLabel } = getAuctionLaunchMethodCopy({ method: launchMethod, t })
  const title = getPhaseTitle({ phase, t })
  const countdownText =
    countdown === undefined
      ? undefined
      : phase === AuctionDisplayPhase.Upcoming
        ? countdown
        : t('tdp.auction.timeRemaining', { time: countdown })

  return (
    <Flex
      testID={TestID.TokenDetailsAuctionCard}
      gap="$spacing24"
      p="$spacing16"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      backgroundColor="$surface1"
      style={{
        borderColor: opacifyRaw(8, accentColor),
        backgroundClip: 'padding-box',
        backgroundImage: `linear-gradient(180deg, ${opacifyRaw(0, accentColor)} 0%, ${opacifyRaw(20, accentColor)} 100%)`,
      }}
    >
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
        {title ? (
          <Text variant="body4" color="$neutral2">
            {title}
          </Text>
        ) : (
          <SkeletonLine width={96} height={16} />
        )}
        <TouchableArea
          testID={TestID.TokenDetailsAuctionCardLaunchMethod}
          flexDirection="row"
          alignItems="center"
          pl="$spacing6"
          pr="$spacing8"
          py="$spacing4"
          borderRadius="$roundedFull"
          backgroundColor={opacifyRaw(12, accentColor)}
          onPress={() => setIsExplainerOpen(true)}
        >
          <Text variant="buttonLabel4" color={accentColor}>
            {methodLabel}
          </Text>
        </TouchableArea>
      </Flex>

      {phase === AuctionDisplayPhase.Loading && <SkeletonLine width={200} height={24} />}
      {countdownText && (
        <Flex
          row
          alignItems="center"
          justifyContent={phase === AuctionDisplayPhase.Upcoming ? 'space-between' : 'center'}
          gap="$spacing8"
        >
          {phase === AuctionDisplayPhase.Upcoming ? (
            <>
              <Text variant="subheading1" color="$neutral2">
                {t('toucan.auction.introBanner.auctionStartsIn')}
              </Text>
              <Text variant="subheading1" color="$neutral1">
                {countdownText}
              </Text>
            </>
          ) : (
            <>
              <PulsingIndicatorDot color={accentColor} isPulsing={phase === AuctionDisplayPhase.Live} />
              <Text variant="heading3" color={accentColor}>
                {countdownText}
              </Text>
            </>
          )}
        </Flex>
      )}

      {auctionUrl && (
        <Button
          variant="default"
          emphasis="primary"
          size="medium"
          fill={false}
          width="100%"
          backgroundColor={accentColor}
          testID={TestID.TokenDetailsAuctionCardViewAuction}
          onPress={() => navigate(auctionUrl)}
        >
          <Button.Text color={getContrastPassingTextColor(accentColor)}>{t('tdp.auction.viewAuction')}</Button.Text>
        </Button>
      )}

      <LaunchMethodExplainerModal
        method={launchMethod}
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </Flex>
  )
}
