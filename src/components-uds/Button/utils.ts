import { ButtonEmphasis, ButtonSize } from 'src/components-uds/Button/Button'
import { Theme } from 'src/styles/theme'

function getButtonColor(emphasis: ButtonEmphasis): keyof Theme['colors'] {
  switch (emphasis) {
    case ButtonEmphasis.Primary:
      return 'userThemeMagenta'
    case ButtonEmphasis.Secondary:
      return 'background3'
    case ButtonEmphasis.Tertiary:
      return 'none'
    case ButtonEmphasis.Detrimental:
      return 'accentCriticalSoft'
    case ButtonEmphasis.Warning:
      return 'accentWarningSoft'
  }
}

function getButtonTextColor(emphasis: ButtonEmphasis): keyof Theme['colors'] {
  switch (emphasis) {
    case ButtonEmphasis.Primary:
      return 'white'
    case ButtonEmphasis.Secondary:
    case ButtonEmphasis.Tertiary:
      return 'textPrimary'
    case ButtonEmphasis.Detrimental:
      return 'accentCritical'
    case ButtonEmphasis.Warning:
      return 'accentWarning'
  }
}

function getButtonBorderColor(emphasis: ButtonEmphasis): keyof Theme['colors'] {
  const buttonColor = getButtonColor(emphasis)
  switch (emphasis) {
    case ButtonEmphasis.Tertiary:
      return 'backgroundOutline'
    default:
      return buttonColor
  }
}

function getButtonTextSizeVariant(size: ButtonSize): keyof Theme['textVariants'] {
  switch (size) {
    case ButtonSize.Large:
      return 'buttonLabelLarge'
    case ButtonSize.Medium:
      return 'buttonLabelMedium'
    case ButtonSize.Small:
      return 'buttonLabelSmall'
  }
}

function getButtonPaddingY(size: ButtonSize): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'md'
    case ButtonSize.Medium:
      return 'sm'
    case ButtonSize.Small:
      return 'xs'
  }
}

function getButtonPaddingX(size: ButtonSize): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'md'
    case ButtonSize.Medium:
      return 'sm'
    case ButtonSize.Small:
      return 'xs'
  }
}

function getButtonIconPadding(size: ButtonSize): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'sm'
    case ButtonSize.Medium:
      return 'xs'
    case ButtonSize.Small:
      return 'xxs'
  }
}

function getButtonBorderRadius(size: ButtonSize): keyof Theme['borderRadii'] {
  switch (size) {
    case ButtonSize.Large:
      return 'lg'
    case ButtonSize.Medium:
      return 'md'
    case ButtonSize.Small:
      return 'sm'
  }
}

function getButtonIconSize(size: ButtonSize): keyof Theme['iconSizes'] {
  switch (size) {
    case ButtonSize.Large:
      return 'lg'
    case ButtonSize.Medium:
      return 'md'
    case ButtonSize.Small:
      return 'sm'
  }
}

export function getButtonProperties(
  emphasis: ButtonEmphasis,
  size: ButtonSize
): {
  backgroundColor: keyof Theme['colors']
  textColor: keyof Theme['colors']
  textVariant: keyof Theme['textVariants']
  paddingX: keyof Theme['spacing']
  paddingY: keyof Theme['spacing']
  borderRadius: keyof Theme['borderRadii']
  borderColor: keyof Theme['colors']
  iconPadding: keyof Theme['spacing']
  iconSize: keyof Theme['iconSizes']
} {
  const backgroundColor = getButtonColor(emphasis)
  const textColor = getButtonTextColor(emphasis)
  const textVariant = getButtonTextSizeVariant(size)
  const paddingX = getButtonPaddingX(size)
  const paddingY = getButtonPaddingY(size)
  const borderRadius = getButtonBorderRadius(size)
  const borderColor = getButtonBorderColor(emphasis)
  const iconPadding = getButtonIconPadding(size)
  const iconSize = getButtonIconSize(size)

  return {
    backgroundColor,
    textColor,
    textVariant,
    paddingX,
    paddingY,
    borderRadius,
    borderColor,
    iconPadding,
    iconSize,
  }
}
