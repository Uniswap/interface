import { Icon } from 'react-feather'

import styled, { Color } from '.'

export function styledIcon(Icon: Icon, color = 'secondary' as Color) {
  return styled(Icon)`
    height: 16px;
    width: 16px;

    > * {
      stroke: ${({ theme }) => theme[color]};
    }
  `
}

export const StyledButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  cursor: pointer;
  padding: 0;

  :hover {
    opacity: 0.7;
  }
`
