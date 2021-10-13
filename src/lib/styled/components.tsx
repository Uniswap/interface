import { Icon } from 'react-feather'

import styled, { Colors } from '.'

export function styledIcon(Icon: Icon, color = 'icon' as keyof Colors) {
  return styled(Icon)`
    height: 18px;
    width: 18px;

    > * {
      stroke: ${({ theme }) => theme[color]};
    }
  `
}

export function inlaidIcon(Icon: Icon, Inlay: Icon) {
  const StyledIcon = styledIcon(Icon)
  const StyledInlay = styled(styledIcon(Inlay))`
    background-color: ${({ theme }) => theme.bg};
    border-radius: 0.2em;
    bottom: 0;
    height: 8px;
    right: 0;
    width: 8px;
    position: absolute;
  `
  return function InlaidIcon() {
    return (
      <div style={{ position: 'relative' }}>
        <StyledIcon />
        <StyledInlay />
      </div>
    )
  }
}

export const StyledButton = styled.button`
  border: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0.5rem;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`
