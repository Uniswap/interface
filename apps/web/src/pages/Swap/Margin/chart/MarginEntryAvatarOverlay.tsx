import { Flex, Text } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import type { UTCTimestamp } from 'lightweight-charts'
import { type CSSProperties, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MARGIN_ACTIVE_POSITION_STATUSES,
  type MarginActivePosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsInfiniteQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccount } from '~/connection/hooks/useAccount'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { scaledE18ToNumber } from '~/features/margin/utils/marginFormat'
import { marginPositionDisplayIds } from '~/features/margin/utils/marginPositionDisplayIds'
import { isMarginActivePosition } from '~/features/margin/utils/marginPositionRow'
import { useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import { positionsForMarket } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

const AVATAR_SIZE = 24
const BADGE_SIZE = 16
const BADGE_OFFSET = -5
const DIMMED_OPACITY = 0.35

export interface MarginAvatarMarker {
  positionId: string
  time: UTCTimestamp
  price: number
  displayId?: number
}

// A marker in price-pane pixels, as MarginPriceChartModel publishes it.
export type MarginAvatarPoint = Omit<MarginAvatarMarker, 'time' | 'price'> & { x: number; y: number }

type AvatarCandle = { time: UTCTimestamp; low: number; high: number }

// One avatar per charted position on the candle it opened in, at its entry price clamped into that
// candle's low–high so it sits on the candle even when the fill or the candle's granularity strays.
// Badged with its table ID when the market holds several. An open before the loaded candles pins to the
// first one, so it can still be hovered; no stamped entry price draws none.
export function marginEntryAvatarMarkers({
  positions,
  allPositions,
  candles,
  candleSeconds,
}: {
  positions: MarginActivePosition[]
  // Every active position, which the table's IDs number.
  allPositions: MarginActivePosition[]
  candles: AvatarCandle[]
  candleSeconds: number
}): MarginAvatarMarker[] {
  const displayIds = positions.length > 1 ? marginPositionDisplayIds(allPositions) : new Map<string, number>()
  // The last candle is the live one, restamped to now by appendOrPatchSpotBar, so an open since the
  // previous candle closed is in it even when it predates that stamp.
  const previousCandle = candles.at(-2)
  const liveFrom = previousCandle === undefined ? undefined : previousCandle.time + candleSeconds
  return positions.flatMap((position) => {
    const openedAt = Number(position.openedAt)
    const candle =
      liveFrom !== undefined && openedAt >= liveFrom
        ? candles.at(-1)
        : (candles.findLast((c) => c.time <= openedAt) ?? candles[0])
    const entry = scaledE18ToNumber(position.entryPrice)
    const displayId = displayIds.get(position.positionId)
    return candle === undefined || !(entry > 0)
      ? []
      : [
          {
            positionId: position.positionId,
            time: candle.time,
            price: Math.min(Math.max(entry, candle.low), candle.high),
            ...(displayId === undefined ? {} : { displayId }),
          },
        ]
  })
}

/**
 * The charted market's open positions while "Show positions on chart" is on, their avatar markers, the
 * pixel points the model publishes for them, and the hovered one. A mobile focused position charts alone.
 */
export function useMarginEntryAvatars({
  market,
  candles,
  candleSeconds,
  focusedPosition,
}: {
  market: MarginMarket
  candles: AvatarCandle[]
  candleSeconds: number
  focusedPosition: MarginActivePosition | undefined
}): {
  positions: MarginActivePosition[]
  markers: MarginAvatarMarker[]
  onPointsChange: (points: MarginAvatarPoint[]) => void
  points: MarginAvatarPoint[]
  address: string | undefined
  emphasizedPositionId: string | undefined
  onHoverPosition: (positionId: string | undefined) => void
} {
  const account = useAccount()
  const { address } = account
  const showPosition = useMarginChartPrefs((s) => s.showPosition)
  // The positions table's query (same params, same cache): the chart adds no poll of its own.
  const { data } = useMarginPositionsInfiniteQuery({
    params:
      address && showPosition && !focusedPosition
        ? { swapper: address, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_ACTIVE_POSITION_STATUSES }
        : undefined,
  })
  const allPositions = useMemo(
    () => data?.pages.flatMap((page) => page.positions).filter(isMarginActivePosition) ?? [],
    [data],
  )
  const positions = useMemo(
    () => positionsForMarket({ positions: allPositions, market, anyVenue: true }).filter(isMarginActivePosition),
    [allPositions, market],
  )
  const markers = useMemo(
    () => marginEntryAvatarMarkers({ positions, allPositions, candles, candleSeconds }),
    [positions, allPositions, candles, candleSeconds],
  )
  // Tagged with their market so a switch never paints the last market's avatars before the model republishes.
  const [published, setPublished] = useState<{ marketKey: string; points: MarginAvatarPoint[] }>()
  const onPointsChange = useEvent((points: MarginAvatarPoint[]) => setPublished({ marketKey: market.key, points }))
  const points = published?.marketKey === market.key ? published.points : []
  // An avatar panned off the pane unmounts without its hover-out, so a hover counts only while it shows.
  const [hoveredId, setHoveredId] = useState<string>()
  const emphasizedPositionId = points.some((point) => point.positionId === hoveredId) ? hoveredId : undefined
  return { positions, markers, onPointsChange, points, address, emphasizedPositionId, onHoverPosition: setHoveredId }
}

/**
 * The wallet's avatar at each point, over the chart canvas. Hovering one reports its position (the pane
 * draws that position's levels) and dims the rest. Only the avatars take the pointer, so the crosshair
 * reads through everywhere else.
 */
export function MarginEntryAvatarOverlay({
  points,
  address,
  emphasizedPositionId,
  onHoverPosition,
}: {
  points: MarginAvatarPoint[]
  address: string | undefined
  emphasizedPositionId: string | undefined
  onHoverPosition: (positionId: string | undefined) => void
}): JSX.Element | null {
  const { t } = useTranslation()
  if (!address) {
    return null
  }
  const style = (point: MarginAvatarPoint): CSSProperties => ({
    left: point.x - AVATAR_SIZE / 2,
    top: point.y - AVATAR_SIZE / 2,
    transition: `opacity ${SPORE_ANIMATION_CURVE_CSS.fast}`,
  })
  return (
    <>
      <Flex position="absolute" inset={0} pointerEvents="none" zIndex={1}>
        {points.map((point) => (
          <Flex
            key={point.positionId}
            position="absolute"
            zIndex={point.positionId === emphasizedPositionId ? 1 : 0}
            opacity={
              emphasizedPositionId === undefined || point.positionId === emphasizedPositionId ? 1 : DIMMED_OPACITY
            }
            style={style(point)}
          >
            <Flex borderRadius="$roundedFull" backgroundColor="$surface1" className="shadow-short">
              <AccountIcon address={address} size={AVATAR_SIZE} showBorder />
            </Flex>
            {point.displayId === undefined ? null : (
              <Flex
                position="absolute"
                right={BADGE_OFFSET}
                bottom={BADGE_OFFSET}
                minWidth={BADGE_SIZE}
                height={BADGE_SIZE}
                px="$spacing4"
                centered
                borderRadius="$roundedFull"
                backgroundColor="$surface1"
                borderWidth={1}
                borderColor="$surface3"
              >
                <Text variant="buttonLabel4" color="$neutral1" fontSize={10} lineHeight={12}>
                  {`#${point.displayId}`}
                </Text>
              </Flex>
            )}
          </Flex>
        ))}
      </Flex>
      <Flex position="absolute" inset={0} pointerEvents="none" zIndex={3}>
        {points.map((point) => (
          <Flex
            key={point.positionId}
            position="absolute"
            zIndex={point.positionId === emphasizedPositionId ? 1 : 0}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            pointerEvents="auto"
            style={style(point)}
            tabIndex={0}
            role="button"
            aria-label={
              point.displayId === undefined
                ? t('margin.chart.avatar.label')
                : t('margin.chart.avatar.labelWithId', { id: point.displayId })
            }
            onHoverIn={() => onHoverPosition(point.positionId)}
            onHoverOut={() => onHoverPosition(undefined)}
            onFocus={() => onHoverPosition(point.positionId)}
            onBlur={() => onHoverPosition(undefined)}
          />
        ))}
      </Flex>
    </>
  )
}
