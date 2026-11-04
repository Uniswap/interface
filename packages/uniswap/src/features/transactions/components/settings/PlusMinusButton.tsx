import { Flex } from '@universe/mycelium'
import { TouchableArea } from '@universe/mycelium'
import { Plus as PlusIcon } from '@universe/mycelium/icons/Plus'
import { iconSizes } from '@universe/mycelium/tokens'

export enum PlusMinusButtonType {
  Plus = 0,
  Minus = 1,
}

export function PlusMinusButton({
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
      alignItems="center"
      backgroundColor={disabled ? '$surface3' : '$neutral2'}
      borderRadius="$roundedFull"
      disabled={disabled}
      height={iconSizes.icon28}
      justifyContent="center"
      width={iconSizes.icon28}
      onPress={(): void => onPress(type)}
    >
      {type === PlusMinusButtonType.Plus ? (
        <PlusIcon color="$surface1" size="$icon.12" strokeWidth={2.5} />
      ) : (
        <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
      )}
    </TouchableArea>
  )
}
