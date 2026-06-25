import { useTranslation } from 'react-i18next'
import type { FlexProps } from 'ui/src'
import { Clock } from 'ui/src/components/icons/Clock'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'

export function OffHoursWarningCard({
  assetName,
  descriptionTestId,
  descriptionMaxWidth,
}: {
  assetName: string
  descriptionTestId?: string
  descriptionMaxWidth?: FlexProps['maxWidth']
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <InlineWarningCard
      inlineLearnMore
      severity={WarningSeverity.Low}
      Icon={Clock}
      iconSize="$icon.16"
      padding="$spacing16"
      descriptionMaxWidth={descriptionMaxWidth}
      description={t('tdp.rwa.offHours.warning', { name: assetName })}
      learnMoreUrl={UniswapHelpUrls.articles.rwaOffHours}
      descriptionTestId={descriptionTestId}
    />
  )
}
