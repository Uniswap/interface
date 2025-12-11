import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode } from 'react'
import type { To } from 'react-router'
import { Link } from 'react-router'
import { ClickableStyle } from 'theme/components/styles'
import { Flex, styled, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'

const InternalLinkMenuItem = deprecatedStyled(Link)`
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

export const MenuColumn = styled(Flex, {
  $md: {
    pb: '$spacing14',
  },
})

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
  if (!to) {
    return null
  }

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <Flex row centered gap="$gap12">
        {logo && logo}
        <Text data-testid={testId} variant="body3">
          {label}
        </Text>
      </Flex>
      {isActive && <Check color="$accent1" size="$icon.20" mr="$spacing12" />}
    </InternalLinkMenuItem>
  )
}
