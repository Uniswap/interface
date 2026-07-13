import { Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, TouchableArea } from 'ui/src'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Table } from '~/components/Table'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from '~/pages/Portfolio/constants'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePoolsSectionWarning } from '~/pages/Portfolio/Overview/hooks/usePoolsSectionWarning'
import { usePortfolioSectionTotalValue } from '~/pages/Portfolio/Overview/hooks/usePortfolioSectionTotalValue'
import { useMiniPoolsTableColumns } from '~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableColumns'
import { useMiniPoolsTableData } from '~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableData'
import { TableSectionHeader } from '~/pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from '~/pages/Portfolio/Overview/ViewAllButton'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

const POOLS_TABLE_MAX_HEIGHT = 800
const POOLS_TABLE_MAX_WIDTH = 1200

interface MiniPoolsTableProps {
  account: string
  maxPools?: number
  chainId?: UniverseChainId
}

export const MiniPoolsTable = memo(function MiniPoolsTable({ account, maxPools, chainId }: MiniPoolsTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trace = useTrace()
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const { chainId: routeChainId, externalAddress } = usePortfolioRoutes()

  const { positions, showLoading, hasNoData } = useMiniPoolsTableData({ account, maxPools, chainId })

  const sectionTotalValue = usePortfolioSectionTotalValue({
    part: PortfolioBalancePart.Pools,
    chainId,
    enabled: portfolioPoolsBalancesEnabled,
  })

  const { warningMessage } = usePoolsSectionWarning({ chainId, enabled: portfolioPoolsBalancesEnabled })
  const viewAllHref = portfolioPoolsBalancesEnabled
    ? buildPortfolioUrl({
        tab: PortfolioTab.Pools,
        chainId: routeChainId,
        externalAddress: externalAddress?.address,
      })
    : '/positions'

  const columns = useMiniPoolsTableColumns({ isLoading: showLoading })

  const handleRowPress = useCallback(
    (position: PositionInfo) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.PortfolioMiniPoolRow,
        section: SectionName.PortfolioOverviewTab,
        ...trace,
      })
      navigate(getPositionUrl(position))
    },
    [navigate, trace],
  )

  const rowWrapper = useCallback(
    (row: Row<PositionInfo>, content: JSX.Element) => (
      <TouchableArea onPress={() => handleRowPress(row.original)} cursor="pointer">
        {content}
      </TouchableArea>
    ),
    [handleRowPress],
  )

  if (hasNoData) {
    return null
  }

  return (
    <Flex gap="$gap12">
      <TableSectionHeader
        title={t('common.pools')}
        subtitle={t('portfolio.overview.pools.subtitle.openPositions', {
          numPositions: positions.length,
          count: positions.length,
        })}
        warningMessage={warningMessage}
        {...sectionTotalValue}
      >
        <Table
          columns={columns}
          data={positions}
          loading={showLoading}
          error={false}
          rowWrapper={rowWrapper}
          rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          defaultPinnedColumns={['poolInfo']}
          maxWidth={POOLS_TABLE_MAX_WIDTH}
          centerArrows
          maxHeight={POOLS_TABLE_MAX_HEIGHT}
        />
      </TableSectionHeader>
      <ViewAllButton
        href={viewAllHref}
        label={t('portfolio.overview.pools.table.viewAllPools')}
        elementName={ElementName.PortfolioViewAllPools}
        testId={TestID.PortfolioOverviewViewAllPools}
      />
    </Flex>
  )
})
