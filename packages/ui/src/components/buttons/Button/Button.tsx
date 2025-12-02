import { forwardRef } from 'react'
import { type TamaguiElement, withStaticProperties } from 'tamagui'
import { useLayoutAnimationOnChange } from 'ui/src/animations'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/CustomButtonFrame'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText/CustomButtonText'
import { ThemedIcon } from 'ui/src/components/buttons/Button/components/ThemedIcon'
import { ThemedSpinningLoader } from 'ui/src/components/buttons/Button/components/ThemedSpinnerLoader'
import { useIsStringOrTransTag } from 'ui/src/components/buttons/Button/hooks/useIsStringOrTransTag'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { getIconPosition } from 'ui/src/components/buttons/Button/utils/getIconPosition'
import { getIsButtonDisabled } from 'ui/src/components/buttons/Button/utils/getIsButtonDisabled'

const ButtonComponent = forwardRef<TamaguiElement, ButtonProps>(function Button(
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
    isDisabled: propDisabled,
    onPress,
    ...props
  },
  ref,
) {
  useLayoutAnimationOnChange(shouldAnimateBetweenLoadingStates ? loading : false)

  // This is responsible for the disabled UI state of the button
  // If `onDisabledPress` is provided, though, the button will be interactive even when disabled
  const isDisabled = getIsButtonDisabled({ isDisabled: propDisabled, loading })
  const handleOnPress = isDisabled ? (props.onDisabledPress ? props.onDisabledPress : undefined) : onPress
  const iconPosition = getIconPosition(propIconPosition)

  // We need to check if the children is a string, a Trans tag, or a custom component that likely renders a Trans tag, in which case we will pass it as a child to the `CustomButtonText` component
  const isStringOrTransTag = useIsStringOrTransTag(children)
  const customBackgroundColor = props.backgroundColor

  return (
    <CustomButtonFrame
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
      <ThemedIcon
        custom-background-color={customBackgroundColor}
        isDisabled={isDisabled}
        emphasis={emphasis}
        size={size}
        variant={variant}
        typeOfButton="button"
      >
        {loading ? undefined : icon}
      </ThemedIcon>

      {/* `iconPosition` takes care of setting flexDirection: 'row' | 'row-reverse', so we don't need to worry about it here */}
      {loading ? (
        <ThemedSpinningLoader
          isDisabled={isDisabled}
          emphasis={emphasis}
          size={size}
          variant={variant}
          typeOfButton="button"
        />
      ) : null}

      {isStringOrTransTag ? (
        <CustomButtonText line-height-disabled={lineHeightDisabled.toString()}>{children}</CustomButtonText>
      ) : (
        children
      )}
    </CustomButtonFrame>
  )
})

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
 * @param {boolean} [props.isDisabled=false] - Whether the button is disabled.
 * @param {string} [props.backgroundColor] - Custom background color for the button. This overrides the button's emphasis and variant. It also automatically sets, for different states, the `Button`'s default text and/or icon colors to the color that most contrasts with the `backgroundColor`.
 * @param {React.ReactNode} props.children - The content of the button. If a string, it will be automatically themed based on the button's emphasis and variant. Otherwise, to achieve the same effect, use `Button.Text` as a `child` (direct or otherwise) of `Button`
 * @param {string} [props.iconPosition] - The position of the icon in the button.
 * @param {React.Ref} [ref] - The ref to be passed to the CustomButtonFrame component.
 *
 * Props with hyphens:
 * @param {string} dd-action-name - The Datadog action name for the button.
 * @param {string} primary-color - The primary color for the button.
 *
 * @returns {JSX.Element} The rendered Button component.
 */

export const Button = withStaticProperties(ButtonComponent, {
  Text: CustomButtonText,
  Icon: ThemedIcon,
})
