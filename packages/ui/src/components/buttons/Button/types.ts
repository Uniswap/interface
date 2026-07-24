import type { GetProps } from 'tamagui'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/CustomButtonFrame'
import type { FlexProps } from 'ui/src/components/layout'

export type ButtonVariant = 'default' | 'branded' | 'critical' | 'warning'
export type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary' | 'text-only'

type ButtonSize = 'xxsmall' | 'xsmall' | 'small' | 'medium' | 'large'
type CustomButtonFrameProps = GetProps<typeof CustomButtonFrame>

export type ButtonVariantProps = {
  size?: ButtonSize
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  // This prevents trimming the string, when the language has special characters (i.e. Vietnamese)
  lineHeightDisabled?: boolean
  // Internal styling flag, threaded to the inner text/icon via `buttonStyledContext`.
  // Intentionally named differently from Tamagui's built-in `disabled` prop: Tamagui derives its
  // disabled state (which detaches hover/press/focus handling) from the raw `disabled` prop, so a
  // styling variant with the same name can't represent a button that looks disabled but stays
  // interactive (see `onDisabledPress`). Consumers use the public `disabled` prop on `ButtonProps`.
  isDisabled?: boolean
  // Used for automatically setting the text color to the color that most contrasts with the custom background color provided
  'custom-background-color'?: FlexProps['backgroundColor']
}

export type ButtonProps = Omit<CustomButtonFrameProps, 'variant' | 'disabled' | 'isDisabled'> &
  Omit<ButtonVariantProps, 'isDisabled'> & {
    /**
     * add icon before or after, passes color and size automatically if it's a Component
     */
    icon?: JSX.Element
    /**
     * Will display a spinning loader instead of the button text
     * Color will be the same as the button text
     * Button will not be interactive
     */
    loading?: boolean
    /**
     * Whether to apply a LayoutAnimation when the loading state changes
     */
    shouldAnimateBetweenLoadingStates?: boolean
    /**
     * Whether the button is disabled
     * Displays the disabled UI state and, unless `onDisabledPress` is provided, blocks interaction
     */
    disabled?: boolean
    /**
     * The Datadog action name for the button
     */
    'dd-action-name'?: string
    /**
     * Callback function to be called when the button is disabled
     */
    onDisabledPress?: CustomButtonFrameProps['onPress']
  }
