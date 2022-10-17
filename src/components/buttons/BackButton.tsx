import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  color?: keyof Theme['colors']
  showButtonLabel?: boolean
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackButton({ onPressBack, size, color, showButtonLabel, ...rest }: Props) {
  const navigation = useNavigation()

  const goBack = onPressBack ? onPressBack : () => navigation.goBack()
  return (
    <Button onPress={goBack} {...rest}>
      <BackButtonView color={color} showButtonLabel={showButtonLabel} size={size} />
    </Button>
  )
}
