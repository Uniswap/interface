import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Box } from 'src/components/layout'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'onPress' | 'borderColor' | 'bg' | 'padding'
>

export function TransferArrowButton({
  onPress,
  disabled,
  bg = 'surface2',
  padding = 'spacing12',
  ...rest
}: ArrowDownButtonProps): JSX.Element {
  const theme = useAppTheme()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      bg={bg}
      borderColor="surface1"
      borderRadius="rounded16"
      borderWidth={4}
      disabled={disabled}
      justifyContent="center"
      // border width applies inside the element so add more padding to account for it
      p={padding}
      onPress={onPress}
      {...rest}>
      <Box alignItems="center" justifyContent="center" p="spacing2">
        <Arrow color={theme.colors.neutral2} direction="s" size={ICON_SIZE} />
      </Box>
    </TouchableArea>
  )
}
