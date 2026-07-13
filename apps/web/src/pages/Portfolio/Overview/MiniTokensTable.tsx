import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useGetWalletTokensProfitLossQuery } from 'uniswap/src/data/rest/getWalletTokensProfitLoss'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { MAX_TOKENS_ROWS } from '~/pages/Portfolio/Overview/constants'
import { usePortfolioSectionTotalValue } from '~/pages/Portfolio/Overview/hooks/usePortfolioSectionTotalValue'
import { TableSectionHeader } from '~/pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from '~/pages/Portfolio/Overview/ViewAllButton'
import { useTransformTokenTableData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokenColumns } from '~/pages/Portfolio/Tokens/Table/columns/useTokenColumns'
import { TokensTableInner } from '~/pages/Portfolio/Tokens/Table/TokensTableInner'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

const MINI_TOKENS_HIDDEN_COLUMNS = [TokenColumns.Change1d, TokenColumns.Allocation, TokenColumns.AvgCost]
const MINI_TOKENS_ANALYTICS_CONTEXT = {
  element: ElementName.PortfolioMiniTokenRow,
  section: SectionName.PortfolioOverviewTab,
}

interface MiniTokensTableProps {
  maxTokens?: number
  chainId?: UniverseChainId
}

export const MiniTokensTable = memo(function MiniTokensTable({ maxTokens = 8, chainId }: MiniTokensTableProps) {
  const { t } = useTranslation()
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const { externalAddress, chainId: routeChainId } = usePortfolioRoutes()
  const portfolioAddresses = usePortfolioAddresses()
  const { chains: enabledChains } = useEnabledChains()
  const modifier = useRestPortfolioValueModifier(portfolioAddresses.evmAddress ?? portfolioAddresses.svmAddress)
  const viewAllHref = buildPortfolioUrl({
    tab: PortfolioTab.Tokens,
    chainId: routeChainId,
    externalAddress: externalAddress?.address,
  })

  // Same as Portfolio tokens tab: single-chain view should use flat `tokenProfitLosses`, not multichain shape.
  const requestMultichainPnlShape = chainId === undefined

  const { data: tokenProfitLossData, isError: isProfitLossError } = useGetWalletTokensProfitLossQuery({
    input: {
      evmAddress: portfolioAddresses.evmAddress,
      svmAddress: portfolioAddresses.svmAddress,
      chainIds: chainId ? [chainId] : enabledChains,
      modifier,
      multichain: requestMultichainPnlShape || undefined,
    },
  })

  const {
    visible: tokenData,
    totalCount,
    loading,
    error,
  } = useTransformTokenTableData({
    limit: maxTokens,
    chainIds: chainId ? [chainId] : undefined,
    tokenProfitLossData: isProfitLossError ? undefined : (tokenProfitLossData ?? undefined),
  })

  const tableData = tokenData ?? []
  const tableLoading = loading && !tokenData

  const sectionTotalValue = usePortfolioSectionTotalValue({
    part: PortfolioBalancePart.Tokens,
    chainId,
    enabled: portfolioPoolsBalancesEnabled,
  })

  return (
    <Flex grow gap="$gap12">
      <TableSectionHeader
        title={t('common.tokens')}
        subtitle={t('portfolio.tokens.balance.totalTokens', { count: totalCount ?? tableData.length })}
        loading={tableLoading}
        testId={TestID.PortfolioOverviewTokensSection}
        {...sectionTotalValue}
      >
        <TokensTableInner
          tokenData={tableData}
          columnSortEnabled={false}
          loading={tableLoading}
          error={error}
          hiddenColumns={MINI_TOKENS_HIDDEN_COLUMNS}
          maxHeight={undefined}
          loadingRowsCount={MAX_TOKENS_ROWS}
          externalScrollSync={false}
          showUnrealizedPnlPercent
          analyticsContext={MINI_TOKENS_ANALYTICS_CONTEXT}
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
