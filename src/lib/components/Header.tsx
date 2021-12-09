import Logo from 'lib/assets/Logo'
import styled, { Color, ThemedText } from 'lib/theme'
import { ReactElement, ReactNode } from 'react'

import Row from './Row'

const HeaderRow = styled(Row)`
  margin: 0 0.75em;
  padding-top: 0.75em;
`

const StyledLogo = styled(Logo)<{ color: Color }>`
  cursor: pointer;
  fill: ${({ color, theme }) => theme[color]};
  height: 1em;
  transition: transform 0.3s ease;
  width: 1em;

  :hover {
    fill: ${({ color, theme }) => theme.onHover(theme[color])};
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
            <StyledLogo color="secondary" />
          </a>
        )}
        {title && <ThemedText.Subhead1 userSelect="none">{title}</ThemedText.Subhead1>}
      </Row>
      <Row gap={0.5}>{children}</Row>
    </HeaderRow>
  )
}
