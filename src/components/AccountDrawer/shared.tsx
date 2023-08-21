import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Link, To } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme'

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}

  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`

export function MenuItem({
  label,
  to,
  onClick,
  isActive,
  testId,
}: {
  label: ReactNode
  to?: To
  onClick?: () => void
  isActive: boolean
  testId?: string
}) {
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <ThemedText.BodySmall data-testid={testId}>{label}</ThemedText.BodySmall>
      {isActive && <Check color={theme.accentActive} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}
