import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import ArrowLeft from 'src/assets/icons/arrow-left.svg'
import { Button } from 'src/components/buttons/Button'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackButton({ onPressBack, size, ...rest }: Props) {
  const navigation = useNavigation()
  const goBack = onPressBack ? onPressBack : () => navigation.goBack()

  return (
    <Button onPress={goBack} {...rest}>
      <ArrowLeft width={size ?? 26} height={size ?? 26} />
    </Button>
  )
}
