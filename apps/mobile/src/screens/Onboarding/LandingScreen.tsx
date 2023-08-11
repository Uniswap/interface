import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { useTimeout } from 'utilities/src/time/timing'
import { uniswapUrls } from 'wallet/src/constants/urls'
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

  const outerGap = useResponsiveProp({ xs: 'spacing12', sm: 'spacing24' })
  const buttonSize = useResponsiveProp({ xs: ButtonSize.Medium, sm: ButtonSize.Large })
  const pb = useResponsiveProp({ xs: 'spacing12', sm: 'none' })

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    // TODO(blocked by MOB-1082): delete bg prop
    // dark mode onboarding asset needs to be re-exported with #131313 (surface1) as background color
    <Screen bg={isDarkMode ? 'sporeBlack' : 'surface1'} edges={['bottom']}>
      <Flex shrink height="100%" width="100%">
        <LandingBackground />
      </Flex>
      <Flex grow height="auto">
        <Flex grow gap={outerGap} justifyContent="flex-end" mx="spacing16">
          <Trace logPress element={ElementName.CreateAccount}>
            <Button
              hapticFeedback
              label={t('Create a new wallet')}
              size={buttonSize}
              onPress={onPressCreateWallet}
            />
          </Trace>
          <Trace logPress element={ElementName.ImportAccount}>
            <TouchableArea hapticFeedback alignItems="center" onPress={onPressImportWallet}>
              <Text color="accent1" variant="buttonLabelLarge">
                {t('Import or watch a wallet')}
              </Text>
            </TouchableArea>
          </Trace>
          <Box mx="spacing24" pb={pb}>
            <Text color="neutral2" mx="spacing4" textAlign="center" variant="buttonLabelMicro">
              <Trans t={t}>
                By continuing, I agree to the{' '}
                <Text
                  color={isDarkMode ? 'accent1' : 'accent1'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
                  Terms of Service
                </Text>{' '}
                and consent to the{' '}
                <Text
                  color={isDarkMode ? 'accent1' : 'accent1'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
                  Privacy Policy
                </Text>
                .
              </Trans>
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Screen>
  )
}
