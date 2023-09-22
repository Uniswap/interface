import Column from 'components/Column'
import Row from 'components/Row'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import type { To } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}

  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral1};
`

export const MenuColumn = styled(Column)`
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    padding-bottom: 14px;
  }
`

export function MenuItem({
  label,
  logo,
  to,
  onClick,
  isActive,
  testId,
}: {
  label: ReactNode
  logo?: ReactNode
  to?: To
  onClick?: () => void
  isActive: boolean
  testId?: string
}) {
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <Row gap="md">
        {logo && logo}
        <ThemedText.BodySmall data-testid={testId}>{label}</ThemedText.BodySmall>
      </Row>
      {isActive && <Check color={theme.accent1} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}
