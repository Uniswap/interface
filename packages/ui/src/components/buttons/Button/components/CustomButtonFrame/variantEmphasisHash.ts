import { XStackProps } from 'tamagui'
import {
  brandedFocusVisibleStyle,
  criticalFocusVisibleStyle,
  defaultFocusVisibleStyle,
  warningFocusVisibleStyle,
} from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'
import { withCommonPressStyle } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/utils'
import type { ButtonEmphasis, ButtonVariant } from 'ui/src/components/buttons/Button/types'

type ButtonStyleLookup = {
  [variant in ButtonVariant]: {
    [emphasis in ButtonEmphasis]: Pick<
      XStackProps,
      'backgroundColor' | 'borderColor' | 'hoverStyle' | 'focusVisibleStyle' | 'pressStyle'
    >
  }
}

export const variantEmphasisHash: ButtonStyleLookup = {
  default: {
    primary: {
      backgroundColor: '$accent3',
      hoverStyle: {
        backgroundColor: '$accent3Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$accent3Hovered',
        ...defaultFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$accent3Hovered',
      }),
    },
    secondary: {
      backgroundColor: '$surface3',
      hoverStyle: {
        backgroundColor: '$surface3Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$surface3Hovered',
        ...defaultFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$surface3Hovered',
      }),
    },
    tertiary: {
      borderColor: '$surface3',
      hoverStyle: {
        borderColor: '$surface3Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$surface1',
        ...defaultFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        borderColor: '$surface3Hovered',
      }),
    },
    'text-only': {
      borderColor: '$transparent',
      focusVisibleStyle: defaultFocusVisibleStyle,
      pressStyle: withCommonPressStyle({
        borderColor: '$transparent',
      }),
    },
  },
  branded: {
    primary: {
      backgroundColor: '$accent1',
      hoverStyle: {
        backgroundColor: '$accent1Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$accent1Hovered',
        ...brandedFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$accent1Hovered',
      }),
    },
    secondary: {
      backgroundColor: '$accent2',
      hoverStyle: {
        backgroundColor: '$accent2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$accent2Hovered',
        ...brandedFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$accent2Hovered',
      }),
    },
    tertiary: {
      borderColor: '$accent2',
      hoverStyle: {
        borderColor: '$accent2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$surface1',
        ...brandedFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        borderColor: '$accent2Hovered',
      }),
    },
    'text-only': {
      borderColor: '$transparent',
      backgroundColor: '$transparent',
      focusVisibleStyle: {
        backgroundColor: '$surface1',
        ...brandedFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        borderColor: '$transparent',
      }),
    },
  },
  critical: {
    primary: {
      backgroundColor: '$statusCritical',
      hoverStyle: {
        backgroundColor: '$statusCriticalHovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$statusCriticalHovered',
        ...criticalFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$statusCriticalHovered',
      }),
    },
    secondary: {
      backgroundColor: '$statusCritical2',
      hoverStyle: {
        backgroundColor: '$statusCritical2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$statusCritical2Hovered',
        ...criticalFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$statusCritical2Hovered',
      }),
    },
    tertiary: {
      borderColor: '$statusCritical2',
      hoverStyle: {
        borderColor: '$statusCritical2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$surface1',
        ...criticalFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        borderColor: '$statusCritical2Hovered',
      }),
    },
    'text-only': {
      borderColor: '$transparent',
      focusVisibleStyle: criticalFocusVisibleStyle,
      pressStyle: withCommonPressStyle({
        borderColor: '$transparent',
      }),
    },
  },
  warning: {
    primary: {
      backgroundColor: '$statusWarning',
      hoverStyle: {
        backgroundColor: '$statusWarningHovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$statusWarningHovered',
        ...warningFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$statusWarningHovered',
      }),
    },
    secondary: {
      backgroundColor: '$statusWarning2',
      hoverStyle: {
        backgroundColor: '$statusWarning2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$statusWarning2Hovered',
        ...warningFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        backgroundColor: '$statusWarning2Hovered',
      }),
    },
    tertiary: {
      borderColor: '$statusWarning2',
      hoverStyle: {
        borderColor: '$statusWarning2Hovered',
      },
      focusVisibleStyle: {
        backgroundColor: '$surface1',
        ...warningFocusVisibleStyle,
      },
      pressStyle: withCommonPressStyle({
        borderColor: '$statusWarning2Hovered',
      }),
    },
    'text-only': {
      borderColor: '$transparent',
      focusVisibleStyle: warningFocusVisibleStyle,
      pressStyle: withCommonPressStyle({
        borderColor: '$transparent',
      }),
    },
  },
}
