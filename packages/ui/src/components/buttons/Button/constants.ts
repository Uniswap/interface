import { createStyledContext, type GetThemeValueForKey } from 'tamagui'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'

// this ensures that the variant can be passed to the frame but will also thread down to the inner text
export const buttonStyledContext = createStyledContext<ButtonVariantProps>({
  size: 'medium',
  variant: 'default',
  emphasis: 'primary',
  isDisabled: false,
  'custom-background-color': undefined,
})

export const lineHeights = {
  xxsmall: '$micro',
  xsmall: '$small',
  small: '$small',
  medium: '$large',
  large: '$large',
} satisfies Record<Required<ButtonVariantProps>['size'], GetThemeValueForKey<'lineHeight'>>

export const lineHeightFallbacks: Record<'$micro' | '$small' | '$medium' | '$large', number> = {
  $micro: 16,
  $small: 16,
  $medium: 20,
  $large: 24,
} as const
