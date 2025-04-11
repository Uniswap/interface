import { TextProps } from 'tamagui'
import type { ButtonEmphasis, ButtonVariant } from 'ui/src/components/buttons/Button/types'

type TextStyleLookup = {
  [variant in ButtonVariant]: {
    [emphasis in ButtonEmphasis]: Pick<TextProps, 'color' | '$group-item-hover'>
  }
}

export const variantEmphasisHash: TextStyleLookup = {
  branded: {
    primary: {
      color: '$white',
    },
    secondary: {
      color: '$accent1',
      '$group-item-hover': {
        color: '$accent1Hovered',
      },
    },
    tertiary: {
      color: '$accent1',
      '$group-item-hover': {
        color: '$accent1Hovered',
      },
    },
    'text-only': {
      color: '$accent1',
      '$group-item-hover': {
        color: '$accent1Hovered',
      },
    },
  },
  critical: {
    primary: {
      color: '$white',
    },
    secondary: {
      color: '$statusCritical',
      '$group-item-hover': {
        color: '$statusCriticalHovered',
      },
    },
    tertiary: {
      color: '$statusCritical',
      '$group-item-hover': {
        color: '$statusCriticalHovered',
      },
    },
    'text-only': {
      color: '$statusCritical',
      '$group-item-hover': {
        color: '$statusCriticalHovered',
      },
    },
  },
  warning: {
    primary: {
      color: '$surface1',
      '$group-item-hover': {
        color: '$surface1Hovered',
      },
    },
    secondary: {
      color: '$statusWarning',
      '$group-item-hover': {
        color: '$statusWarningHovered',
      },
    },
    tertiary: {
      color: '$statusWarning',
      '$group-item-hover': {
        color: '$statusWarningHovered',
      },
    },
    'text-only': {
      color: '$statusWarning',
      '$group-item-hover': {
        color: '$statusWarningHovered',
      },
    },
  },
  default: {
    primary: {
      color: '$surface1',
      '$group-item-hover': {
        color: '$surface1Hovered',
      },
    },
    secondary: {
      color: '$neutral1',
      '$group-item-hover': {
        color: '$neutral1Hovered',
      },
    },
    tertiary: {
      color: '$neutral1',
      '$group-item-hover': {
        color: '$neutral1Hovered',
      },
    },
    'text-only': {
      color: '$neutral1',
      '$group-item-hover': {
        color: '$neutral1Hovered',
      },
    },
  },
}
