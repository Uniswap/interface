import { createColumnHelper, Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import {
  useOpenOffchainActivityModal,
  useOrderAmounts,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { hasRow } from 'components/Table/utils/hasRow'
import { TFunction } from 'i18next'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { MAX_LIMITS_LOADING_ROWS } from 'pages/Portfolio/Overview/constants'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getDurationRemainingString } from 'utilities/src/time/duration'

/**
 * Type guard to check if order amounts are fully defined with currencies.
 * This is a runtime check because useOrderAmounts can return undefined if:
 * - Currency resolution fails (network issues, missing token data)
 * - Order typeInfo is missing or malformed
 * While open orders should typically have valid amounts, currency resolution
 * can fail at runtime, so this guard is necessary.
 */
function hasValidOrderAmounts(amounts: ReturnType<typeof useOrderAmounts>): amounts is {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
} {
  return !!amounts?.inputAmount.currency && !!amounts.outputAmount.currency
}

function getExpiryText(expiry: number | undefined, t: TFunction): string | null {
  if (!expiry) {
    return null
  }

  const expiryTimeMs = expiry * 1000
  const durationString = getDurationRemainingString(expiryTimeMs)

  return t('common.limits.expiresIn', { duration: durationString })
}

interface OpenLimitsTableProps {
  account: string
  maxLimits?: number
}

// Left column cell component
const LimitInfoCell = memo(function LimitInfoCell({ order }: { order: UniswapXOrderDetails }) {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const amounts = useOrderAmounts(order)

  const inputCurrencyInfo = useCurrencyInfo(
    amounts?.inputAmount.currency ? currencyId(amounts.inputAmount.currency) : undefined,
  )
  const outputCurrencyInfo = useCurrencyInfo(
    amounts?.outputAmount.currency ? currencyId(amounts.outputAmount.currency) : undefined,
  )

  // Early return if amounts are not fully defined with currencies
  // This is a valid runtime check - currency resolution can fail even for valid orders
  if (!hasValidOrderAmounts(amounts)) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap8">
      <SplitLogo
        chainId={order.chainId}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={iconSizes.icon24}
      />
      <Flex>
        <Text variant="body3" color="$neutral1">
          {formatCurrencyAmount({
            value: amounts.inputAmount,
            type: NumberType.TokenTx,
          })}{' '}
          {amounts.inputAmount.currency.symbol} → {amounts.outputAmount.currency.symbol}
        </Text>
        <Text variant="body4" color="$neutral2">
          {getExpiryText(order.expiry, t)}
        </Text>
      </Flex>
    </Flex>
  )
})

// Right column cell component
const LimitActionCell = memo(function LimitActionCell({ order }: { order: UniswapXOrderDetails }) {
  const formatter = useLocalizationContext()
  const amounts = useOrderAmounts(order)

  // Get USD values for the amounts (hooks must be called unconditionally)
  const inputAmountInfo = useFormattedCurrencyAmountAndUSDValue({
    currency: amounts?.inputAmount.currency,
    currencyAmountRaw: amounts?.inputAmount.quotient.toString(),
    formatter,
  })

  const outputAmountInfo = useFormattedCurrencyAmountAndUSDValue({
    currency: amounts?.outputAmount.currency,
    currencyAmountRaw: amounts?.outputAmount.quotient.toString(),
    formatter,
  })

  // Early return if amounts are not fully defined with currencies
  // This is a valid runtime check - currency resolution can fail even for valid orders
  if (!hasValidOrderAmounts(amounts)) {
    return null
  }

  const tokenAmountText = `Sell ${inputAmountInfo.amount} ${amounts.inputAmount.currency.symbol}`

  return (
    <Flex alignItems="flex-end">
      <Text variant="body3" color="$neutral1">
        {outputAmountInfo.value}
      </Text>
      <Text variant="body4" color="$neutral2">
        {tokenAmountText}
      </Text>
    </Flex>
  )
})

export const OpenLimitsTable = memo(function OpenLimitsTable({ account, maxLimits = 5 }: OpenLimitsTableProps) {
  const { t } = useTranslation()
  const trace = useTrace()
  const { openLimitOrders, loading } = useOpenLimitOrders(account)
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  // Limit the number of orders displayed
  const limitedOrders = useMemo(() => {
    return openLimitOrders.slice(0, maxLimits)
  }, [openLimitOrders, maxLimits])

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<UniswapXOrderDetails>()
    const showLoadingSkeleton = loading

    return [
      // Left Column - Limit Info
      columnHelper.display({
        id: 'limitInfo',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.limits.table.column.limit')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
              {hasRow<UniswapXOrderDetails>(info) && <LimitInfoCell order={info.row.original} />}
            </Cell>
          )
        },
      }),

      // Right Column - Amount and Action
      columnHelper.display({
        id: 'amount',
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.limits.table.column.amount')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<UniswapXOrderDetails>(info) && <LimitActionCell order={info.row.original} />}
            </Cell>
          )
        },
      }),
    ]
  }, [t, loading])

  const rowWrapper = useCallback(
    (row: Row<UniswapXOrderDetails>, content: JSX.Element) => {
      const order = row.original
      return (
        <TouchableArea
          onPress={() => {
            sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
              element: ElementName.PortfolioMiniLimitRow,
              section: SectionName.PortfolioOverviewTab,
              ...trace,
            })
            openOffchainActivityModal(order)
          }}
          cursor="pointer"
        >
          {content}
        </TouchableArea>
      )
    },
    [openOffchainActivityModal, trace],
  )

  // Only show loading state if we don't have data yet
  const tableLoading = loading && !limitedOrders.length

  if (limitedOrders.length === 0 && !loading) {
    return null
  }

  return (
    <TableSectionHeader
      title={t('common.limits.open')}
      subtitle={t('portfolio.overview.limits.table.openLimits', { count: openLimitOrders.length })}
    >
      <Table
        hideHeader
        columns={columns}
        data={limitedOrders}
        loading={tableLoading}
        error={false}
        v2={true}
        rowWrapper={rowWrapper}
        loadingRowsCount={MAX_LIMITS_LOADING_ROWS}
        rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
      />
    </TableSectionHeader>
  )
})
