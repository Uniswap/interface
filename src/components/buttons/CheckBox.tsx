import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'

export type CheckBoxProps = {
  checked: boolean
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ checked, onCheckPressed }: CheckBoxProps) {
  const theme = useAppTheme()

  const onPress = () => {
    onCheckPressed?.(checked)
  }

  return (
    <TouchableArea
      alignItems="center"
      backgroundColor={checked ? 'accentAction' : 'background1'}
      borderColor={checked ? 'accentAction' : 'backgroundOutline'}
      borderRadius="xs"
      borderWidth={1.5}
      height={theme.iconSizes.md}
      justifyContent="center"
      p="xxxs"
      width={theme.iconSizes.md}
      onPress={onPress}>
      {checked ? (
        <Check color={theme.colors.white} height={theme.iconSizes.sm} width={theme.iconSizes.sm} />
      ) : null}
    </TouchableArea>
  )
}
