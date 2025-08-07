import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { Bars } from 'pages/Landing/components/Icons'
import { CardContents } from 'pages/Landing/components/cards/CardContents'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useTranslation } from 'react-i18next'

const primary = '#9E62FF'

export function LiquidityCard() {
  const { t } = useTranslation()
  const { rive, RiveComponent } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'LP',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.CenterRight }),
  })

  return (
    <ValuePropCard
      to="/pool"
      smaller
      color={primary}
      backgroundColor="rgba(136, 63, 255, 0.06)"
      $theme-dark={{
        backgroundColor: 'rgba(136, 63, 255, 0.12)',
      }}
      button={<PillButton color={primary} label={t('common.liquidity')} icon={<Bars size="24px" fill={primary} />} />}
      titleText={t('landing.provideLiquidity.message')}
      alignTextToBottom
    >
      <CardContents>
        <RiveComponent onMouseEnter={() => rive && rive.play()} />
      </CardContents>
    </ValuePropCard>
  )
}
