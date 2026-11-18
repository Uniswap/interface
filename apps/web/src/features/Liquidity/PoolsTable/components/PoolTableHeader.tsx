import { Flex, Text } from '@universe/mycelium'
import { type ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { stopPropagation } from 'utilities/src/react/stopPropagation'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { usePoolTableStoreActions } from '~/features/Liquidity/PoolsTable/state/poolTableStore'

export function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  surface,
  label,
  sortable = true,
  onSort,
}: {
  category: PoolSortFields
  isCurrentSortMethod: boolean
  direction: OrderDirection
  surface: ExploreTableSurface
  label?: string
  sortable?: boolean
  onSort?: () => void
}) {
  const { setSort } = usePoolTableStoreActions()
  const handleSortCategory = useCallback(() => {
    const ascending = isCurrentSortMethod && direction !== OrderDirection.Asc
    setSort(category, ascending)
    sendAnalyticsEvent(InterfaceEventName.ExploreTableSorted, {
      table_type: 'pools',
      sort_method: category,
      sort_direction: ascending ? OrderDirection.Asc : OrderDirection.Desc,
      surface,
    })
    onSort?.()
  }, [setSort, category, surface, isCurrentSortMethod, direction, onSort])
  const { t } = useTranslation()

  const HEADER_DESCRIPTIONS: Partial<Record<PoolSortFields, ReactNode>> = {
    [PoolSortFields.TVL]: t('stats.tvl'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay'),
    [PoolSortFields.Apr]: t('pool.apr.description'),
  }
  const HEADER_TEXT: Partial<Record<PoolSortFields, string>> = {
    [PoolSortFields.TVL]: t('common.totalValueLocked'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d.short'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay.short'),
    [PoolSortFields.Apr]: t('pool.aprText'),
    [PoolSortFields.VolOverTvl]: t('pool.volOverTvl'),
  }

  if (!sortable) {
    return <HeaderSortText variant="body3">{label ?? HEADER_TEXT[category]}</HeaderSortText>
  }

  return (
    <ClickableHeaderRow width="100%" onPress={handleSortCategory} group>
      {/* The tooltip portals, but its clicks still bubble through React to the sort handler. */}
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Small}
        fitContent
        text={<Text variant="body3">{HEADER_DESCRIPTIONS[category]}</Text>}
        placement="top"
        onClick={stopPropagation}
      >
        <Flex row alignItems="center" cursor="pointer">
          {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {label ?? HEADER_TEXT[category]}
          </HeaderSortText>
        </Flex>
      </MouseoverTooltip>
    </ClickableHeaderRow>
  )
}
