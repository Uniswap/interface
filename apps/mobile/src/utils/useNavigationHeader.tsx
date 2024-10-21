import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { ReactNode, useEffect } from 'react'
import { HeaderSkipButton } from 'src/app/navigation/components'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { iconSizes } from 'ui/src/theme'
import { UnitagStackParamList } from 'uniswap/src/types/screens/mobile'

/**
 * Adds a back button to the navigation header regardless of the screen's position in the stack.
 * By default react-navigation will only show the back button if the screen is not the first one in the stack.
 */
export function useNavigationHeader(
  navigation: NativeStackNavigationProp<OnboardingStackParamList> | NativeStackNavigationProp<UnitagStackParamList>,
  onSkip?: () => void,
): void {
  useEffect((): void => {
    navigation.setOptions({
      headerLeft: () => <BackButton size={iconSizes.icon28} />,
      headerRight: onSkip ? (_props): ReactNode => <HeaderSkipButton onPress={onSkip} /> : undefined,
    })
  }, [navigation, onSkip])
}
