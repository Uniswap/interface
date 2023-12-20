import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Screen } from 'src/components/layout/Screen'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { isDevBuild } from 'src/utils/version'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { useTimeout } from 'utilities/src/time/timing'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  // TODO (MOB-1314): request /claim/eligibility/ from unitags backend
  const canClaimUnitag = true && unitagsFeatureFlagEnabled

  const onPressCreateWallet = (): void => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    dispatch(createAccountActions.trigger())
    if (canClaimUnitag) {
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.ClaimUnitag,
        params: {
          entryPoint: OnboardingScreens.Landing,
        },
      })
    } else {
      navigation.navigate(OnboardingScreens.EditName, {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    }
  }

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
    <Screen bg={isDarkMode ? '$sporeBlack' : '$surface1'} edges={['bottom']}>
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
                onPress={onPressCreateWallet}>
                {t('Create a new wallet')}
              </Button>
            </Trace>
            <Trace logPress element={ElementName.ImportAccount}>
              <TouchableArea
                hapticFeedback
                alignItems="center"
                hitSlop={16}
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
                  {t('Add an existing wallet')}
                </Text>
              </TouchableArea>
            </Trace>
            <Flex $short={{ py: '$none', mx: '$spacing12' }} mx="$spacing24" py="$spacing12">
              <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="buttonLabel4">
                <Trans t={t}>
                  By continuing, I agree to the{' '}
                  <Text
                    color="$accent1"
                    variant="buttonLabel4"
                    onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
                    Terms of Service
                  </Text>{' '}
                  and consent to the{' '}
                  <Text
                    color="$accent1"
                    variant="buttonLabel4"
                    onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
                    Privacy Policy
                  </Text>
                  .
                </Trans>
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
