import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps, useTheme } from '@shopify/restyle'
import React from 'react'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { ElementName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackX({ onPressBack, size, ...rest }: Props) {
  const navigation = useNavigation()
  const goBack = onPressBack ? onPressBack : () => navigation.goBack()
  const theme = useTheme<Theme>()

  return (
    <Button name={ElementName.Back} onPress={goBack} {...rest}>
      <X
        height={size ?? 20}
        stroke={theme.colors.textColor}
        strokeLinecap="round"
        strokeWidth="2"
        width={size ?? 20}
      />
    </Button>
  )
}
