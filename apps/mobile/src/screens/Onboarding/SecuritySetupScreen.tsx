import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BlurView } from 'expo-blur'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Image, Platform, StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import Trace from 'src/components/Trace/Trace'
import {
  BiometricAuthenticationStatus,
  enroll,
  tryLocalAuthenticate,
} from 'src/features/biometrics'
import {
  biometricAuthenticationSuccessful,
  useBiometricName,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { setRequiredForTransactions } from 'src/features/biometrics/slice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { Button, Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { SECURITY_SCREEN_BACKGROUND_DARK, SECURITY_SCREEN_BACKGROUND_LIGHT } from 'ui/src/assets'
import FaceIcon from 'ui/src/assets/icons/faceid-thin.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import { borderRadii, imageSizes } from 'ui/src/theme'
import { isIOS } from 'uniswap/src/utils/platform'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { ElementName } from 'wallet/src/telemetry/constants'
import { opacify } from 'wallet/src/utils/colors'
import { openSettings } from 'wallet/src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()

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

  const onMaybeLaterPressed = useCallback(async () => {
    if (params?.importType === ImportType.Watch) {
      await onPressNext()
    } else {
      setShowWarningModal(true)
    }
  }, [onPressNext, params?.importType])

  const onPressEnableSecurity = useCallback(async () => {
    const authStatus = await tryLocalAuthenticate()

    if (
      authStatus === BiometricAuthenticationStatus.Unsupported ||
      authStatus === BiometricAuthenticationStatus.MissingEnrollment
    ) {
      isIOS
        ? Alert.alert(
            t('onboarding.security.alert.biometrics.title.ios', { biometricsMethod }),
            t('onboarding.security.alert.biometrics.message.ios', {
              biometricsMethod,
            }),
            [
              { text: t('common.navigation.systemSettings'), onPress: openSettings },
              { text: t('common.button.notNow') },
            ]
          )
        : Alert.alert(
            t('onboarding.security.alert.biometrics.title.android'),
            t('onboarding.security.alert.biometrics.message.android'),
            [
              { text: t('onboarding.security.button.setup'), onPress: enroll },
              { text: t('common.button.notNow') },
            ]
          )
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      await onPressNext()
    }
  }, [t, biometricsMethod, dispatch, onPressNext])

  const onCloseModal = useCallback(() => setShowWarningModal(false), [])

  return (
    <>
      {showWarningModal && (
        <BiometricAuthWarningModal
          isTouchIdDevice={isTouchIdDevice}
          onClose={onCloseModal}
          onConfirm={onPressNext}
        />
      )}
      {isLoadingAccount && (
        <Flex
          centered
          mt="$spacing60"
          position="absolute"
          pt="$spacing36"
          width="100%"
          zIndex={100}>
          <ActivityIndicator color={colors.sporeWhite.val} />
        </Flex>
      )}
      <OnboardingScreen
        childrenGap="$none"
        subtitle={
          isIOS
            ? t('onboarding.security.subtitle.ios', {
                biometricsMethod,
              })
            : t('onboarding.security.subtitle.android')
        }
        title={t('onboarding.security.title')}>
        <Flex centered shrink gap="$spacing16" my="$spacing12" position="relative" py="$spacing24">
          <Flex pt="$spacing24">
            <SecurityBackgroundImage />
          </Flex>
          <Flex
            borderRadius="$rounded16"
            borderWidth={1}
            overflow="hidden"
            p="$spacing36"
            position="absolute"
            style={{
              borderColor: opacify(15, colors.sporeWhite.val),
              backgroundColor: opacify(35, colors.surface1.val),
            }}
            top={0}>
            <BlurView
              intensity={isDarkMode ? (isIOS ? 20 : 80) : 40}
              style={styles.blurView}
              tint="dark"
            />
            {isTouchIdDevice ? (
              <FingerprintIcon
                color={colors.sporeWhite.val}
                height={imageSizes.image48}
                width={imageSizes.image48}
              />
            ) : (
              <FaceIcon
                color={colors.sporeWhite.val}
                height={imageSizes.image48}
                width={imageSizes.image48}
              />
            )}
          </Flex>
        </Flex>
        <Flex gap="$spacing24">
          <Trace logPress element={ElementName.Skip}>
            <TouchableArea testID={ElementName.Skip} onPress={onMaybeLaterPressed}>
              <Text color="$accent1" textAlign="center" variant="buttonLabel2">
                {t('common.button.later')}
              </Text>
            </TouchableArea>
          </Trace>
          <Trace logPress element={ElementName.Enable}>
            <Button theme="primary" onPress={onPressEnableSecurity}>
              {isIOS
                ? t('onboarding.security.button.confirm.ios', { biometricsMethod })
                : t('onboarding.security.button.confirm.android')}
            </Button>
          </Trace>
        </Flex>
      </OnboardingScreen>
    </>
  )
}

const SecurityBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  return (
    <Image
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
  blurView: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadii.rounded16,
  },
  image: {
    height: '100%',
    resizeMode: 'contain',
  },
})
