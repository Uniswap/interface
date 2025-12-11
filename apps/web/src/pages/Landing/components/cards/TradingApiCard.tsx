import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { CardContents } from 'pages/Landing/components/cards/CardContents'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useTranslation } from 'react-i18next'
import { LayerGroup } from 'ui/src/components/icons/LayerGroup'
import { opacify } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const primary = '#FF4D00'

export function TradingApiCard() {
  const { t } = useTranslation()
  const isUnificationCopyEnabled = useFeatureFlag(FeatureFlags.UnificationCopy)

  return (
    <ValuePropCard
      smaller
      backgroundColor={opacify(4, primary)}
      $theme-dark={{
        backgroundColor: opacify(12, primary),
      }}
      href={uniswapUrls.tradingApiDocsUrl}
      color={primary}
      title={
        <PillButton
          color={primary}
          label={t('landing.tradingApi')}
          icon={<LayerGroup size="$icon.24" fill={primary} />}
        />
      }
      bodyText={t('landing.tradingApiBody')}
      subtitle={isUnificationCopyEnabled ? t('landing.tradingApiSubtitle') : t('landing.tradingApiSubtitle.old')}
      button={<PillButton backgroundColor="$surface1" color={primary} label={t('landing.tradingApiButton')} />}
      alignTextToBottom
    >
      <CardContents>
        <img
          src="/images/landing_page/TradingAPI.svg"
          width="100%"
          height="80%"
          style={{ transform: 'translateX(45%)', objectFit: 'contain' }}
          alt={t('landing.tradingApi')}
        />
      </CardContents>
    </ValuePropCard>
  )
}
