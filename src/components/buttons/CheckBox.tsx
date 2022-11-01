import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'

export type CheckBoxProps = {
  checked: boolean
  size: number
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ checked, onCheckPressed, size }: CheckBoxProps) {
  const theme = useAppTheme()

  const onPress = () => {
    onCheckPressed?.(checked)
  }

  return (
    <TouchableArea
      alignSelf="flex-start"
      backgroundColor={checked ? 'accentAction' : 'background0'}
      borderColor={checked ? 'accentAction' : 'backgroundOutline'}
      borderRadius="xs"
      borderWidth={BORDER_WIDTH}
      height={size + theme.spacing.xxxs + BORDER_WIDTH * 4}
      p="xxxs"
      width={size + theme.spacing.xxxs + BORDER_WIDTH * 4}
      onPress={onPress}>
      {checked ? <Check color={theme.colors.white} height={size} width={size} /> : null}
    </TouchableArea>
  )
}

const BORDER_WIDTH = 1
