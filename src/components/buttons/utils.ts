import { ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
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
  switch (emphasis) {
    case ButtonEmphasis.Tertiary:
      return 'backgroundOutline'
    default:
      return 'none'
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
      return 'spacing16'
    case ButtonSize.Medium:
      return 'spacing12'
    case ButtonSize.Small:
      return 'spacing8'
  }
}

function getButtonPaddingX(size: ButtonSize): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'spacing16'
    case ButtonSize.Medium:
      return 'spacing12'
    case ButtonSize.Small:
      return 'spacing8'
  }
}

function getButtonIconPadding(size: ButtonSize): keyof Theme['spacing'] {
  switch (size) {
    case ButtonSize.Large:
      return 'spacing12'
    case ButtonSize.Medium:
      return 'spacing8'
    case ButtonSize.Small:
      return 'spacing4'
  }
}

function getButtonBorderRadius(size: ButtonSize): keyof Theme['borderRadii'] {
  switch (size) {
    case ButtonSize.Large:
      return 'rounded16'
    case ButtonSize.Medium:
      return 'rounded12'
    case ButtonSize.Small:
      return 'rounded8'
  }
}

function getButtonIconSize(size: ButtonSize): keyof Theme['iconSizes'] {
  switch (size) {
    case ButtonSize.Large:
      return 'icon24'
    case ButtonSize.Medium:
      return 'icon20'
    case ButtonSize.Small:
      return 'icon16'
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
  const borderColor = getButtonBorderColor(emphasis)
  const borderRadius = getButtonBorderRadius(size)
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
