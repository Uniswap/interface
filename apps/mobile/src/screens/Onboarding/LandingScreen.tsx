import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Screen } from 'src/components/layout/Screen'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { OnboardingScreens, UnitagScreens } from 'src/screens/Screens'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { isDevBuild } from 'src/utils/version'
import { Button, Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { useTimeout } from 'utilities/src/time/timing'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { canClaimUnitag } = useCanAddressClaimUnitag()

  const onPressCreateWallet = useCallback((): void => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    dispatch(createAccountActions.trigger())

    if (unitagsFeatureFlagEnabled) {
      if (canClaimUnitag) {
        navigation.navigate(UnitagScreens.ClaimUnitag, {
          entryPoint: OnboardingScreens.Landing,
        })
      } else {
        // If can't claim, go direct to welcome screen
        navigation.navigate(OnboardingScreens.WelcomeWallet, {
          importType: ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        })
      }
    } else {
      // use edit nickname screen still before launch of unitags
      navigation.navigate(OnboardingScreens.EditName, {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    }
  }, [canClaimUnitag, dispatch, navigation, unitagsFeatureFlagEnabled])

  const onPressImportWallet = (): void => {
    navigation.navigate(OnboardingScreens.ImportMethod, {
      importType: ImportType.NotYetSelected,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    // TODO(blocked by MOB-1082): delete bg prop
    // dark mode onboarding asset needs to be re-exported with #131313 (surface1) as background color
    <Screen backgroundColor={isDarkMode ? '$sporeBlack' : '$surface1'} edges={['bottom']}>
      <Flex fill gap="$spacing8">
        <Flex shrink height="100%" width="100%">
          <LandingBackground />
        </Flex>
        <Flex grow height="auto">
          <Flex
            grow
            $short={{ gap: '$spacing12' }}
            gap="$spacing24"
            justifyContent="flex-end"
            mx="$spacing16">
            <Trace logPress element={ElementName.CreateAccount}>
              <Button
                hapticFeedback
                $short={{ size: 'medium' }}
                size="large"
                testID={ElementName.CreateAccount}
                onPress={onPressCreateWallet}>
                {t('onboarding.landing.button.create')}
              </Button>
            </Trace>
            <Trace logPress element={ElementName.ImportAccount}>
              <TouchableArea
                hapticFeedback
                alignItems="center"
                hitSlop={16}
                testID={ElementName.ImportAccount}
                onLongPress={async (): Promise<void> => {
                  if (isDevBuild()) {
                    await selectionAsync()
                    dispatch(openModal({ name: ModalName.Experiments }))
                  }
                }}
                onPress={onPressImportWallet}>
                <Text
                  $short={{ variant: 'buttonLabel2', fontSize: '$medium' }}
                  color="$accent1"
                  variant="buttonLabel1">
                  {t('onboarding.landing.button.add')}
                </Text>
              </TouchableArea>
            </Trace>
            <Flex $short={{ py: '$none', mx: '$spacing12' }} mx="$spacing24" py="$spacing12">
              <TermsOfService />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
