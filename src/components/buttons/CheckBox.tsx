import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { IconButton } from 'src/components/buttons/IconButton'

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
    <IconButton
      alignSelf="flex-start"
      backgroundColor={checked ? 'accentAction' : 'backgroundBackdrop'}
      borderColor={checked ? 'accentAction' : 'backgroundOutline'}
      borderRadius="xs"
      borderWidth={BORDER_WIDTH}
      color="textSecondary"
      height={size + theme.spacing.xxxs + BORDER_WIDTH * 4}
      icon={checked ? <Check color={theme.colors.textPrimary} height={size} width={size} /> : null}
      p="xxxs"
      width={size + theme.spacing.xxxs + BORDER_WIDTH * 4}
      onPress={onPress}
    />
  )
}

const BORDER_WIDTH = 1
