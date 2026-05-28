import { forwardRef } from 'react'
import { styled, type TamaguiElement } from 'tamagui'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/CustomButtonFrame'
import { ThemedIcon } from 'ui/src/components/buttons/Button/components/ThemedIcon'
import { ThemedSpinningLoader } from 'ui/src/components/buttons/Button/components/ThemedSpinnerLoader'
import { useButtonAnimationOnChange } from 'ui/src/components/buttons/Button/hooks/useButtonAnimationOnChange'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { getIsButtonDisabled } from 'ui/src/components/buttons/Button/utils/getIsButtonDisabled'

// Helper to omit keys from a type that have a certain string (lowercased) in the name
type OmitIncludingToLowercase<T, Str extends string> = {
  [K in keyof T as K extends string
    ? Lowercase<K> extends `${string}${Lowercase<Str>}${string}`
      ? never
      : K
    : never]: T[K]
}

// For example, this includes `minHeight` as well as `height` (as well as ~60 other props)
type OmittedButtonProps = OmitIncludingToLowercase<ButtonProps, 'flex' | 'icon' | 'size' | 'height' | 'width'>

export type IconButtonProps = {
  icon: Required<ButtonProps['icon']>
  size?: ButtonProps['size']
} & OmittedButtonProps

const IconButtonFrame = styled(CustomButtonFrame, {
  variants: {
    size: {
      xxsmall: {
        p: '$spacing6',
        borderRadius: '$rounded12',
      },
      xsmall: {
        p: '$spacing8',
        borderRadius: '$rounded12',
      },
      small: {
        p: '$spacing8',
        borderRadius: '$rounded12',
      },
      medium: {
        p: '$spacing12',
        borderRadius: '$rounded16',
      },
      large: {
        p: '$spacing16',
        borderRadius: '$rounded20',
      },
    },
  } as const,
})

IconButtonFrame.displayName = 'IconButtonFrame'

export const IconButton = forwardRef<TamaguiElement, IconButtonProps>(function IconButton(
  {
    icon,
    shouldAnimateBetweenLoadingStates = true,
    loading,
    isDisabled: propDisabled,
    size = 'medium',
    variant = 'default',
    emphasis = 'primary',
    focusScaling = 'equal:smaller-button',
    ...props
  },
  ref,
) {
  useButtonAnimationOnChange({
    shouldAnimateBetweenLoadingStates,
    loading,
  })

  const isDisabled = getIsButtonDisabled({ isDisabled: propDisabled, loading })

  return (
    <IconButtonFrame
      ref={ref}
      fill={false}
      isDisabled={isDisabled}
      size={size}
      variant={variant}
      emphasis={emphasis}
      focusScaling={focusScaling}
      {...props}
    >
      <ThemedIcon isDisabled={isDisabled} emphasis={emphasis} size={size} variant={variant} typeOfButton="icon">
        {loading ? undefined : icon}
      </ThemedIcon>

      {loading ? (
        <ThemedSpinningLoader
          isDisabled={isDisabled}
          emphasis={emphasis}
          size={size}
          variant={variant}
          typeOfButton="icon"
        />
      ) : null}
    </IconButtonFrame>
  )
})
