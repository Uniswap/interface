import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'ui/src'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import {
  TokenProtectionWarning,
  getCardHeaderText,
  getCardSubtitleText,
  getFeeOnTransfer,
  getSeverityFromTokenProtectionWarning,
  getTokenProtectionWarning,
  getTokenWarningSeverity,
  useTokenWarningCardText,
} from 'uniswap/src/features/tokens/safetyUtils'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

type TokenWarningCardProps = {
  currencyInfo: Maybe<CurrencyInfo>
  tokenProtectionWarningOverride?: TokenProtectionWarning
  feeOnTransferOverride?: {
    buyFeePercent?: number
    sellFeePercent?: number
  }
  onPress?: () => void
  headingTestId?: string
  descriptionTestId?: string
  hideCtaIcon?: boolean
  checked?: boolean
  setChecked?: (checked: boolean) => void
}

function useTokenWarningOverrides(
  currencyInfo: Maybe<CurrencyInfo>,
  tokenProtectionWarningOverride?: TokenProtectionWarning,
  feeOnTransferOverride?: {
    buyFeePercent?: number
    sellFeePercent?: number
  },
): { severity: WarningSeverity; heading: string | null; description: string | null } {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { heading: headingDefault, description: descriptionDefault } = useTokenWarningCardText(currencyInfo)
  const { buyFeePercent, sellFeePercent } = getFeeOnTransfer(currencyInfo?.currency)

  const severity = tokenProtectionWarningOverride
    ? getSeverityFromTokenProtectionWarning(tokenProtectionWarningOverride)
    : getTokenWarningSeverity(currencyInfo)

  const headingOverride = getCardHeaderText({
    t,
    tokenProtectionWarning: tokenProtectionWarningOverride ?? TokenProtectionWarning.None,
  })

  const descriptionOverride = getCardSubtitleText({
    t,
    tokenProtectionWarning: tokenProtectionWarningOverride ?? TokenProtectionWarning.None,
    tokenSymbol: currencyInfo?.currency.symbol,
    buyFeePercent: feeOnTransferOverride?.buyFeePercent ?? buyFeePercent,
    sellFeePercent: feeOnTransferOverride?.sellFeePercent ?? sellFeePercent,
    formatPercent,
  })

  const heading = tokenProtectionWarningOverride ? headingOverride : headingDefault
  const description = tokenProtectionWarningOverride ? descriptionOverride : descriptionDefault

  return { severity, heading, description }
}

export function TokenWarningCard({
  currencyInfo,
  tokenProtectionWarningOverride,
  feeOnTransferOverride,
  headingTestId,
  descriptionTestId,
  hideCtaIcon,
  checked,
  setChecked,
  onPress,
}: TokenWarningCardProps): JSX.Element | null {
  const { t } = useTranslation()
  const { severity, heading, description } = useTokenWarningOverrides(
    currencyInfo,
    tokenProtectionWarningOverride,
    feeOnTransferOverride,
  )

  if (!currencyInfo || !severity || !description) {
    return null
  }

  const { buyFeePercent, sellFeePercent } = getFeeOnTransfer(currencyInfo?.currency)
  const analyticsProperties = {
    tokenSymbol: currencyInfo.currency.symbol,
    chainId: currencyInfo.currency.chainId,
    tokenAddress: currencyIdToAddress(currencyInfo.currencyId),
    warningSeverity: WarningSeverity[severity],
    tokenProtectionWarning:
      TokenProtectionWarning[tokenProtectionWarningOverride ?? getTokenProtectionWarning(currencyInfo)],
    buyFeePercent: feeOnTransferOverride?.buyFeePercent ?? buyFeePercent,
    sellFeePercent: feeOnTransferOverride?.sellFeePercent ?? sellFeePercent,
    safetyInfo: currencyInfo.safetyInfo,
  }

  return (
    <Trace logPress={!!onPress} element={ElementName.TokenWarningCard} properties={analyticsProperties}>
      <TouchableArea onPress={onPress}>
        <InlineWarningCard
          hideCtaIcon={hideCtaIcon}
          severity={severity}
          checkboxLabel={setChecked ? t('common.button.understand') : undefined}
          heading={heading ?? undefined}
          description={description}
          headingTestId={headingTestId}
          descriptionTestId={descriptionTestId}
          checked={checked}
          setChecked={setChecked}
          analyticsProperties={analyticsProperties}
          onPressCtaButton={onPress}
        />
      </TouchableArea>
    </Trace>
  )
}
