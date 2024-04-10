import { t } from '@lingui/macro'
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useScreenSize } from 'hooks/useScreenSize'
import styled from 'styled-components'

import { CodeBrackets } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

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
    opacity: 0.32;
  }
  @media (max-width: 768px) {
    opacity: 0;
  }
`

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#00C3A0'

export function DocumentationCard(props: WebappCardProps) {
  const { rive, RiveComponent } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Dev',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.CenterRight }),
  })

  const isScreenSize = useScreenSize()
  const screenIsLarge = isScreenSize['lg']
  const screenIsXLarge = isScreenSize['xl']

  return (
    <ValuePropCard
      height={screenIsLarge ? '340px' : '240px'}
      href="https://docs.uniswap.org/"
      backgroundColor={{ dark: 'rgba(0, 195, 160, 0.08);', light: 'rgba(0, 195, 160, 0.06);' }}
      isDarkMode={props.isDarkMode}
      textColor={primary}
      button={
        <PillButton color={primary} label={t`Developer docs`} icon={<CodeBrackets size="24px" fill={primary} />} />
      }
      titleText={t`Build the next generation of open applications and tools.`}
      paddingRight={screenIsXLarge ? '16%' : '0%'}
      alignTextToBottom
    >
      <Contents>
        <RiveComponent onMouseEnter={() => rive && rive.play()} />
      </Contents>
    </ValuePropCard>
  )
}
