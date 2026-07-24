import { type ColumnDef, Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'ui/src'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { TdpChainSelectionType } from 'uniswap/src/utils/linking'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Table } from '~/components/Table'
import { usePinnedColumns } from '~/components/Table/PinnedColumns/usePinnedColumns'
import { PORTFOLIO_MULTICHAIN_CHAIN_ROW_HEIGHT, PORTFOLIO_TABLE_ROW_HEIGHT } from '~/pages/Portfolio/constants'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokenColumns, useTokenColumns } from '~/pages/Portfolio/Tokens/Table/columns/useTokenColumns'
import {
  buildTokenTableRows,
  getPortfolioMultichainExpandRowMetrics,
  getPortfolioMultichainExpandRowMetricsIdentityKey,
  getSubRows,
  getTokenDataForRow,
  getTokenTableRowId,
} from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'
import type { TokenTableRow } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'
import { usePortfolioTokenTableExpandableRow } from '~/pages/Portfolio/Tokens/Table/usePortfolioTokenTableExpandableRow'

const TOKEN_COLUMN_PINNED = ['currencyInfo']

export function TokensTableInner({
  tokenData,
  hideHeader,
  showHiddenTokensBanner = false,
  loading = false,
  error,
  hiddenColumns,
  maxHeight,
  maxWidth = 1200,
  loadingRowsCount,
  externalScrollSync = true,
  scrollGroup = 'portfolio-tokens',
  analyticsContext,
  showUnrealizedPnlPercent = false,
  columnSortEnabled = true,
}: {
  tokenData: TokenData[]
  hideHeader?: boolean
  showHiddenTokensBanner?: boolean
  loading?: boolean
  error?: Error | undefined
  hiddenColumns?: TokenColumns[]
  maxHeight?: number
  maxWidth?: number
  loadingRowsCount?: number
  externalScrollSync?: boolean
  scrollGroup?: string
  analyticsContext?: { element: ElementName; section: SectionName }
  showUnrealizedPnlPercent?: boolean
  columnSortEnabled?: boolean
}) {
  const { t } = useTranslation()
  const { value: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBooleanState(false)
  const hasData = tokenData.length > 0
  const showLoadingSkeleton = loading || (!!error && !hasData)
  const trace = useTrace()
  const allowMultichainExpandRows = !showHiddenTokensBanner

  const { hasPinnedColumns } = usePinnedColumns({
    defaultPinnedColumns: TOKEN_COLUMN_PINNED,
    maxWidth,
    forcePinning: false,
  })

  const rows = useMemo(
    () => buildTokenTableRows(tokenData, allowMultichainExpandRows),
    [tokenData, allowMultichainExpandRows],
  )

  const lastSentMultichainMetricsKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!allowMultichainExpandRows) {
      lastSentMultichainMetricsKeyRef.current = null
      return
    }
    if (showLoadingSkeleton) {
      return
    }
    const identityKey = getPortfolioMultichainExpandRowMetricsIdentityKey(tokenData)
    if (lastSentMultichainMetricsKeyRef.current === identityKey) {
      return
    }
    lastSentMultichainMetricsKeyRef.current = identityKey
    const { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount } =
      getPortfolioMultichainExpandRowMetrics(tokenData)
    sendAnalyticsEvent(UniswapEventName.MultichainPortfolioMetrics, {
      total_token_row_count: totalTokenRowCount,
      multichain_row_reduction_count: multichainRowReductionCount,
      multichain_asset_count: multichainAssetCount,
      ...trace,
      ...(analyticsContext ? { element: analyticsContext.element, section: analyticsContext.section } : {}),
    })
  }, [allowMultichainExpandRows, showLoadingSkeleton, tokenData, trace, analyticsContext])

  const navigateToTokenDetails = useNavigateToTokenDetails()

  const handleTokenNameClick = useCallback(
    (row: Extract<TokenTableRow, { type: 'parent' }>) => {
      navigateToTokenDetails(row.tokenData.currencyInfo.currency, { type: TdpChainSelectionType.Multichain })
    },
    [navigateToTokenDetails],
  )

  const columns = useTokenColumns({
    hiddenColumns,
    showLoadingSkeleton,
    showUnrealizedPnlPercent,
    columnSortEnabled,
    hasPinnedColumns,
    unifiedExpandableRows: allowMultichainExpandRows,
    onTokenNameClick: handleTokenNameClick,
  })

  const handleTokenRowClick = useCallback(
    (data: TokenData) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: analyticsContext?.element ?? ElementName.TokenItem,
        section: analyticsContext?.section ?? SectionName.PortfolioTokensTab,
        ...trace,
      })
      navigateToTokenDetails(data.currencyInfo.currency, { type: TdpChainSelectionType.Chain, chainId: data.chainId })
    },
    [navigateToTokenDetails, trace, analyticsContext],
  )

  const handleMultichainParentToggle = useCallback(
    (_row: Row<TokenTableRow>, nextExpanded: boolean) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.BreakdownExpanded,
        multichainTokenRowState: nextExpanded ? 'open' : 'close',
      })
    },
    [trace],
  )

  const { rowWrapper: unifiedExpandableRowWrapper, renderUnifiedExpandableRow } = usePortfolioTokenTableExpandableRow({
    onParentToggle: handleMultichainParentToggle,
    onChildRowPress: handleTokenRowClick,
  })

  const rowWrapper = useCallback(
    (row: Row<TokenTableRow>, content: JSX.Element) => {
      if (loading) {
        return content
      }

      if (!allowMultichainExpandRows) {
        return (
          <TouchableArea
            pressStyle={{ scale: 1 }}
            onPress={() => {
              handleTokenRowClick(getTokenDataForRow(row.original))
            }}
          >
            {content}
          </TouchableArea>
        )
      }

      const wrappedContent = unifiedExpandableRowWrapper(row, content)

      if (row.depth > 0) {
        return wrappedContent
      }

      return (
        <TouchableArea
          pressStyle={{ scale: 1 }}
          onPress={() => {
            handleTokenRowClick(getTokenDataForRow(row.original))
          }}
        >
          {wrappedContent}
        </TouchableArea>
      )
    },
    [loading, allowMultichainExpandRows, unifiedExpandableRowWrapper, handleTokenRowClick],
  )

  return (
    <>
      {showHiddenTokensBanner && (
        <InformationBanner
          infoText={t('hidden.tokens.info.banner.text')}
          onPress={openModal}
          testID={TestID.HiddenTokensInfoBanner}
        />
      )}
      <HiddenTokenInfoModal isOpen={isModalVisible} onClose={closeModal} />
      <Table<TokenTableRow>
        columns={columns as ColumnDef<TokenTableRow, unknown>[]}
        data={rows}
        loading={loading}
        error={!!error && !hasData}
        hideHeader={hideHeader}
        externalScrollSync={externalScrollSync}
        scrollGroup={scrollGroup}
        getRowId={(row: TokenTableRow) => getTokenTableRowId(row)}
        getSubRows={getSubRows}
        rowWrapper={rowWrapper}
        renderUnifiedExpandableRow={allowMultichainExpandRows ? renderUnifiedExpandableRow : undefined}
        singleExpandedRow={allowMultichainExpandRows}
        rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        subRowHeight={allowMultichainExpandRows ? PORTFOLIO_MULTICHAIN_CHAIN_ROW_HEIGHT : undefined}
        defaultPinnedColumns={['currencyInfo']}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        loadingRowsCount={loadingRowsCount}
        centerArrows
      />
    </>
  )
}
