import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import PlusIcon from 'src/assets/icons/plus.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'

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
      backgroundColor={disabled ? 'backgroundOutline' : 'textTertiary'}
      borderRadius="roundedFull"
      disabled={disabled}
      height={theme.iconSizes.icon28}
      justifyContent="center"
      width={theme.iconSizes.icon28}
      onPress={(): void => onPress(type)}>
      {type === PlusMinusButtonType.Plus ? (
        <PlusIcon
          color={theme.colors.background0}
          height={theme.iconSizes.icon12}
          strokeWidth={2.5}
          width={theme.iconSizes.icon12}
        />
      ) : (
        <Box backgroundColor="background0" borderRadius="rounded12" height={2} width={10} />
      )}
    </TouchableArea>
  )
}
