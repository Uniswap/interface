import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'
import PlusIcon from 'ui/src/assets/icons/plus.svg'

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
  const theme = useAppTheme()

  return (
    <TouchableArea
      hapticFeedback
      alignItems="center"
      backgroundColor={disabled ? 'surface3' : 'neutral3'}
      borderRadius="roundedFull"
      disabled={disabled}
      height={theme.iconSizes.icon28}
      justifyContent="center"
      width={theme.iconSizes.icon28}
      onPress={(): void => onPress(type)}>
      {type === PlusMinusButtonType.Plus ? (
        <PlusIcon
          color={theme.colors.surface1}
          height={theme.iconSizes.icon12}
          strokeWidth={2.5}
          width={theme.iconSizes.icon12}
        />
      ) : (
        <Box backgroundColor="surface1" borderRadius="rounded12" height={2} width={10} />
      )}
    </TouchableArea>
  )
}
