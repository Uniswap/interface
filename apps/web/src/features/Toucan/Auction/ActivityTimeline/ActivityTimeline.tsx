import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { AnglesMaximize } from 'ui/src/components/icons/AnglesMaximize'
import { AnglesMinimize } from 'ui/src/components/icons/AnglesMinimize'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'
import { FORMAT_DATE_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import {
  getActiveEventIndex,
  TimelineEvent,
  type TimelineEventStrings,
  TimelineEventType,
  useTimelineEvents,
} from '~/features/Toucan/Auction/ActivityTimeline/useTimelineEvents'
import { useAuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore, useIsAuctionFailed } from '~/features/Toucan/Auction/store/useAuctionStore'
import { formatTokenAmountWithSymbol } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { isTradingRestrictedUntilTge } from '~/features/Toucan/Config/config'
import { createDottedBackgroundStyles } from '~/utils/createDottedBackgroundStyles'

const TRACK_WIDTH = 20
const DOT_SIZE = 8
const ACTIVE_DOT_SIZE = 14

const TimelineCard = styled(TouchableArea, {
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  px: '$spacing16',
  py: '$spacing12',
  gap: '$spacing4',
  flex: 1,
  overflow: 'hidden',
})

function ActiveCardBackground({ tokenColor }: { tokenColor: string }) {
  const { dottedBackgroundStyle } = createDottedBackgroundStyles({ dotColor: tokenColor, dotOpacity: 15 })

  return (
    <>
      <Flex position="absolute" top={0} left={0} right={0} bottom={0} style={dottedBackgroundStyle} />
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{ background: `linear-gradient(to right, ${tokenColor}33 0%, transparent 60%)` }}
      />
    </>
  )
}

/**
 * A single timeline row. The dot is vertically centered to the card
 * by using a two-column layout: the left track column stretches to match
 * the card height, with the dot absolutely centered within it.
 */
function TimelineItem({
  event,
  isActive,
  isPast,
  isFirst,
  isLast,
  lineColor,
  tokenColor,
  localizedDayjs,
}: {
  event: TimelineEvent
  isActive: boolean
  isPast: boolean
  isFirst: boolean
  isLast: boolean
  lineColor: string
  tokenColor: string
  localizedDayjs: ReturnType<typeof useLocalizedDayjs>
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const timeLabel = localizedDayjs(event.time).format(FORMAT_DATE_TIME_SHORT)
  const dotSize = isActive ? ACTIVE_DOT_SIZE : DOT_SIZE

  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), [])

  return (
    <Flex row gap="$spacing12">
      {/* Left track column — stretches to card height, dot centered */}
      <Flex width={TRACK_WIDTH} alignItems="center" position="relative">
        {/* Top line segment */}
        {!isFirst && (
          <Flex
            width={1}
            flex={1}
            style={{
              background: isActive
                ? `linear-gradient(to bottom, ${lineColor}, ${tokenColor})`
                : `linear-gradient(to bottom, ${lineColor}, ${lineColor})`,
            }}
          />
        )}
        {/* Spacer to push dot to center when first item */}
        {isFirst && <Flex flex={1} />}

        {/* 8px gap between line and dot */}
        <Flex height="$spacing8" flexShrink={0} />

        {/* Dot */}
        <Flex
          width={dotSize}
          height={dotSize}
          borderRadius="$roundedFull"
          backgroundColor={isActive ? undefined : '$neutral3'}
          flexShrink={0}
          style={isActive ? { backgroundColor: tokenColor, boxShadow: `0 0 10px 3px ${tokenColor}` } : undefined}
        />

        {/* 8px gap between dot and line */}
        <Flex height="$spacing8" flexShrink={0} />

        {/* Bottom line segment */}
        {!isLast && (
          <Flex
            width={1}
            flex={1}
            style={{
              background: isActive
                ? `linear-gradient(to bottom, ${tokenColor}, ${lineColor})`
                : `linear-gradient(to bottom, ${lineColor}, ${lineColor})`,
            }}
          />
        )}
        {/* Spacer when last item */}
        {isLast && <Flex flex={1} />}
      </Flex>

      {/* Card */}
      <Flex py="$spacing6" flex={1}>
        <TimelineCard onPress={toggleExpanded} hoverStyle={{ borderColor: '$surface3Hovered' }}>
          {/* Active background: dot pattern + radial gradient overlay */}
          {isActive && <ActiveCardBackground tokenColor={tokenColor} />}
          <Flex row justifyContent="space-between" alignItems="center">
            <Flex gap="$spacing4" flex={1}>
              <Text variant="body4" color="$neutral2">
                {timeLabel}
              </Text>
              <Flex row alignItems="center" gap="$spacing8">
                <Text variant="buttonLabel3" color={isPast && !isActive ? '$neutral2' : '$neutral1'}>
                  {event.label}
                </Text>
                {event.badge ? (
                  <Flex backgroundColor="$surface3" px="$spacing6" py="$spacing2" borderRadius="$rounded6">
                    <Text variant="body4" color="$neutral2">
                      {event.badge}
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            </Flex>
            {isExpanded ? (
              <AnglesMinimize color="$neutral3" size="$icon.16" />
            ) : (
              <AnglesMaximize color="$neutral3" size="$icon.16" />
            )}
          </Flex>
          <HeightAnimator open={isExpanded} animation="fast">
            <Text variant="body4" color="$neutral1" mt="$spacing4" pb="$spacing2">
              {isPast || isActive ? event.description : event.futureDescription}
            </Text>
          </HeightAnimator>
        </TimelineCard>
      </Flex>
    </Flex>
  )
}

export function ActivityTimeline() {
  const { t } = useTranslation()
  const { auctionDetails, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const isAuctionFailed = useIsAuctionFailed()

  const surface3 = useColorHexFromThemeKey('surface3')
  const { effectiveTokenColor } = useAuctionTokenColor()
  const dayjs = useLocalizedDayjs()

  const { auctionHasPresale, allowlistEndBlock } = useAuctionKycStatus({
    auctionAddress: auctionDetails?.address,
    chainId: auctionDetails?.chainId,
    currentBlockNumber,
  })

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  // Currency amount the auction needed to raise in order to graduate (e.g. "3.333M USDC").
  const requiredAmountFormatted = useMemo(() => {
    const requiredRaw = auctionDetails?.requiredCurrencyRaised
    if (!requiredRaw || !bidTokenInfo) {
      return ''
    }
    return formatTokenAmountWithSymbol({
      raw: BigInt(requiredRaw),
      decimals: bidTokenInfo.decimals,
      symbol: bidTokenInfo.symbol,
    })
  }, [auctionDetails?.requiredCurrencyRaised, bidTokenInfo])

  // When trading is restricted until TGE (same gating as the token launched banner),
  // the claim event represents tokens being claimable but not yet tradeable.
  const tokenAddress = auctionDetails?.tokenAddress
  const chainId = auctionDetails?.chainId
  const tradingRestrictedUntilTge = Boolean(
    tokenAddress && chainId && isTradingRestrictedUntilTge({ chainId, tokenAddress }),
  )

  const strings = useMemo(
    (): Record<TimelineEventType, TimelineEventStrings> => ({
      'pre-sale-starts': {
        label: t('toucan.timeline.preSaleStarts'),
        description: t('toucan.timeline.preSaleStarts.description'),
        futureDescription: t('toucan.timeline.preSaleStarts.description.future'),
      },
      'pre-sale-ends': {
        label: t('toucan.timeline.preSaleEnds'),
        description: t('toucan.timeline.preSaleEnds.description'),
        futureDescription: t('toucan.timeline.preSaleEnds.description.future'),
      },
      'auction-started': {
        label: t('toucan.timeline.auctionStarted'),
        description: t('toucan.timeline.auctionStarted.description'),
        futureDescription: t('toucan.timeline.auctionStarted.description.future'),
        badge: t('toucan.timeline.allowlistOnly'),
        allowlistDescription: t('toucan.timeline.auctionStarted.allowlist.description'),
        allowlistFutureDescription: t('toucan.timeline.auctionStarted.allowlist.description.future'),
      },
      'general-sale-starts': {
        label: t('toucan.timeline.generalSaleStarts'),
        description: t('toucan.timeline.generalSaleStarts.description'),
        futureDescription: t('toucan.timeline.generalSaleStarts.description.future'),
      },
      'auction-ends': {
        label: t('toucan.timeline.auctionEnds'),
        description: t('toucan.timeline.auctionEnds.description'),
        futureDescription: t('toucan.timeline.auctionEnds.description.future'),
      },
      'tokens-claimable': tradingRestrictedUntilTge
        ? {
            label: t('toucan.timeline.tokensClaimable.restricted'),
            description: t('toucan.timeline.tokensClaimable.restricted.description'),
            futureDescription: t('toucan.timeline.tokensClaimable.restricted.description.future'),
          }
        : {
            label: t('toucan.timeline.tokensClaimable'),
            description: t('toucan.timeline.tokensClaimable.description'),
            futureDescription: t('toucan.timeline.tokensClaimable.description.future'),
          },
      'auction-failed': {
        label: t('toucan.timeline.auctionFailed'),
        description: t('toucan.timeline.auctionFailed.description', { requiredAmount: requiredAmountFormatted }),
        futureDescription: t('toucan.timeline.auctionFailed.description', { requiredAmount: requiredAmountFormatted }),
      },
    }),
    [t, tradingRestrictedUntilTge, requiredAmountFormatted],
  )

  const events = useTimelineEvents({ auctionDetails, strings, auctionHasPresale, allowlistEndBlock, isAuctionFailed })
  const activeIndex = getActiveEventIndex(events, currentBlockNumber)

  if (events.length === 0) {
    return null
  }

  return (
    <Flex>
      {events.map((event, index) => (
        <TimelineItem
          key={event.type}
          event={event}
          isActive={index === activeIndex}
          isPast={index < activeIndex}
          isFirst={index === 0}
          isLast={index === events.length - 1}
          lineColor={surface3.val}
          tokenColor={effectiveTokenColor}
          localizedDayjs={dayjs}
        />
      ))}
    </Flex>
  )
}
