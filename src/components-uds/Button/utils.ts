import { ReactElement } from 'react'
import {
  ButtonEmphasis,
  ButtonProps,
  ButtonSize,
  ButtonType,
} from 'src/components-uds/Button/Button'
import { Theme } from 'src/styles/theme'

export function getButtonType(
  label: string | undefined,
  icon: ReactElement | undefined
): ButtonType {
  if (!!icon && !!label) {
    return ButtonType.Regular
  } else if (!!icon && !label) {
    return ButtonType.Icon
  } else {
    return ButtonType.Label
  }
}

export function getButtonColor(emphasis: ButtonProps['emphasis']): keyof Theme['colors'] {
  switch (emphasis) {
    case ButtonEmphasis.High:
      return 'accentAction'
    case ButtonEmphasis.Medium:
      return 'backgroundAction'
    case ButtonEmphasis.Low:
      return 'none'
    case ButtonEmphasis.Destructive:
      return 'accentFailureSoft'
    case ButtonEmphasis.Warning:
      return 'accentWarningSoft'
    default:
      return 'accentAction'
  }
}

export function getButtonTextColor(emphasis: ButtonProps['emphasis']): keyof Theme['colors'] {
  switch (emphasis) {
    case ButtonEmphasis.High:
    case ButtonEmphasis.Medium:
    case ButtonEmphasis.Low:
      return 'textPrimary'
    case ButtonEmphasis.Destructive:
      return 'accentFailure'
    case ButtonEmphasis.Warning:
      return 'accentWarning'
    default:
      return 'accentAction'
  }
}

export function getButtonTextSizeVariant(size: ButtonSize): keyof Theme['textVariants'] {
  switch (size) {
    case ButtonSize.Large:
      return 'buttonLabelLarge'
    case ButtonSize.Medium:
      return 'buttonLabelMedium'
    case ButtonSize.Small:
      return 'buttonLabelSmall'
    default:
      return 'buttonLabelMedium'
  }
}

export function getButtonPaddingY(size: ButtonProps['size']): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'md'
    case ButtonSize.Medium:
      return 'sm'
    case ButtonSize.Small:
      return 'xs'
    default:
      return 'md'
  }
}

export function getButtonPaddingX(
  size: ButtonProps['size'],
  type: ButtonType
): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'md'
    case ButtonSize.Medium:
      switch (type) {
        case ButtonType.Icon:
          // for buttons that are Medium size with an icon but no label, the X padding is smaller
          return 'sm'
        case ButtonType.Label:
        case ButtonType.Regular:
          return 'md'
        default:
          return 'md'
      }
    case ButtonSize.Small:
      return 'xs'
    default:
      return 'sm'
  }
}

export function getButtonBorderRadius(
  size: ButtonProps['size'],
  type: ButtonType
): keyof Theme['borderRadii'] {
  if (type === ButtonType.Icon) return 'md'
  if (size === ButtonSize.Large) return 'lg'

  return 'md'
}
