import styled, { Color, Theme } from 'lib/theme'

export const BaseButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  color: currentColor;
  cursor: pointer;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;
`

export default styled(BaseButton)<{ color?: Color; theme: Theme }>`
  background-color: ${({ color = 'interactive', theme }) => theme[color]};

  :enabled:hover {
    background-color: ${({ color = 'interactive', theme }) => theme.onHover(theme[color])};
  }

  :disabled {
    cursor: not-allowed;
  }
`

const transparentButtonWithColor = (color: Color) => styled(BaseButton)`
  color: ${({ theme }) => theme[color]};

  :hover {
    color: ${({ theme }) => theme.onHover(theme[color])};
  }
`

export const TextButton = transparentButtonWithColor('accent')
export const IconButton = transparentButtonWithColor('secondary')
