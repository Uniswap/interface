import { forwardRef } from 'react'
import { I18nManager } from 'react-native'
import { ButtonText, withStaticProperties, type TamaguiElement } from 'tamagui'
import { useLayoutAnimationOnChange } from 'ui/src/animations'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText'
import { ThemedIcon } from 'ui/src/components/buttons/Button/components/ThemedIcon'
import { ThemedSpinningLoader } from 'ui/src/components/buttons/Button/components/ThemedSpinnerLoader'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'

const ButtonComponent = forwardRef<TamaguiElement, ButtonProps>(function Button(
  {
    children,
    icon,
    fill = true,
    shouldAnimateBetweenLoadingStates = true,
    variant = 'default',
    focusScaling = 'default',
    emphasis = 'primary',
    loading,
    disabled: propDisabled,
    ...props
  },
  ref,
) {
  useLayoutAnimationOnChange(shouldAnimateBetweenLoadingStates && loading)
  const disabled = (propDisabled || loading) ?? false

  // If RTL, swap icon position from what is passed in
  // the default is 'before'
  // In RTL, 'before' means 'after', and 'after' means 'before'
  const iconPosition = I18nManager.isRTL
    ? !props.iconPosition || props.iconPosition === 'before'
      ? 'after'
      : 'before'
    : props.iconPosition

  return (
    <CustomButtonFrame
      ref={ref}
      containerType="normal"
      group="item"
      fill={fill}
      focusScaling={focusScaling}
      emphasis={emphasis}
      variant={variant}
      {...props}
      iconPosition={iconPosition}
      disabled={disabled}
    >
      <ThemedIcon disabled={disabled} emphasis={emphasis} size={props.size} variant={variant}>
        {loading ? undefined : icon}
      </ThemedIcon>

      {/* `iconPosition` takes care of setting flexDirection: 'row' | 'row-reverse', so we don't need to worry about it here */}
      {loading ? (
        <ThemedSpinningLoader disabled={disabled} emphasis={emphasis} size={props.size} variant={variant} />
      ) : null}

      <CustomButtonText>{children}</CustomButtonText>
    </CustomButtonFrame>
  )
})

export const Button = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
})
