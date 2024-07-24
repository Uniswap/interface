import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useScreenSize } from 'hooks/screenSize'
import { t } from 'i18n'
import styled from 'lib/styled-components'
import { Bars } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'

const Contents = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;

  opacity: 1;
  @media (max-width: 1280px) {
    opacity: 0.24;
  }
  @media (max-width: 768px) {
    opacity: 0;
  }
`

type LiquidityCardProps = {
  isDarkMode?: boolean
}

const primary = '#9E62FF'

export function LiquidityCard(props: LiquidityCardProps) {
  const { rive, RiveComponent } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'LP',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.CenterRight }),
  })

  const isScreenSize = useScreenSize()
  const screenIsLarge = isScreenSize['lg']
  const screenIsXLarge = isScreenSize['xl']

  return (
    <ValuePropCard
      to="/pool"
      tagText={t('landing.provideLiquidity')}
      height={screenIsLarge ? '340px' : '240px'}
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(136, 63, 255, 0.12)', light: 'rgba(136, 63, 255, 0.06)' }}
      button={<PillButton color={primary} label={t('common.liquidity')} icon={<Bars size="24px" fill={primary} />} />}
      titleText={t('landing.provideLiquidity.message')}
      paddingRight={screenIsXLarge ? '16%' : '0%'}
      alignTextToBottom
    >
      <Contents>
        <RiveComponent onMouseEnter={() => rive && rive.play()} />
      </Contents>
    </ValuePropCard>
  )
}
