import { SharedEventName } from '@uniswap/analytics-events'
import { Table } from 'components/Table'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { useNavigateToTokenDetails } from 'pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { useTokenColumns } from 'pages/Portfolio/Tokens/Table/columns/useTokenColumns'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'ui/src'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function TokensTableInner({
  tokenData,
  hideHeader,
  showHiddenTokensBanner = false,
  loading = false,
  error,
}: {
  tokenData: TokenData[]
  hideHeader?: boolean
  showHiddenTokensBanner?: boolean
  loading?: boolean
  error?: Error | undefined
}) {
  const { t } = useTranslation()
  const { value: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBooleanState(false)
  const showLoadingSkeleton = loading || !!error
  const trace = useTrace()

  // Create table columns using the shared hook with default config (all columns shown)
  const columns = useTokenColumns({ showLoadingSkeleton })

  const navigateToTokenDetails = useNavigateToTokenDetails()

  const handleTokenRowClick = useCallback(
    (tokenData: TokenData) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        section: SectionName.PortfolioTokensTab,
        ...trace,
      })
      navigateToTokenDetails(tokenData)
    },
    [navigateToTokenDetails, trace],
  )

  return (
    <>
      {showHiddenTokensBanner && (
        <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={openModal} />
      )}
      <HiddenTokenInfoModal isOpen={isModalVisible} onClose={closeModal} />
      <Table
        columns={columns}
        data={tokenData}
        loading={loading}
        error={!!error}
        v2={true}
        hideHeader={hideHeader}
        externalScrollSync
        scrollGroup="portfolio-tokens"
        getRowId={(row) => row.id}
        rowWrapper={
          loading
            ? undefined
            : (row, content) => (
                <TouchableArea onPress={() => handleTokenRowClick(row.original)}>{content}</TouchableArea>
              )
        }
        rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        defaultPinnedColumns={['currencyInfo']}
        maxWidth={1200}
        maxHeight={700}
        centerArrows
      />
    </>
  )
}
