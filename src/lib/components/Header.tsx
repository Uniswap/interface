import Logo from 'lib/assets/Logo'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Row from './Row'

const HeaderRow = styled(Row)`
  margin: 0 1em;
  padding-top: 1em;
`

const StyledLogo = styled(Logo)`
  cursor: pointer;
  fill: ${({ theme }) => theme.secondary};
  height: 1em;
  mix-blend-mode: lighten;
  transition: transform 0.3s ease;
  width: 1em;

  :hover {
    opacity: 0.7;
    transform: rotate(-5deg);
  }
`

export interface HeaderProps {
  title?: string
  logo?: boolean
  children: ReactNode
}

export default function Header({ title, logo, children }: HeaderProps) {
  return (
    <HeaderRow>
      <Row gap={0.5}>
        {logo && (
          <a href={`https://app.uniswap.org/`}>
            <StyledLogo />
          </a>
        )}
        {title && <TYPE.subhead1 userSelect="none">{title}</TYPE.subhead1>}
      </Row>
      <Row gap={0.5}>{children}</Row>
    </HeaderRow>
  )
}
