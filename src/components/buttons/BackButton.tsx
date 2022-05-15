import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps, useTheme } from '@shopify/restyle'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  color?: keyof Theme['colors']
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackButton({ onPressBack, size, color, ...rest }: Props) {
  const navigation = useNavigation()
  const goBack = onPressBack ? onPressBack : () => navigation.goBack()
  const theme = useTheme<Theme>()

  return (
    <Button onPress={goBack} {...rest}>
      <Chevron
        color={color ? theme.colors[color] : theme.colors.deprecated_textColor}
        direction="w"
        height={size ?? 18}
        width={size ?? 18}
      />
    </Button>
  )
}
