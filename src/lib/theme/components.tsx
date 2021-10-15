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
  border: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0.5em;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`
