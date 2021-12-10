import { largeIconCss, Logo } from 'lib/icons'
import styled, { Color, ThemedText } from 'lib/theme'
import { ReactElement, ReactNode } from 'react'

import Row from './Row'

const StyledLogo = styled(Logo)<{ color: Color }>`
  cursor: pointer;
  fill: ${({ color, theme }) => theme[color]};
  transition: transform 0.3s ease;

  :hover {
    fill: ${({ color, theme }) => theme.onHover(theme[color])};
    transform: rotate(-5deg);
  }
`

const HeaderRow = styled(Row)`
  height: 2em;
  margin: 0 0.75em;
  padding-top: 0.5em;
  ${largeIconCss}

  ${StyledLogo} {
    height: 1.5em;
    width: 1.5em;
  }
`

export interface HeaderProps {
  title?: ReactElement
  logo?: boolean
  children: ReactNode
}

export default function Header({ title, logo, children }: HeaderProps) {
  return (
    <HeaderRow iconSize={1.2}>
      <Row gap={0.5}>
        {logo && (
          <a href={`https://app.uniswap.org/`}>
            <StyledLogo color="secondary" />
          </a>
        )}
        {title && <ThemedText.Subhead1>{title}</ThemedText.Subhead1>}
      </Row>
      <Row gap={1}>{children}</Row>
    </HeaderRow>
  )
}
