import { Flex, Icons, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export enum PlusMinusButtonType {
  Plus,
  Minus,
}

export default function PlusMinusButton({
  type,
  disabled,
  onPress,
}: {
  type: PlusMinusButtonType
  disabled: boolean
  onPress: (type: PlusMinusButtonType) => void
}): JSX.Element {
  return (
    <TouchableArea
      hapticFeedback
      alignItems="center"
      backgroundColor={disabled ? '$surface3' : '$neutral2'}
      borderRadius="$roundedFull"
      disabled={disabled}
      height={iconSizes.icon28}
      justifyContent="center"
      width={iconSizes.icon28}
      onPress={(): void => onPress(type)}>
      {type === PlusMinusButtonType.Plus ? (
        <Icons.Plus color="$surface1" size="$icon.12" strokeWidth={2.5} />
      ) : (
        <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
      )}
    </TouchableArea>
  )
}
