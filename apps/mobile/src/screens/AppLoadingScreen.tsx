import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect } from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export const SPLASH_SCREEN = { uri: 'SplashScreen' }

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.AppLoading>

export function AppLoadingScreen({ navigation }: Props): JSX.Element | null {
  // Logic to determine what screen to show on app load
  useEffect(() => {
    async function checkOnDeviceRecovery(): Promise<void> {
      const mnemonicIds = await Keyring.getMnemonicIds()
      if (mnemonicIds.length > 0) {
        navigation.replace(OnboardingScreens.OnDeviceRecovery, {
          importType: ImportType.RestoreMnemonic,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
          mnemonicIds,
        })
      }
    }
    checkOnDeviceRecovery().catch(() => {
      logger.warn('AppLoadingScreen', 'checkOnDeviceRecovery', 'Failed to check on device recovery')
    })
  }, [navigation])

  return <SplashScreen />
}
