import { useTranslation } from 'react-i18next'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  FeeOnTransferFeeGroupProps,
  getFeeSeverity,
} from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'

type FeeOnTransferWarningCardProps = {
  checked: boolean
  setChecked: (checked: boolean) => void
} & FeeOnTransferFeeGroupProps

export function FeeOnTransferWarningCard({
  inputTokenInfo,
  outputTokenInfo,
  checked,
  setChecked,
}: FeeOnTransferWarningCardProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  // Don't show warning card if neither token is FOT
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return null
  }

  const highestFeeTokenInfo = inputTokenInfo.fee.greaterThan(outputTokenInfo.fee) ? inputTokenInfo : outputTokenInfo
  const { severity: feeSeverity } = getFeeSeverity(highestFeeTokenInfo.fee)

  // Only show the warning card if the fee is HIGH severity
  if (feeSeverity !== WarningSeverity.High) {
    return null
  }

  return (
    <InlineWarningCard
      hideCtaIcon
      severity={WarningSeverity.High}
      checkboxLabel={t('common.button.understand')}
      heading={t('token.safety.warning.highFeeDetected.title')}
      description={t('token.safety.warning.tokenChargesFee.percent.message', {
        tokenSymbol: highestFeeTokenInfo.tokenSymbol,
        feePercent: formatPercent(highestFeeTokenInfo.fee.toFixed(1)),
      })}
      checked={checked}
      setChecked={setChecked}
    />
  )
}
