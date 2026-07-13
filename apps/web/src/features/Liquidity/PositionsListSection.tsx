import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, type FlexProps, Text, useMedia } from 'ui/src'
import { InlineExpandoRow } from 'uniswap/src/components/ExpandoRow/InlineExpandoRow'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { logPositionCardClick } from '~/features/Liquidity/analytics'
import { LiquidityPositionCard } from '~/features/Liquidity/LiquidityPositionCard'

function getPositionCardLinkTarget({
  position,
  readOnly,
  entryPoint,
}: {
  position: PositionInfo
  readOnly: boolean
  entryPoint?: string
}): string {
  if (readOnly) {
    return getPoolDetailsURL(position.poolId, position.chainId)
  }
  return getPositionUrl(position, { entryPoint })
}

interface HiddenSectionPadding {
  px?: FlexProps['px']
  py?: FlexProps['py']
}

interface PositionsListSectionProps {
  visiblePositions: PositionInfo[]
  hiddenPositions: PositionInfo[]
  hasNextPage: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  loadMorePositions: () => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (show: boolean) => void
  hiddenSectionLabel?: string
  hiddenSectionPadding?: HiddenSectionPadding
  entryPoint?: string
  readOnly?: boolean
}

export function PositionsListSection({
  visiblePositions,
  hiddenPositions,
  hasNextPage,
  isFetching,
  isPlaceholderData,
  loadMorePositions,
  showHiddenPositions,
  setShowHiddenPositions,
  hiddenSectionLabel,
  hiddenSectionPadding,
  entryPoint,
  readOnly = false,
}: PositionsListSectionProps) {
  return (
    <Flex gap="$gap16" opacity={isPlaceholderData ? 0.6 : 1}>
      <VirtualizedPositionsList
        positions={visiblePositions}
        onLoadMore={loadMorePositions}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        entryPoint={entryPoint}
        readOnly={readOnly}
      />
      <HiddenPositions
        showHiddenPositions={showHiddenPositions}
        setShowHiddenPositions={setShowHiddenPositions}
        hiddenPositions={hiddenPositions}
        hiddenSectionLabel={hiddenSectionLabel}
        hiddenSectionPadding={hiddenSectionPadding}
        entryPoint={entryPoint}
        readOnly={readOnly}
      />
    </Flex>
  )
}

function VirtualizedPositionsList({
  positions,
  onLoadMore,
  hasNextPage,
  isFetching,
  entryPoint,
  readOnly,
}: {
  positions: PositionInfo[]
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
  entryPoint?: string
  readOnly: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const trace = useTrace()

  const positionItemHeight = useMemo(() => {
    return media.sm ? 366 : media.md ? 284 : 184
  }, [media])

  const containerRef = useRef<HTMLDivElement>(null)
  const containerOffsetTop = containerRef.current?.offsetTop ?? 0

  const virtualizer = useWindowVirtualizer({
    count: positions.length,
    estimateSize: () => positionItemHeight,
    overscan: 3,
    scrollMargin: containerOffsetTop,
  })

  useEffect(() => {
    virtualizer.measure()
  }, [virtualizer, positionItemHeight])

  const virtualItems = virtualizer.getVirtualItems()

  const lastVisibleIndex = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1]!.index : -1
  useEffect(() => {
    if (lastVisibleIndex >= positions.length - 3 && hasNextPage && !isFetching) {
      onLoadMore()
    }
  }, [lastVisibleIndex, positions.length, hasNextPage, isFetching, onLoadMore])

  return (
    <Flex grow>
      <Flex ref={containerRef} position="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualItems.map((virtualItem) => {
          const position = positions[virtualItem.index]
          return (
            <Flex
              key={getPositionKey(position)}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height={virtualItem.size}
              style={{
                transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <Link
                style={{ textDecoration: 'none' }}
                to={getPositionCardLinkTarget({ position, readOnly, entryPoint })}
                onClick={() => logPositionCardClick(position, trace)}
              >
                <LiquidityPositionCard
                  showVisibilityOption
                  liquidityPosition={position}
                  showMigrateButton
                  readOnly={readOnly}
                />
              </Link>
            </Flex>
          )
        })}
      </Flex>

      {isFetching && hasNextPage && (
        <Flex height={20} justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('liquidityPool.positions.loadingMore')}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

interface HiddenPositionsProps {
  showHiddenPositions: boolean
  setShowHiddenPositions: (showHiddenPositions: boolean) => void
  hiddenPositions: PositionInfo[]
  hiddenSectionLabel?: string
  hiddenSectionPadding?: HiddenSectionPadding
  entryPoint?: string
  readOnly: boolean
}

function HiddenPositions({
  showHiddenPositions,
  setShowHiddenPositions,
  hiddenPositions,
  hiddenSectionLabel,
  hiddenSectionPadding,
  entryPoint,
  readOnly,
}: HiddenPositionsProps) {
  const { t } = useTranslation()
  const trace = useTrace()

  if (hiddenPositions.length === 0) {
    return null
  }

  // Wrap so the parent's gap-16 doesn't apply between the expando row and its animated body,
  // which would create phantom space below the expando when collapsed.
  return (
    <Flex>
      <InlineExpandoRow
        isExpanded={showHiddenPositions}
        label={hiddenSectionLabel ?? `${t('common.hidden')} (${hiddenPositions.length})`}
        onPress={() => setShowHiddenPositions(!showHiddenPositions)}
        body={
          showHiddenPositions ? (
            <Flex gap="$gap16">
              {hiddenPositions.map((position) => (
                <Link
                  key={getPositionKey(position)}
                  style={{ textDecoration: 'none' }}
                  to={getPositionCardLinkTarget({ position, readOnly, entryPoint })}
                  onClick={() => logPositionCardClick(position, trace)}
                >
                  <LiquidityPositionCard
                    showVisibilityOption
                    liquidityPosition={position}
                    isVisible={false}
                    readOnly={readOnly}
                  />
                </Link>
              ))}
            </Flex>
          ) : undefined
        }
        px={hiddenSectionPadding?.px}
        py={hiddenSectionPadding?.py}
      />
    </Flex>
  )
}
