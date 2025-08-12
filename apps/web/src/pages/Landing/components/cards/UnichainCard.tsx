import { CardContents } from 'pages/Landing/components/cards/CardContents'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'
import { Unichain } from 'ui/src/components/icons/Unichain'
import { opacify } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const primary = '#F50DB4'

export function UnichainCard() {
  const { t } = useTranslation()

  return (
    <ValuePropCard
      href={uniswapUrls.unichainUrl}
      smaller
      color={primary}
      backgroundColor={opacify(6, primary)}
      $theme-dark={{ backgroundColor: opacify(12, primary) }}
      title={
        <PillButton color={primary} label={t('common.unichain')} icon={<Unichain size="$icon.24" fill={primary} />} />
      }
      bodyText={t('landing.unichain.body')}
      subtitle={t('landing.unichain.subtitle')}
      button={<PillButton color={primary} label={t('landing.unichain.button')} backgroundColor="$surface1" />}
      alignTextToBottom
    >
      <CardContents>
        <Image src="/images/landing_page/Unichain-bg.svg" width="100%" height="100%" position="absolute" bottom="0" />
        <img
          src="/images/landing_page/Unichain.svg"
          width="100%"
          height="130%"
          style={{ objectFit: 'contain', transform: 'translateX(35%)', marginTop: '10%' }}
          alt={t('common.unichain')}
        />
      </CardContents>
    </ValuePropCard>
  )
}
