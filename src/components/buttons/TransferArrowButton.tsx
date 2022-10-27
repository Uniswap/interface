import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'name' | 'onPress' | 'borderColor' | 'bg'
>

export function TransferArrowButton({
  name,
  onPress,
  disabled,
  bg = 'background1',
  ...rest
}: ArrowDownButtonProps) {
  const theme = useAppTheme()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      bg={bg}
      borderColor="background1"
      borderRadius="lg"
      borderWidth={4}
      disabled={disabled}
      justifyContent="center"
      name={name}
      p="xs"
      onPress={onPress}
      {...rest}>
      <Arrow color={theme.colors.textSecondary} direction="s" size={ICON_SIZE} />
    </TouchableArea>
  )
}
