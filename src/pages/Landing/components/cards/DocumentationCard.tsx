import styled from 'styled-components'

import { Bars } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#1DA16A'

export function DocumentationCard(props: WebappCardProps) {
  return (
    <ValuePropCard
      height="320px"
      href="https://docs.uniswap.org/"
      backgroundColor={{ dark: 'rgba(22, 222, 139, 0.12)', light: 'rgba(22, 222, 139, 0.06)' }}
      isDarkMode={props.isDarkMode}
      textColor={primary}
      button={<PillButton color={primary} label="Developer docs" icon={<Bars size="24px" fill={primary} />} />}
      titleText="Build open apps and tools that you want to see in the world."
      paddingRight="15%"
    >
      <Anim />
    </ValuePropCard>
  )
}

const Anim = styled.div`
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
