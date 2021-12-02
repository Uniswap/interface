import Logo from 'lib/assets/Logo'
import styled, { ThemedText } from 'lib/theme'
import { ReactElement, ReactNode } from 'react'

import Row from './Row'

const HeaderRow = styled(Row)`
  margin: 0 0.75em;
  padding-top: 0.75em;
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
  title?: ReactElement
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
        {title && <ThemedText.Subhead1 userSelect="none">{title}</ThemedText.Subhead1>}
      </Row>
      <Row gap={0.5}>{children}</Row>
    </HeaderRow>
  )
}
