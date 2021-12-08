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
  color: ${({ color, theme }) => (!color || color === 'interactive') && theme.onInteractive};
  transition: filter 0.2s;

  :enabled {
    background-color: ${({ color = 'interactive', theme }) => theme[color]};
  }

  :enabled:hover {
    background-color: ${({ color = 'interactive', theme }) => theme.onHover(theme[color])};
  }

  :disabled {
    border: 1px solid ${({ theme }) => theme.outline};
    color: ${({ theme }) => theme.secondary};
    cursor: not-allowed;
    filter: saturate(0) opacity(0.4);
  }
`

const transparentButton = (defaultColor: Color) => styled(BaseButton)<{ color?: Color; theme: Theme }>`
  color: ${({ color = defaultColor, theme }) => theme[color]};

  :enabled:hover {
    color: ${({ color = defaultColor, theme }) => theme.onHover(theme[color])};
  }
`

export const TextButton = transparentButton('accent')
export const IconButton = transparentButton('secondary')
