import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { ColorTokens, TouchableArea, TouchableAreaProps } from 'ui/src'

type Props = {
  size?: number
  color?: ColorTokens
  showButtonLabel?: boolean
  onPressBack?: () => void
} & TouchableAreaProps

export function BackButton({
  onPressBack,
  size,
  color,
  showButtonLabel,
  ...rest
}: Props): JSX.Element {
  const navigation = useNavigation()

  const goBack = onPressBack
    ? onPressBack
    : (): void => {
        navigation.goBack()
      }
  return (
    <TouchableArea
      testID="buttons/back-button"
      onPress={goBack}
      {...rest}
      alignItems="center"
      hitSlop={24}>
      <BackButtonView color={color} showButtonLabel={showButtonLabel} size={size} />
    </TouchableArea>
  )
}
