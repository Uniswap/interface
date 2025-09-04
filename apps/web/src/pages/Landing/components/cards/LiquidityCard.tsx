import { CardContents } from 'pages/Landing/components/cards/CardContents'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { Bars } from 'pages/Landing/components/Icons'
import { useTranslation } from 'react-i18next'
import { opacify } from 'ui/src/theme'

const primary = '#00C3A0'

export function LiquidityCard() {
  const { t } = useTranslation()

  return (
    <ValuePropCard
      to="/pool"
      smaller
      color={primary}
      backgroundColor={opacify(6, primary)}
      title={
        <PillButton
          color={primary}
          label={t('common.liquidity.provision')}
          icon={<Bars size="24px" fill={primary} />}
        />
      }
      bodyText={t('landing.provideLiquidity.body')}
      subtitle={t('landing.provideLiquidity.subtitle')}
      button={<PillButton color={primary} label={t('pools.explore')} backgroundColor="$surface1" />}
      alignTextToBottom
    >
      <CardContents pr="$padding16">
        <img
          src="/images/landing_page/LiquidityProvisions.svg"
          width="35%"
          height="100%"
          style={{ objectFit: 'contain' }}
          alt={t('common.liquidity.provision')}
        />
      </CardContents>
    </ValuePropCard>
  )
}
