import { FlexProps } from 'ui/src'

export const ClickableTamaguiStyle = {
  cursor: 'pointer',
  '$platform-web': {
    textDecoration: 'none',
    transitionDuration: '0.2s',
    textDecorationLine: 'none',
  },
  hoverStyle: {
    opacity: 0.8,
  },
  pressStyle: {
    opacity: 0.6,
  },
  // Tamagui bug. Animation property breaks theme value transition, must use style instead
  style: { transition: '100ms' },
} satisfies FlexProps
