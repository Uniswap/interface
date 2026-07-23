import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Pools } from 'ui/src/components/icons/Pools'
import type { PositionStatusFilterValue } from 'uniswap/src/features/positions/components/PositionStatusFilter'

/**
 * No-results view for the Pools list when the active status filter matches nothing. Shared by the
 * extension Pools tab and the future mobile Pools tab. Only the Closed filter has a no-results state;
 * for other filters this renders nothing.
 */
export function PositionsEmptyFilterView({
  statusFilter,
  openPositionsCount,
  onViewOpenPositions,
}: {
  statusFilter: PositionStatusFilterValue
  openPositionsCount: number
  onViewOpenPositions: () => void
}): JSX.Element | null {
  const { t } = useTranslation()

  if (statusFilter !== 'closed') {
    return null
  }

  return (
    <Flex centered gap="$spacing16" py="$spacing24" testID="pools-empty-filter-view" width="100%">
      <Pools color="$neutral3" size="$icon.64" />
      <Flex centered gap="$spacing8">
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('pool.positions.empty.closed')}
        </Text>
        {openPositionsCount > 0 ? (
          <TouchableArea testID="pools-empty-filter-view-cta" onPress={onViewOpenPositions}>
            <Text color="$accent1" variant="buttonLabel3">
              {t('pool.positions.empty.viewOpen', { count: openPositionsCount })}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}
