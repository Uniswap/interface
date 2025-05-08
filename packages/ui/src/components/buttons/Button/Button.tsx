import { forwardRef } from 'react'
import { withStaticProperties, type TamaguiElement } from 'tamagui'
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
    loading,
    iconPosition: propIconPosition = 'before',
    isDisabled: propDisabled,
    ...props
  },
  ref,
) {
  useLayoutAnimationOnChange(shouldAnimateBetweenLoadingStates ? loading : false)

  const isDisabled = getIsButtonDisabled({ isDisabled: propDisabled, loading })
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
      custom-background-color={customBackgroundColor}
      dd-action-name={props['dd-action-name'] ?? (typeof children === 'string' ? children : undefined)}
      {...props}
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

      {isStringOrTransTag ? <CustomButtonText>{children}</CustomButtonText> : children}
    </CustomButtonFrame>
  )
})

export const Button = withStaticProperties(ButtonComponent, {
  Text: CustomButtonText,
  Icon: ThemedIcon,
})
