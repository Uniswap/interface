import { ComponentProps } from 'react'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'wallet/src/components/icons/Arrow'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'onPress' | 'borderColor' | 'bg' | 'padding'
>

export function TransferArrowButton({
  onPress,
  disabled,
  bg = '$surface2',
  padding = '$spacing12',
  ...rest
}: ArrowDownButtonProps): JSX.Element {
  const colors = useSporeColors()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      bg={bg}
      borderColor="$surface1"
      borderRadius="$rounded16"
      borderWidth={4}
      disabled={disabled}
      justifyContent="center"
      // border width applies inside the element so add more padding to account for it
      p={padding}
      onPress={onPress}
      {...rest}>
      <Flex centered p="$spacing2">
        <Arrow color={colors.neutral2.val} direction="s" size={ICON_SIZE} />
      </Flex>
    </TouchableArea>
  )
}
