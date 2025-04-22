import { css } from 'lib/styled-components'
import { FlexProps, TextProps } from 'ui/src'

/** @deprecated use tamagui and ClickableTamaguiStyle instead */
export const ClickableStyle = css`
  text-decoration: none;
  cursor: pointer;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  :active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`
export const ClickableTamaguiStyle = {
  cursor: 'pointer',
  '$platform-web': {
    textDecoration: 'none',
    transitionDuration: '0.2s',
  },
  hoverStyle: {
    opacity: 0.8,
  },
  pressStyle: {
    opacity: 0.6,
  },
} satisfies FlexProps

export const TamaguiClickableStyle = {
  textDecorationLine: 'none',
  cursor: 'pointer',
  // Tamagui bug. Animation property breaks theme value transition, must use style instead
  style: { transition: '100ms' },
  hoverStyle: {
    opacity: 0.6,
  },
} satisfies TextProps
