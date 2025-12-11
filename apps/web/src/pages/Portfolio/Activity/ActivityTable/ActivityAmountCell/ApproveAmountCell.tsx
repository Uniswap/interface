import { CompactLayout } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { DualTokenLayout } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/DualTokenLayout'
import { createTokenLogo } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatApprovalAmount } from 'uniswap/src/components/activity/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

// Memoized component for approval transaction amounts
interface ApproveAmountCellProps {
  singleCurrencyInfo: CurrencyInfo | null | undefined
  approvalAmount: string | undefined
  variant: 'full' | 'compact'
  typeLabel: string
  formatter: ReturnType<typeof useLocalizationContext>
  t: ReturnType<typeof useTranslation>['t']
}

function _ApproveAmountCell({
  singleCurrencyInfo,
  approvalAmount,
  variant,
  typeLabel,
  formatter,
  t,
}: ApproveAmountCellProps): JSX.Element {
  const { formattedAmount, compactAmountText } = useMemo(() => {
    if (!singleCurrencyInfo || approvalAmount === undefined) {
      return { formattedAmount: null, compactAmountText: null }
    }

    const amountText = formatApprovalAmount({
      approvalAmount,
      formatNumberOrString: formatter.formatNumberOrString,
      t,
    })

    const formatted = `${amountText ? amountText + ' ' : ''}${getSymbolDisplayText(singleCurrencyInfo.currency.symbol) ?? ''}`

    const symbol = getSymbolDisplayText(singleCurrencyInfo.currency.symbol) ?? ''
    const compact = amountText ? `${amountText} ${symbol}` : symbol ? symbol : null

    return { formattedAmount: formatted, compactAmountText: compact }
  }, [singleCurrencyInfo, approvalAmount, formatter, t])

  if (variant === 'compact') {
    return (
      <CompactLayout typeLabel={typeLabel} logo={createTokenLogo(singleCurrencyInfo)} amountText={compactAmountText} />
    )
  }

  // Full variant: Single token layout for approvals
  return (
    <DualTokenLayout
      inputCurrency={singleCurrencyInfo}
      outputCurrency={null}
      inputFormattedAmount={formattedAmount}
      outputFormattedAmount={null}
      inputUsdValue={null}
      outputUsdValue={null}
      separator={null}
    />
  )
}

export const ApproveAmountCell = memo(_ApproveAmountCell)
