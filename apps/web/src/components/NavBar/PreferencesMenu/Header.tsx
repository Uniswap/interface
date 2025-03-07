import styled, { css } from 'lib/styled-components'
import { ReactNode, useCallback } from 'react'
import { ChevronLeft } from 'react-feather'
import { Text } from 'ui/src'

const StyledChevron = styled(ChevronLeft)`
  opacity: 0.8;
`
const ClickableHeader = css`
  cursor: pointer;
  &:hover {
    ${StyledChevron} {
      opacity: 0.6;
    }
  }
`
const Header = styled.div<{ $clickable: boolean }>`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 0;
  ${({ $clickable }) => $clickable && ClickableHeader}
`

interface TPreferencesHeaderProps {
  children: ReactNode
  onExitMenu?: () => void
}

export function PreferencesHeader({ children, onExitMenu }: TPreferencesHeaderProps) {
  const exitMenu = useCallback(() => {
    if (onExitMenu) {
      onExitMenu()
    }
  }, [onExitMenu])

  return (
    <Header $clickable={!!onExitMenu} onClick={exitMenu}>
      {onExitMenu && <StyledChevron />}
      <Text variant="subheading1" color="$neutral1" textAlign="left" width="100%">
        {children}
      </Text>
    </Header>
  )
}
