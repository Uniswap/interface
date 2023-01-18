import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Box } from 'src/components/layout'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'name' | 'onPress' | 'borderColor' | 'bg' | 'padding'
>

export function TransferArrowButton({
  name,
  onPress,
  disabled,
  bg = 'background1',
  padding = 'sm',
  ...rest
}: ArrowDownButtonProps): JSX.Element {
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
      // border width applies inside the element so add more padding to account for it
      p={padding}
      onPress={onPress}
      {...rest}>
      <Box alignItems="center" justifyContent="center" p="xxxs">
        <Arrow color={theme.colors.textSecondary} direction="s" size={ICON_SIZE} />
      </Box>
    </TouchableArea>
  )
}
