import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex, Icons } from 'ui/src'
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
      backgroundColor={disabled ? 'surface3' : 'neutral2'}
      borderRadius="roundedFull"
      disabled={disabled}
      height={iconSizes.icon28}
      justifyContent="center"
      width={iconSizes.icon28}
      onPress={(): void => onPress(type)}>
      {type === PlusMinusButtonType.Plus ? (
        <Icons.Plus
          color="$surface1"
          height={iconSizes.icon12}
          strokeWidth={2.5}
          width={iconSizes.icon12}
        />
      ) : (
        <Flex
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          gap="$none"
          height={2}
          width={10}
        />
      )}
    </TouchableArea>
  )
}
