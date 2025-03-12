import { Children, ReactNode, forwardRef, isValidElement, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { I18nManager } from 'react-native'
import { withStaticProperties, type TamaguiElement } from 'tamagui'
import { useLayoutAnimationOnChange } from 'ui/src/animations'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText'
import { ThemedIcon } from 'ui/src/components/buttons/Button/components/ThemedIcon'
import { ThemedSpinningLoader } from 'ui/src/components/buttons/Button/components/ThemedSpinnerLoader'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { getIsButtonDisabled } from 'ui/src/components/buttons/Button/utils/getIsButtonDisabled'
import { Flex } from 'ui/src/components/layout/Flex'
// Function to check if a child is either a direct Trans component or if it's a function component that resolves to render Trans
const hasDirectOrResolvedTransChild = (child: ReactNode): boolean => {
  if (!isValidElement(child)) {
    return false // Not a valid React element (e.g., plain text or null)
  }

  // Case 1: Direct match with Trans
  if (child.type === Trans) {
    return true
  }

  // Generic Case 2: We expect `Flex` to be the direct child of `Button`
  if (child.type === Flex) {
    return false
  }

  // Case 3: Everything else
  return true
}

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

  // If RTL, swap icon position from what is passed in
  // the default is 'before'
  // In RTL, 'before' means 'after', and 'after' means 'before'
  const iconPosition: ButtonProps['iconPosition'] = I18nManager.isRTL
    ? propIconPosition === 'before'
      ? 'after'
      : 'before'
    : propIconPosition

  // We need to check if the children is a string, a Trans tag, or a custom component that likely renders a Trans tag, in which case we will pass it as a child to the `CustomButtonText` component
  const arrayedChildren = useMemo(() => Children.toArray(children), [children])
  const numberOfArrayedChildren = Children.count(children)
  const firstChild = arrayedChildren[0]

  const isChildrenAString = typeof children === 'string'

  const isStringOrTransTag = useMemo(() => {
    if (isChildrenAString) {
      return true
    }

    return numberOfArrayedChildren === 1 && hasDirectOrResolvedTransChild(firstChild)
  }, [isChildrenAString, numberOfArrayedChildren, firstChild])

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
      {...props}
    >
      <ThemedIcon isDisabled={isDisabled} emphasis={emphasis} size={size} variant={variant} typeOfButton="button">
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
        <CustomButtonText customBackgroundColor={props.backgroundColor}>{children}</CustomButtonText>
      ) : (
        children
      )}
    </CustomButtonFrame>
  )
})

export const Button = withStaticProperties(ButtonComponent, {
  Text: CustomButtonText,
  Icon: ThemedIcon,
})
