import { largeIconCss, Logo } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { ReactElement, ReactNode } from 'react'

import Row from './Row'

const UniswapA = styled.a`
  cursor: pointer;

  ${Logo} {
    fill: ${({ theme }) => theme.secondary};
    height: 1.5em;
    transition: transform 0.25s ease;
    width: 1.5em;
    will-change: transform;

    :hover {
      fill: ${({ theme }) => theme.onHover(theme.secondary)};
      transform: rotate(-5deg);
    }
  }
`

const HeaderRow = styled(Row)`
  height: 1.75em;
  margin: 0 0.75em 0.75em;
  padding-top: 0.5em;
  ${largeIconCss}
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
          <UniswapA href={`https://app.uniswap.org/`}>
            <Logo />
          </UniswapA>
        )}
        {title && <ThemedText.Subhead1>{title}</ThemedText.Subhead1>}
      </Row>
      <Row gap={1}>{children}</Row>
    </HeaderRow>
  )
}
