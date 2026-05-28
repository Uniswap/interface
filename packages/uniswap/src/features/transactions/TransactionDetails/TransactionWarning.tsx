import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'ui/src'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'

export const TransactionWarning = ({
  warning,
  onShowWarning,
}: {
  warning: Warning
  onShowWarning: () => void
}): JSX.Element => {
  const { t } = useTranslation()
  const { title, severity, message, link, type, icon } = warning
  const isPriceImpactWarning = type === WarningLabel.PriceImpactMedium || type === WarningLabel.PriceImpactHigh

  if (isPriceImpactWarning) {
    return (
      <InlineWarningCard
        hideCtaIcon
        Icon={icon}
        severity={severity}
        heading={t('swap.warning.priceImpact.label')}
        description={message}
        learnMoreUrl={link}
      />
    )
  }

  return (
    <TouchableArea onPress={onShowWarning}>
      <InlineWarningCard hideCtaIcon severity={severity} heading={title} description={message} learnMoreUrl={link} />
    </TouchableArea>
  )
}
