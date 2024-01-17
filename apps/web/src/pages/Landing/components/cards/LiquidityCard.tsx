import { t } from '@lingui/macro'
import Rive, { Alignment, Fit, Layout } from '@rive-app/react-canvas'
import styled from 'styled-components'

import { Bars } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

const Contents = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;

  opacity: 1;
  @media (max-width: 768px) {
    opacity: 0;
  }
`

type LiquidityCardProps = {
  isDarkMode?: boolean
}

const primary = '#A457FF'

export function LiquidityCard(props: LiquidityCardProps) {
  return (
    <ValuePropCard
      tagText="Provide Liquidity"
      href="https://app.uniswap.org/pools"
      height="320px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(164, 87, 255, 0.15)', light: 'rgba(164, 87, 255, 0.15)' }}
      button={<PillButton color={primary} label="Liquidity" icon={<Bars size="24px" fill={primary} />} />}
      titleText={t`Provide liquidity to pools on the Uniswap protocol and earn fees on swaps.`}
      paddingRight="15%"
    >
      <Contents>
        <Rive
          style={{ width: '500px', height: '100%' }}
          src="/rive/landingPageAnimations.riv"
          artboard="LP"
          animations="HoverAnimation"
          layout={
            new Layout({
              fit: Fit.Contain,
              alignment: Alignment.CenterRight,
            })
          }
        />
      </Contents>
    </ValuePropCard>
  )
}
