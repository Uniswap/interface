import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Image, Platform, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { enroll, tryLocalAuthenticate } from 'src/features/biometrics/biometrics-utils'
import { biometricAuthenticationSuccessful } from 'src/features/biometrics/biometricsSaga'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { checkOsBiometricAuthEnabled, useBiometricName } from 'src/features/biometricsSettings/hooks'
import { setRequiredForTransactions } from 'src/features/biometricsSettings/slice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { openSettings } from 'src/utils/linking'
import { Button, Flex, useIsDarkMode, useSporeColors } from 'ui/src'
import { SECURITY_SCREEN_BACKGROUND_DARK, SECURITY_SCREEN_BACKGROUND_LIGHT } from 'ui/src/assets'
import { Lock } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isIOS } from 'utilities/src/platform'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

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
    if (params?.importType === ImportType.Watch) {
      await onPressNext()
    } else {
      setShowWarningModal(true)
    }
  }, [onPressNext, params?.importType])

  const onPressEnableSecurity = useCallback(async () => {
    const isOSBiometricAuthEnabled = await checkOsBiometricAuthEnabled()

    if (!isOSBiometricAuthEnabled) {
      isIOS
        ? Alert.alert(
            t('onboarding.security.alert.biometrics.title.ios', { biometricsMethod }),
            t('onboarding.security.alert.biometrics.message.ios', {
              biometricsMethod,
            }),
            [
              { text: t('common.navigation.systemSettings'), onPress: openSettings },
              { text: t('common.button.notNow') },
            ],
          )
        : Alert.alert(
            t('onboarding.security.alert.biometrics.title.android'),
            t('onboarding.security.alert.biometrics.message.android'),
            [{ text: t('onboarding.security.button.setup'), onPress: enroll }, { text: t('common.button.notNow') }],
          )
      return
    }

    const authStatus = await tryLocalAuthenticate()

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      await onPressNext()
    }
  }, [t, biometricsMethod, dispatch, onPressNext])

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
