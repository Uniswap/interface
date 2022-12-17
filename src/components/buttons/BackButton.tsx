import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { ElementName } from 'src/features/telemetry/constants'
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

  const goBack = onPressBack
    ? onPressBack
    : () => {
        navigation.goBack()
      }
  return (
    <TouchableArea onPress={goBack} {...rest} name={ElementName.Back}>
      <BackButtonView color={color} showButtonLabel={showButtonLabel} size={size} />
    </TouchableArea>
  )
}
