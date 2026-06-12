import { useTranslation } from 'react-i18next'
import { Clock } from 'ui/src/components/icons/Clock'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useIsEquityOffHours } from 'uniswap/src/features/rwa/useIsEquityOffHours'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'

export function OffHoursLiquidityBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const rwaMatch = useRWATokenDetailsMatch()
  const isOffHours = useIsEquityOffHours()

  if (!rwaMatch || !isOffHours) {
    return null
  }

  return (
    <InlineWarningCard
      severity={WarningSeverity.Low}
      Icon={Clock}
      description={t('tdp.rwa.offHours.warning', { name: rwaMatch.asset.name })}
      learnMoreUrl={uniswapUrls.helpArticleUrls.rwaOffHours}
      inlineLearnMore
      descriptionTestId={TestID.TokenDetailsRWAOffHoursBanner}
    />
  )
}
