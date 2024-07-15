import { ComponentProps } from 'react'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'wallet/src/components/icons/Arrow'

const ICON_SIZE = 20

type ArrowDownButtonProps = Pick<
  ComponentProps<typeof TouchableArea>,
  'disabled' | 'onPress' | 'borderColor' | 'backgroundColor' | 'p'
>

export function TransferArrowButton({
  onPress,
  disabled,
  backgroundColor = '$surface2',
  p = '$spacing12',
  ...rest
}: ArrowDownButtonProps): JSX.Element {
  const colors = useSporeColors()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      backgroundColor={backgroundColor}
      borderColor="$surface1"
      borderRadius="$rounded16"
      borderWidth={4}
      disabled={disabled}
      justifyContent="center"
      // border width applies inside the element so add more padding to account for it
      p={p}
      onPress={onPress}
      {...rest}>
      <Flex centered p="$spacing2">
        <Arrow color={colors.neutral2.val} direction="s" size={ICON_SIZE} />
      </Flex>
    </TouchableArea>
  )
}
