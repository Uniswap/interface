import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import {
  resolveUnitagEligibility,
  UNITAG_ELIGIBILITY_TIMEOUT_MS,
} from 'src/screens/Onboarding/resolveUnitagEligibility'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { LANDING_ANIMATION_DURATION, LandingBackground } from 'wallet/src/components/landing/LandingBackground'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useResolveCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'

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
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [])

  // Disables testnet mode on mount if enabled (eg upon removing a wallet)
  useEffect(() => {
    if (isTestnetModeEnabled) {
      dispatch(setIsTestnetModeEnabled(false))
    }
  }, [dispatch, isTestnetModeEnabled])

  const resolveCanClaimUnitag = useResolveCanAddressClaimUnitag()
  const { getOnboardingAccount, generateOnboardingAccount } = useOnboardingContext()
  const [isResolvingCreateWallet, setIsResolvingCreateWallet] = useState(false)
  const pendingAccountGeneration = useRef<Promise<void> | null>(null)

  // A blur releases the CTA mid-generation, so a retry can overlap the first run. Each call
  // stores a fresh mnemonic in the keychain; share the in-flight promise so none are orphaned.
  const generateOnboardingAccountOnce = useCallback(async (): Promise<void> => {
    pendingAccountGeneration.current ??= generateOnboardingAccount().finally(() => {
      pendingAccountGeneration.current = null
    })

    await pendingAccountGeneration.current
  }, [generateOnboardingAccount])

  const onPressCreateWallet = useCallback(async (): Promise<void> => {
    setIsResolvingCreateWallet(true)
    const eligibilityAbortController = new AbortController()

    // Watch for blur, not `isFocused()`: Create -> Import -> back re-focuses this screen while the
    // resolve is still pending, so a focus check afterwards would navigate with no tap.
    let navigatedAway = false
    const unsubscribeFromBlur = navigation.addListener('blur', () => {
      navigatedAway = true
      eligibilityAbortController.abort()
      // Landing stays mounted behind Import; release the CTA now rather than spinning until `finally`.
      setIsResolvingCreateWallet(false)
    })
    const hasNavigatedAway = (): boolean => navigatedAway

    try {
      // On a fresh install eligibility may still be in flight; reading it as `false` before the
      // answer arrives is the CONS-2926 bug.
      const eligibilityResolution = await resolveUnitagEligibility(() =>
        resolveCanClaimUnitag(eligibilityAbortController.signal),
      )

      if (hasNavigatedAway()) {
        return
      }

      // A timeout is an unknown result, not ineligibility — release the CTA and let the user retry.
      if (eligibilityResolution.status === 'timeout') {
        // Cancel the still-running query so the next tap starts fresh instead of rejoining it.
        eligibilityAbortController.abort()
        logger.warn(
          'LandingScreen.tsx',
          'onPressCreateWallet',
          `Unitag eligibility unresolved after ${UNITAG_ELIGIBILITY_TIMEOUT_MS}ms`,
        )
        return
      }

      if (eligibilityResolution.status === 'error') {
        logger.error(eligibilityResolution.error, {
          tags: { file: 'LandingScreen.tsx', function: 'onPressCreateWallet' },
        })
        return
      }

      const { canClaim: canClaimUnitag } = eligibilityResolution

      if (canClaimUnitag) {
        navigation.navigate(UnitagScreens.ClaimUnitag, {
          entryPoint: OnboardingScreens.Landing,
        })
        return
      }

      const onboardingAccount = getOnboardingAccount()
      if (!onboardingAccount) {
        try {
          await generateOnboardingAccountOnce()
        } catch (e) {
          logger.error(e, {
            tags: { file: 'LandingScreen.tsx', function: 'onPressCreateWallet' },
          })
          return
        }
      }

      // Account generation is a second await window, so re-check before navigating.
      if (hasNavigatedAway()) {
        return
      }

      navigation.navigate(OnboardingScreens.Notifications, {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    } finally {
      unsubscribeFromBlur()
      // The blur already released the CTA, and a later tap may own it by now.
      if (!hasNavigatedAway()) {
        setIsResolvingCreateWallet(false)
      }
    }
  }, [resolveCanClaimUnitag, generateOnboardingAccountOnce, getOnboardingAccount, navigation])

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
                    loading={isResolvingCreateWallet}
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
