import Logo from 'lib/assets/Logo'
import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Row from './Row'

const HeaderRow = styled(Row)<{ divider?: boolean; theme: Theme }>`
  border-bottom: 1px solid ${({ divider, theme }) => (divider ? theme.outline : 'transparent')};
  margin: 0 1em;
  padding-bottom: ${({ divider }) => (divider ? '1em' : undefined)};
  padding-top: 1em;
`

const StyledLogo = styled(Logo)`
  fill: ${({ theme }) => theme.secondary};
  mix-blend-mode: lighten;
  padding: 0 1px 3px 1px;
  transition: transform 0.3s ease;

  :hover {
    cursor: pointer;
    opacity: 0.7;
    transform: rotate(-5deg);
  }
`

export interface HeaderProps {
  title?: string
  logo?: boolean
  divider?: boolean
  children: ReactNode
}

export default function Header({ title, logo, divider, children }: HeaderProps) {
  return (
    <HeaderRow divider={divider}>
      <Row gap="0.5em">
        {logo && (
          <a href={`https://app.uniswap.org/`}>
            <StyledLogo />
          </a>
        )}
        {title && <TYPE.subhead1>{title}</TYPE.subhead1>}
      </Row>
      <Row gap="0.5em">{children}</Row>
    </HeaderRow>
  )
}
