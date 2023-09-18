import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Screen } from 'src/components/layout/Screen'
import Trace from 'src/components/Trace/Trace'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { Button, Flex, Text } from 'ui/src'
import { useTimeout } from 'utilities/src/time/timing'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
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

  const onPressCreateWallet = (): void => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    dispatch(createAccountActions.trigger())
    navigation.navigate(OnboardingScreens.EditName, {
      importType: ImportType.CreateNew,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }

  const onPressImportWallet = (): void => {
    navigation.navigate(OnboardingScreens.ImportMethod, {
      importType: ImportType.NotYetSelected,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }

  // TODO(MOB-826): improve responsiveness (pull variables from getButtonProperties into TouchableArea)
  const buttonSize = useResponsiveProp({ xs: 'medium', sm: 'large' })

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    // TODO(blocked by MOB-1082): delete bg prop
    // dark mode onboarding asset needs to be re-exported with #131313 (surface1) as background color
    <Screen bg={isDarkMode ? '$sporeBlack' : '$surface1'} edges={['bottom']}>
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
            <Button hapticFeedback size={buttonSize} onPress={onPressCreateWallet}>
              {t('Create a new wallet')}
            </Button>
          </Trace>
          <Trace logPress element={ElementName.ImportAccount}>
            <TouchableArea hapticFeedback alignItems="center" onPress={onPressImportWallet}>
              <Text color="$accent1" variant="buttonLabelLarge">
                {t('Add an existing wallet')}
              </Text>
            </TouchableArea>
          </Trace>
          <Flex $short={{ pb: '$none' }} mx="$spacing24" py="$spacing12">
            <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="buttonLabelMicro">
              <Trans t={t}>
                By continuing, I agree to the{' '}
                <Text
                  color="$accent1"
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
                  Terms of Service
                </Text>{' '}
                and consent to the{' '}
                <Text
                  color="$accent1"
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
                  Privacy Policy
                </Text>
                .
              </Trans>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
