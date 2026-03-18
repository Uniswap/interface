import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { LANDING_ANIMATION_DURATION, LandingBackground } from 'wallet/src/components/landing/LandingBackground'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const hideSplashScreen = useHideSplashScreen()
  const actionButtonsOpacity = useSharedValue(0)
  const actionButtonsStyle = useAnimatedStyle(() => ({ opacity: actionButtonsOpacity.value }), [actionButtonsOpacity])

  useEffect(() => {
    // disables looping animation during e2e tests which was preventing js thread from idle
    actionButtonsOpacity.value = withDelay(LANDING_ANIMATION_DURATION, withTiming(1, { duration: ONE_SECOND_MS }))
  }, [])

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

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <ReactNavigationPerformanceView interactive screenName={OnboardingScreens.Landing}>
      <Screen backgroundColor="$surface1" edges={['bottom']} onLayout={hideSplashScreen}>
        <Flex fill gap="$spacing8">
          <Flex shrink height="100%" width="100%">
            <LandingBackground navigationEventConsumer={navigation} />
          </Flex>
          <AnimatedFlex grow height="auto" style={actionButtonsStyle}>
            <Flex grow $short={{ gap: '$spacing16' }} gap="$spacing24" mx="$spacing16">
              <Trace logPress element={ElementName.CreateAccount}>
                <Flex centered row>
                  <Button
                    fill={false}
                    variant="branded"
                    flexShrink={1}
                    hitSlop={16}
                    shadowColor="$accent1"
                    shadowOpacity={0.4}
                    shadowRadius="$spacing8"
                    size="large"
                    testID={TestID.CreateAccount}
                    onPress={onPressCreateWallet}
                  >
                    {isEmbeddedWalletEnabled
                      ? t('onboarding.landing.button.createAccount')
                      : t('onboarding.landing.button.create')}
                  </Button>
                </Flex>
              </Trace>
              <Trace logPress element={ElementName.ImportAccount}>
                <TouchableArea
                  alignItems="center"
                  hitSlop={16}
                  testID={TestID.ImportAccount}
                  onLongPress={async (): Promise<void> => {
                    if (isDevEnv()) {
                      navigate(ModalName.Experiments)
                    }
                  }}
                  onPress={onPressImportWallet}
                >
                  <Text
                    $short={{ variant: 'buttonLabel1', fontSize: '$medium' }}
                    color="$accent1"
                    variant="buttonLabel1"
                  >
                    {isEmbeddedWalletEnabled
                      ? t('onboarding.intro.button.logInOrImport')
                      : t('onboarding.landing.button.add')}
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
