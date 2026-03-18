import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { MAX_TOKENS_ROWS } from '~/pages/Portfolio/Overview/constants'
import { TableSectionHeader } from '~/pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from '~/pages/Portfolio/Overview/ViewAllButton'
import { useTransformTokenTableData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokenColumns } from '~/pages/Portfolio/Tokens/Table/columns/useTokenColumns'
import { TokensTableInner } from '~/pages/Portfolio/Tokens/Table/TokensTableInner'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

interface MiniTokensTableProps {
  maxTokens?: number
  chainId?: UniverseChainId
}

export const MiniTokensTable = memo(function MiniTokensTable({ maxTokens = 8, chainId }: MiniTokensTableProps) {
  const { t } = useTranslation()
  const { externalAddress, chainId: routeChainId } = usePortfolioRoutes()
  const viewAllHref = buildPortfolioUrl({
    tab: PortfolioTab.Tokens,
    chainId: routeChainId,
    externalAddress: externalAddress?.address,
  })

  const {
    visible: tokenData,
    totalCount,
    loading,
    error,
  } = useTransformTokenTableData({
    limit: maxTokens,
    chainIds: chainId ? [chainId] : undefined,
  })

  const tableData = tokenData ?? []
  const tableLoading = loading && !tokenData

  return (
    <Flex grow gap="$gap12">
      <TableSectionHeader
        title={t('common.tokens')}
        subtitle={t('portfolio.tokens.balance.totalTokens', { count: totalCount ?? tableData.length })}
        loading={tableLoading}
        testId={TestID.PortfolioOverviewTokensSection}
      >
        <TokensTableInner
          tokenData={tableData}
          loading={tableLoading}
          error={error}
          hiddenColumns={[TokenColumns.Change1d, TokenColumns.Allocation]}
          maxHeight={undefined}
          loadingRowsCount={MAX_TOKENS_ROWS}
          externalScrollSync={false}
          analyticsContext={{
            element: ElementName.PortfolioMiniTokenRow,
            section: SectionName.PortfolioOverviewTab,
          }}
        />
      </TableSectionHeader>
      <ViewAllButton
        href={viewAllHref}
        label={t('portfolio.overview.miniTokensTable.viewAllTokens')}
        elementName={ElementName.PortfolioViewAllTokens}
        testId={TestID.PortfolioOverviewViewAllTokens}
      />
    </Flex>
  )
})
