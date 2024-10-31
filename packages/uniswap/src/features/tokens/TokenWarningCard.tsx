import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenWarningSeverity, useTokenWarningCardText } from 'uniswap/src/features/tokens/safetyUtils'

type TokenWarningCardProps = {
  currencyInfo: Maybe<CurrencyInfo>
  onPressCtaButton?: () => void
}

export function TokenWarningCard({ currencyInfo, onPressCtaButton }: TokenWarningCardProps): JSX.Element | null {
  const severity = getTokenWarningSeverity(currencyInfo)
  const { heading, description } = useTokenWarningCardText(currencyInfo)

  if (!currencyInfo || !severity || !description) {
    return null
  }

  return (
    <InlineWarningCard
      severity={severity}
      heading={heading}
      description={description}
      onPressCtaButton={onPressCtaButton}
    />
  )
}
