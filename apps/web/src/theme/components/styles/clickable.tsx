// TODO(INFRA-4485): Duplicates mycelium. Use `TouchableArea` or `clickableStyle` from `@universe/mycelium` instead.
// `as const` on purpose: the legacy `FlexProps` this satisfied is deleted with the tamagui
// barrel cleanup, and the compat props don't declare this `$platform-web` slice; the literal
// types keep every spread site checking exactly as before.
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
} as const
