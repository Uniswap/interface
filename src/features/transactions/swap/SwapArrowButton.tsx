import React, { ComponentProps, useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'

type SwapArrowButtonProps = Pick<
  ComponentProps<typeof Button>,
  'disabled' | 'name' | 'onPress' | 'borderColor' | 'bg'
>

export function SwapArrowButton({
  name,
  onPress,
  disabled,
  bg = 'background1',
  ...rest
}: SwapArrowButtonProps) {
  const theme = useAppTheme()
  return useMemo(
    () => (
      <IconButton
        alignItems="center"
        alignSelf="center"
        bg={bg}
        borderColor="background3"
        borderRadius="lg"
        borderWidth={4}
        disabled={disabled}
        icon={
          <SwapArrow
            color={theme.colors.textSecondary}
            height={theme.iconSizes.md}
            width={theme.iconSizes.md}
          />
        }
        justifyContent="center"
        name={name}
        onPress={onPress}
        {...rest}
      />
    ),
    [bg, onPress, disabled, name, rest, theme.colors.textSecondary, theme.iconSizes.md]
  )
}
