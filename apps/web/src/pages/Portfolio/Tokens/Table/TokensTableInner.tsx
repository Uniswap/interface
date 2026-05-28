import { type ColumnDef, Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'ui/src'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Table } from '~/components/Table'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from '~/pages/Portfolio/constants'
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
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const allowMultichainExpandRows = multichainTokenUxEnabled && !showHiddenTokensBanner
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

  const columns = useTokenColumns({
    hiddenColumns,
    showLoadingSkeleton,
    showUnrealizedPnlPercent,
    columnSortEnabled,
  })
  const navigateToTokenDetails = useNavigateToTokenDetails()

  const handleTokenRowClick = useCallback(
    (data: TokenData) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: analyticsContext?.element ?? ElementName.TokenItem,
        section: analyticsContext?.section ?? SectionName.PortfolioTokensTab,
        ...trace,
      })
      navigateToTokenDetails(data.currencyInfo.currency, data.chainId)
    },
    [navigateToTokenDetails, trace, analyticsContext],
  )

  const rowWrapper = useCallback(
    (row: Row<TokenTableRow>, content: JSX.Element) => {
      if (loading) {
        return content
      }
      const canExpand = allowMultichainExpandRows && row.getCanExpand()
      const onPress = canExpand
        ? () => {
            const nextExpanded = !row.getIsExpanded()
            row.toggleExpanded()
            sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
              ...trace,
              element: ElementName.BreakdownExpanded,
              multichainTokenRowState: nextExpanded ? 'open' : 'close',
            })
          }
        : () => handleTokenRowClick(getTokenDataForRow(row.original))
      return (
        <TouchableArea onPress={onPress} pressStyle={{ scale: 1 }}>
          {content}
        </TouchableArea>
      )
    },
    [loading, allowMultichainExpandRows, handleTokenRowClick, trace],
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
        v2={true}
        hideHeader={hideHeader}
        externalScrollSync={externalScrollSync}
        scrollGroup={scrollGroup}
        getRowId={(row: TokenTableRow) => getTokenTableRowId(row)}
        getSubRows={getSubRows}
        singleExpandedRow
        rowWrapper={rowWrapper}
        rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        subRowHeight={40}
        defaultPinnedColumns={['currencyInfo']}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        loadingRowsCount={loadingRowsCount}
        centerArrows
      />
    </>
  )
}
