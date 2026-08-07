import { Plus as PlusIcon, Minus as MinusIcon } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout/Flex'
import { TouchableArea } from 'ui/src/components/touchable/TouchableArea/TouchableArea'
import { iconSizes } from 'ui/src/theme'

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
        <MinusIcon color="$surface1" size="$icon.12" strokeWidth={2.5} />
      )}
    </TouchableArea>
  )
}
