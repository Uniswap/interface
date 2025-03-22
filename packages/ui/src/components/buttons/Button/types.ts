import type { GetProps } from 'tamagui'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame'

type ButtonVariant = 'default' | 'branded' | 'critical'
type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary'
type ButtonSize = 'xxsmall' | 'xsmall' | 'small' | 'medium' | 'large'

type CustomButtonFrameProps = GetProps<typeof CustomButtonFrame>

export type ButtonVariantProps = {
  size?: ButtonSize
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  // TODO(WEB-6347): change variant name back to `disabled`
  isDisabled?: boolean
  singleLine?: boolean
}

// TODO(WEB-6347): don't allow people to set disabled prop until Tamagui issue resolved
export type ButtonProps = Omit<CustomButtonFrameProps, 'variant' | 'disabled'> &
  ButtonVariantProps & {
    /**
     * add icon before or after, passes color and size automatically if Component
     */
    icon?: JSX.Element
    /**
     * Will display a spinning loader instead of the button text
     * Color will be the same as the button text
     * Button will not be interactive
     */
    loading?: boolean
    /**
     * Mobile only
     * Whether to apply a LayoutAnimation when the loading state changes
     */
    shouldAnimateBetweenLoadingStates?: boolean
  }
