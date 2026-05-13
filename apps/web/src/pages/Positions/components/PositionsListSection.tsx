import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, Text, useMedia } from 'ui/src'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { LiquidityPositionCard } from '~/features/Liquidity/LiquidityPositionCard'
import { getPositionUrl } from '~/features/Liquidity/utils/getPositionUrl'
import { ExpandoRow } from '~/pages/Positions/ExpandoRow'

interface PositionsListSectionProps {
  visiblePositions: PositionInfo[]
  hiddenPositions: PositionInfo[]
  hasNextPage: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  loadMorePositions: () => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (show: boolean) => void
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
}: PositionsListSectionProps) {
  return (
    <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
      <VirtualizedPositionsList
        positions={visiblePositions}
        onLoadMore={loadMorePositions}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
      />
      <HiddenPositions
        showHiddenPositions={showHiddenPositions}
        setShowHiddenPositions={setShowHiddenPositions}
        hiddenPositions={hiddenPositions}
      />
    </Flex>
  )
}

function VirtualizedPositionsList({
  positions,
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  positions: PositionInfo[]
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
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
              <Link style={{ textDecoration: 'none' }} to={getPositionUrl(position)}>
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
}

function HiddenPositions({ showHiddenPositions, setShowHiddenPositions, hiddenPositions }: HiddenPositionsProps) {
  const { t } = useTranslation()
  return (
    <ExpandoRow
      isExpanded={showHiddenPositions}
      toggle={() => setShowHiddenPositions(!showHiddenPositions)}
      numItems={hiddenPositions.length}
      title={t('common.hidden')}
      enableOverflow
    >
      <Flex gap="$gap16">
        {hiddenPositions.map((position) => (
          <Link
            key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
            style={{ textDecoration: 'none' }}
            to={getPositionUrl(position)}
          >
            <LiquidityPositionCard showVisibilityOption liquidityPosition={position} isVisible={false} />
          </Link>
        ))}
      </Flex>
    </ExpandoRow>
  )
}
