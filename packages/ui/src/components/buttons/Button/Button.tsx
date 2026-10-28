import {
  ButtonFrameCompat,
  ButtonTextCompat,
  ThemedIconCompat,
  ThemedSpinnerCompat,
} from '@universe/mycelium/button-frame-compat'
import { forwardRef, type ForwardedRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
// Deep import, not the barrel: the barrel still reaches Tamagui via AnimatePresencePager.
import { useLayoutAnimationOnChange } from 'ui/src/animations/layout/useLayoutAnimationOnChange'
import { useIsStringOrTransTag } from 'ui/src/components/buttons/Button/hooks/useIsStringOrTransTag'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { getIconPosition } from 'ui/src/components/buttons/Button/utils/getIconPosition'
import { getIsButtonDisabled } from 'ui/src/components/buttons/Button/utils/getIsButtonDisabled'

function ButtonComponent(
  {
    children,
    icon,
    fill = true,
    shouldAnimateBetweenLoadingStates = true,
    variant = 'default',
    focusScaling = 'default',
    emphasis = 'primary',
    size = 'medium',
    lineHeightDisabled = false,
    loading,
    iconPosition: propIconPosition = 'before',
    disabled: propDisabled,
    onPress,
    ...props
  }: ButtonProps,
  ref: ForwardedRef<HTMLElement>,
): JSX.Element {
  useLayoutAnimationOnChange(shouldAnimateBetweenLoadingStates ? loading : false)

  // This is responsible for the disabled UI state of the button
  // If `onDisabledPress` is provided, though, the button will be interactive even when disabled
  const isDisabled = getIsButtonDisabled({ disabled: propDisabled, loading })
  const handleOnPress = isDisabled ? (props.onDisabledPress ? props.onDisabledPress : undefined) : onPress
  const iconPosition = getIconPosition(propIconPosition)

  // We need to check if the children is a string, a Trans tag, or a custom component that likely renders a Trans tag, in which case we will pass it as a child to the `ButtonTextCompat` component
  const isStringOrTransTag = useIsStringOrTransTag(children)
  const customBackgroundColor = props.backgroundColor

  return (
    <ButtonFrameCompat
      ref={ref}
      fill={fill}
      focusScaling={focusScaling}
      emphasis={emphasis}
      variant={variant}
      size={size}
      iconPosition={iconPosition}
      isDisabled={isDisabled}
      disabled={props.onDisabledPress ? false : isDisabled}
      custom-background-color={customBackgroundColor}
      dd-action-name={props['dd-action-name'] ?? (typeof children === 'string' ? children : undefined)}
      {...props}
      onPress={handleOnPress}
    >
      <ThemedIconCompat
        custom-background-color={customBackgroundColor}
        isDisabled={isDisabled}
        emphasis={emphasis}
        size={size}
        variant={variant}
        typeOfButton="button"
      >
        {loading ? undefined : icon}
      </ThemedIconCompat>

      {/* `iconPosition` takes care of setting flexDirection: 'row' | 'row-reverse', so we don't need to worry about it here */}
      {loading ? (
        <ThemedSpinnerCompat
          isDisabled={isDisabled}
          emphasis={emphasis}
          size={size}
          variant={variant}
          typeOfButton="button"
        />
      ) : null}

      {isStringOrTransTag ? (
        <ButtonTextCompat line-height-disabled={lineHeightDisabled.toString()}>{children}</ButtonTextCompat>
      ) : (
        children
      )}
    </ButtonFrameCompat>
  )
}

// Explicit annotation: the inferred type names non-exported mycelium types (TS2883 under declaration emit).
const ButtonWithoutStatics: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLElement>> =
  forwardRef(ButtonComponent)

ButtonWithoutStatics.displayName = 'Button'

/**
 * Button component
 *
 * This component renders a customizable button with various styles and behaviors.
 *
 * @param {object} props - The properties for the Button component.
 * @param {boolean} [props.fill=true] - Whether the button should fill its container.
 * @param {string} [props.focusScaling='default'] - The scaling behavior when the button is focused.
 * @param {string} [props.emphasis='primary'] - The emphasis style of the button.
 * @param {string} [props.variant='default'] - The variant style of the button.
 * @param {string} [props.size='medium'] - The size of the button. This is also used to automatically set the size of the Icon, Text, and SpinningLoader within the button.
 * @param {JSX.Element} [props.icon] - The icon to be displayed in the button; it is automatically themed based on the button's emphasis and variant.
 * @param {boolean} [props.loading=false] - Whether the button is in a loading state. A `SpinningLoader` themed with the button's emphasis and variant will be displayed aside of the children.
 * @param {boolean} [props.shouldAnimateBetweenLoadingStates=true] - Whether to apply a LayoutAnimation when the loading state changes.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.backgroundColor] - Custom background color for the button. This overrides the button's emphasis and variant. It also automatically sets, for different states, the `Button`'s default text and/or icon colors to the color that most contrasts with the `backgroundColor`.
 * @param {React.ReactNode} props.children - The content of the button. If a string, it will be automatically themed based on the button's emphasis and variant. Otherwise, to achieve the same effect, use `Button.Text` as a `child` (direct or otherwise) of `Button`
 * @param {string} [props.iconPosition] - The position of the icon in the button.
 * @param {React.Ref} [ref] - The ref to be passed to the button frame.
 *
 * Props with hyphens:
 * @param {string} dd-action-name - The Datadog action name for the button.
 * @param {string} primary-color - The primary color for the button.
 *
 * @returns {JSX.Element} The rendered Button component.
 */
type ButtonComponentType = typeof ButtonWithoutStatics & {
  Text: typeof ButtonTextCompat
  Icon: typeof ThemedIconCompat
}

const ButtonWithStatics = ButtonWithoutStatics as ButtonComponentType
ButtonWithStatics.Text = ButtonTextCompat
ButtonWithStatics.Icon = ThemedIconCompat

export const Button = ButtonWithStatics
