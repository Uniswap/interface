import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'

/**
 * Adds a back button to the navigation header if the screen is the first in the stack.
 * By default react-navigation will only show the back button if the screen is not the first one in the stack.
 */
export function useAddBackButton(
  navigation: NativeStackNavigationProp<OnboardingStackParamList>
): void {
  useEffect((): void => {
    const shouldRenderBackButton = navigation.getState().index === 0
    if (shouldRenderBackButton) {
      navigation.setOptions({
        headerLeft: () => <BackButton />,
      })
    }
  }, [navigation])
}
