import { NativeStackScreenProps } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useOnDeviceRecoveryData } from 'src/screens/Import/useOnDeviceRecoveryData'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'
import { useAppDispatch } from 'wallet/src/state'

export const SPLASH_SCREEN = { uri: 'SplashScreen' }

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.AppLoading>

export function AppLoadingScreen({ navigation }: Props): JSX.Element | null {
  const dispatch = useAppDispatch()

  const { finishOnboarding } = useOnboardingContext()
  const [finished, setFinished] = useState(false)

  const [mnemonicIds, setMnemonicIds] = useState<string[]>()
  const { significantRecoveryWalletInfos, loading } = useOnDeviceRecoveryData(mnemonicIds?.[0])

  useEffect(() => {
    Keyring.getMnemonicIds()
      .then((storedMnemonicIds) => setMnemonicIds(storedMnemonicIds))
      .catch(() => {
        logger.error('Failed to load mnemonic ids', {
          tags: { file: 'AppLoadingScreen', function: 'getMnemonicIds' },
        })
        setMnemonicIds([]) // Needed to leave the loading screen
      })
  }, [])

  // Logic to determine what screen to show on app load
  useEffect(() => {
    const navigateToLanding = (): void => {
      navigation.replace(OnboardingScreens.Landing, {
        importType: ImportType.NotYetSelected,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    }

    async function checkOnDeviceRecovery(): Promise<void> {
      if (!mnemonicIds || loading || finished) {
        return
      }

      const mnemonicIdsCount = mnemonicIds.length
      const firstMnemonicId = mnemonicIds[0]

      // Used to stop this running multiple times as the following logic is async
      setFinished(true)

      if (mnemonicIdsCount === 1 && firstMnemonicId) {
        if (significantRecoveryWalletInfos.length) {
          await finishOnboarding(
            ImportType.OnDeviceRecovery,
            significantRecoveryWalletInfos.map((addressInfo, index) => {
              return {
                type: AccountType.SignerMnemonic,
                mnemonicId: firstMnemonicId,
                name: t('onboarding.wallet.defaultName', { number: index + 1 }),
                address: addressInfo.address,
                derivationIndex: addressInfo.derivationIndex,
                timeImportedMs: dayjs().valueOf(),
              }
            })
          )
          dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
        } else {
          navigateToLanding()
        }
      } else if (mnemonicIdsCount > 1) {
        navigation.replace(OnboardingScreens.OnDeviceRecovery, {
          importType: ImportType.RestoreMnemonic,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
          mnemonicIds,
        })
      } else {
        navigateToLanding()
      }
    }
    checkOnDeviceRecovery().catch(() => {
      logger.warn('AppLoadingScreen', 'checkOnDeviceRecovery', 'Failed to check on device recovery')
    })
  }, [
    dispatch,
    finishOnboarding,
    finished,
    loading,
    mnemonicIds,
    navigation,
    significantRecoveryWalletInfos,
  ])

  return <SplashScreen />
}
