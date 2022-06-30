import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { Arrow } from 'src/components/icons/Arrow'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<ComponentProps<typeof Button>, 'disabled' | 'name' | 'onPress'>

export function TransferArrowButton({ name, onPress, disabled }: ArrowDownButtonProps) {
  const theme = useAppTheme()
  return (
    <IconButton
      alignItems="center"
      alignSelf="center"
      bg="backgroundSurface"
      borderColor="backgroundBackdrop"
      borderRadius="md"
      borderWidth={4}
      disabled={disabled}
      icon={<Arrow color={theme.colors.textSecondary} direction="s" size={ICON_SIZE} />}
      justifyContent="center"
      name={name}
      onPress={onPress}
    />
  )
}
