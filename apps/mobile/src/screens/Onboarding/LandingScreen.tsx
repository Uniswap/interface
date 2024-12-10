import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { openModal } from 'src/features/modals/modalSlice'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { LANDING_ANIMATION_DURATION, LandingBackground } from 'wallet/src/components/landing/LandingBackground'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()

  const actionButtonsOpacity = useSharedValue(0)
  const actionButtonsStyle = useAnimatedStyle(() => ({ opacity: actionButtonsOpacity.value }), [actionButtonsOpacity])

  useEffect(() => {
    // disables looping animation during detox e2e tests which was preventing js thread from idle
    if (!isDetoxBuild) {
      actionButtonsOpacity.value = withDelay(LANDING_ANIMATION_DURATION, withTiming(1, { duration: ONE_SECOND_MS }))
    }
  }, [actionButtonsOpacity])

  // Disables testnet mode on mount if enabled (eg upon removing a wallet)
  useEffect(() => {
    if (isTestnetModeEnabled) {
      dispatch(setIsTestnetModeEnabled(false))
    }
  }, [dispatch, isTestnetModeEnabled])

  const { canClaimUnitag } = useCanAddressClaimUnitag()
  const { getOnboardingAccount, generateOnboardingAccount } = useOnboardingContext()

  const onPressCreateWallet = useCallback(async (): Promise<void> => {
    if (canClaimUnitag) {
      navigation.navigate(UnitagScreens.ClaimUnitag, {
        entryPoint: OnboardingScreens.Landing,
      })
    } else {
      const onboardingAccount = getOnboardingAccount()
      if (!onboardingAccount) {
        try {
          await generateOnboardingAccount()
        } catch (e) {
          logger.error(e, {
            tags: { file: 'LandingScreen.tsx', function: 'onPressCreateWallet' },
          })
        }
      }

      navigation.navigate(OnboardingScreens.Notifications, {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    }
  }, [canClaimUnitag, generateOnboardingAccount, getOnboardingAccount, navigation])

  const onPressImportWallet = (): void => {
    navigation.navigate(OnboardingScreens.ImportMethod, {
      importType: ImportType.NotYetSelected,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    <ReactNavigationPerformanceView screenName={OnboardingScreens.Landing}>
      <Screen backgroundColor="$surface1" edges={['bottom']}>
        <Flex fill gap="$spacing8">
          <Flex shrink height="100%" width="100%">
            <LandingBackground navigationEventConsumer={navigation} />
          </Flex>
          <AnimatedFlex grow height="auto" style={actionButtonsStyle}>
            <Flex grow $short={{ gap: '$spacing16' }} gap="$spacing24" mx="$spacing16">
              <Trace logPress element={ElementName.CreateAccount}>
                <Flex centered row>
                  <TouchableArea
                    alignItems="center"
                    backgroundColor="$accent1"
                    borderRadius="$rounded20"
                    flexShrink={1}
                    hitSlop={16}
                    px="$spacing36"
                    py="$spacing16"
                    scaleTo={0.97}
                    shadowColor="$accent1"
                    shadowOpacity={0.4}
                    shadowRadius="$spacing8"
                    testID={TestID.CreateAccount}
                    onPress={onPressCreateWallet}
                  >
                    <Text color="$white" variant="buttonLabel1">
                      {t('onboarding.landing.button.create')}
                    </Text>
                  </TouchableArea>
                </Flex>
              </Trace>
              <Trace logPress element={ElementName.ImportAccount}>
                <TouchableArea
                  alignItems="center"
                  hitSlop={16}
                  testID={TestID.ImportAccount}
                  onLongPress={async (): Promise<void> => {
                    if (isDevEnv()) {
                      dispatch(openModal({ name: ModalName.Experiments }))
                    }
                  }}
                  onPress={onPressImportWallet}
                >
                  <Text
                    $short={{ variant: 'buttonLabel1', fontSize: '$medium' }}
                    color="$accent1"
                    variant="buttonLabel1"
                  >
                    {t('onboarding.landing.button.add')}
                  </Text>
                </TouchableArea>
              </Trace>
              <Flex $short={{ py: '$none', mx: '$spacing12' }} mx="$spacing24" py="$spacing12">
                <TermsOfService />
              </Flex>
            </Flex>
          </AnimatedFlex>
        </Flex>
      </Screen>
    </ReactNavigationPerformanceView>
  )
}
