import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, type FlexProps, Text, useMedia } from 'ui/src'
import { InlineExpandoRow } from 'uniswap/src/components/ExpandoRow/InlineExpandoRow'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { LiquidityPositionCard } from '~/features/Liquidity/LiquidityPositionCard'
import { getPositionUrl } from '~/features/Liquidity/utils/getPositionUrl'

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
}: PositionsListSectionProps) {
  return (
    <Flex gap="$gap16" opacity={isPlaceholderData ? 0.6 : 1}>
      <VirtualizedPositionsList
        positions={visiblePositions}
        onLoadMore={loadMorePositions}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        entryPoint={entryPoint}
      />
      <HiddenPositions
        showHiddenPositions={showHiddenPositions}
        setShowHiddenPositions={setShowHiddenPositions}
        hiddenPositions={hiddenPositions}
        hiddenSectionLabel={hiddenSectionLabel}
        hiddenSectionPadding={hiddenSectionPadding}
        entryPoint={entryPoint}
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
}: {
  positions: PositionInfo[]
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
  entryPoint?: string
}) {
  const { t } = useTranslation()
  const media = useMedia()

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
              key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height={virtualItem.size}
              style={{
                transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <Link style={{ textDecoration: 'none' }} to={getPositionUrl(position, { entryPoint })}>
                <LiquidityPositionCard showVisibilityOption liquidityPosition={position} showMigrateButton />
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
}

function HiddenPositions({
  showHiddenPositions,
  setShowHiddenPositions,
  hiddenPositions,
  hiddenSectionLabel,
  hiddenSectionPadding,
  entryPoint,
}: HiddenPositionsProps) {
  const { t } = useTranslation()

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
          <Flex gap="$gap16">
            {hiddenPositions.map((position) => (
              <Link
                key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
                style={{ textDecoration: 'none' }}
                to={getPositionUrl(position, { entryPoint })}
              >
                <LiquidityPositionCard showVisibilityOption liquidityPosition={position} isVisible={false} />
              </Link>
            ))}
          </Flex>
        }
        px={hiddenSectionPadding?.px}
        py={hiddenSectionPadding?.py}
      />
    </Flex>
  )
}
