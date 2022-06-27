import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { ColorSelector } from 'src/components/ColorSelector/ColorSelector'
import { useUpdateColorCallback } from 'src/components/ColorSelector/hooks'
import { Flex } from 'src/components/layout'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectColor>

// Detect next view based on import account type
function useNextOnboardingScreen(currentScreen: OnboardingScreens) {
  const activeAccount = useActiveAccount()

  switch (currentScreen) {
    case OnboardingScreens.SelectColor:
      if (activeAccount?.type === AccountType.Native) {
        return OnboardingScreens.Backup
      }
      return OnboardingScreens.Notifications
    default:
      undefined
  }
}

export function SelectColorScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()

  // only show backup flow if importing accounts from recovery phrase, assume new accounts activated.
  const nextScreen = useNextOnboardingScreen(OnboardingScreens.SelectColor)

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)
  const updateThemeColor = useUpdateColorCallback()

  const onPressNext = useCallback(() => {
    if (activeAccount && selectedColor && nextScreen) {
      updateThemeColor(activeAccount, selectedColor)
      navigation.navigate({
        name: nextScreen,
        merge: true,
        params,
      })
    }
  }, [activeAccount, navigation, nextScreen, params, selectedColor, updateThemeColor])

  return (
    <OnboardingScreen
      subtitle={t(
        'Make your wallet feel like you by selecting a color. We’ll generate a special gradient based on your address'
      )}
      title={t('Choose a color')}>
      <ColorSelector selectedColor={selectedColor} updateColor={setSelectedColor} />
      <Flex grow justifyContent="flex-end">
        <PrimaryButton
          disabled={!selectedColor}
          label={t('Next')}
          name={ElementName.Next}
          testID={ElementName.Next}
          variant="onboard"
          onPress={onPressNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}
