import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, Platform, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics/biometrics-utils'
import { biometricAuthenticationSuccessful } from 'src/features/biometrics/biometricsSaga'
import { useBiometricsAlert } from 'src/features/biometrics/useBiometricsAlert'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { checkOsBiometricAuthEnabled, useBiometricName } from 'src/features/biometricsSettings/hooks'
import { setRequiredForTransactions } from 'src/features/biometricsSettings/slice'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex, useIsDarkMode, useSporeColors } from 'ui/src'
import { SECURITY_SCREEN_BACKGROUND_DARK, SECURITY_SCREEN_BACKGROUND_LIGHT } from 'ui/src/assets'
import { Lock } from 'ui/src/components/icons'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isIOS } from 'utilities/src/platform'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { showBiometricsAlert } = useBiometricsAlert({ t })

  const [isLoadingAccount, setIsLoadingAccount] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const { touchId: isTouchIdDevice } = useDeviceSupportsBiometricAuth()
  const biometricsMethod = useBiometricName(isTouchIdDevice)

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const onPressNext = useCallback(async () => {
    if (!isLoadingAccount) {
      setShowWarningModal(false)
      setIsLoadingAccount(true)
      await onCompleteOnboarding()
    }
  }, [isLoadingAccount, onCompleteOnboarding])

  const onSkipPressed = useCallback(async () => {
    if (params.importType === ImportType.Watch) {
      await onPressNext()
    } else {
      setShowWarningModal(true)
    }
  }, [onPressNext, params.importType])

  const onPressEnableSecurity = useCallback(async () => {
    const isOSBiometricAuthEnabled = await checkOsBiometricAuthEnabled()
    const authStatus = await tryLocalAuthenticate()

    if (!isOSBiometricAuthEnabled || authStatus === BiometricAuthenticationStatus.Rejected) {
      showBiometricsAlert(biometricsMethod)
      return
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      await onPressNext()
    }
  }, [biometricsMethod, dispatch, onPressNext, showBiometricsAlert])

  const onCloseModal = useCallback(() => setShowWarningModal(false), [])

  return (
    <>
      <BiometricAuthWarningModal
        isOpen={showWarningModal}
        isTouchIdDevice={isTouchIdDevice}
        onClose={onCloseModal}
        onConfirm={onPressNext}
      />
      {isLoadingAccount && (
        <Flex centered mt="$spacing60" position="absolute" pt="$spacing36" width="100%" zIndex={100}>
          <ActivityIndicator color={colors.white.val} />
        </Flex>
      )}
      <OnboardingScreen
        Icon={Lock}
        childrenGap="$none"
        subtitle={
          isIOS
            ? t('onboarding.security.subtitle.ios', {
                biometricsMethod,
              })
            : t('onboarding.security.subtitle.android')
        }
        title={t('onboarding.security.title')}
        onSkip={onSkipPressed}
      >
        <Flex centered shrink gap="$spacing16">
          <Flex>
            <SecurityBackgroundImage />
          </Flex>
        </Flex>
        <Trace logPress element={ElementName.Enable}>
          <Flex centered row>
            <Button size="large" variant="branded" onPress={onPressEnableSecurity}>
              {isIOS
                ? t('onboarding.security.button.confirm.ios', { biometricsMethod })
                : t('onboarding.security.button.confirm.android')}
            </Button>
          </Flex>
        </Trace>
      </OnboardingScreen>
    </>
  )
}

const SecurityBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  return (
    <Image
      resizeMode="contain"
      source={
        isDarkMode
          ? Platform.select(SECURITY_SCREEN_BACKGROUND_DARK)
          : Platform.select(SECURITY_SCREEN_BACKGROUND_LIGHT)
      }
      style={styles.image}
    />
  )
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
  },
})
