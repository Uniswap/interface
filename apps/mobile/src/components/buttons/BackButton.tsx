import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { ColorTokens, TouchableArea, TouchableAreaProps } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

type Props = {
  size?: number
  color?: ColorTokens
  showButtonLabel?: boolean
  onPressBack?: () => void
} & TouchableAreaProps

export function BackButton({ onPressBack, size, color, showButtonLabel, ...rest }: Props): JSX.Element {
  const navigation = useNavigation()

  const goBack = onPressBack
    ? onPressBack
    : (): void => {
        navigation.goBack()
      }
  return (
    <TouchableArea
      alignItems="center"
      hitSlop={24}
      testID={TestID.Back}
      dd-action-name={TestID.Back}
      onPress={goBack}
      {...rest}
    >
      <BackButtonView color={color} showButtonLabel={showButtonLabel} size={size} />
    </TouchableArea>
  )
}
