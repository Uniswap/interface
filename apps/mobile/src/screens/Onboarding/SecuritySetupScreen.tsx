import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BlurView } from 'expo-blur'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Image, Platform, StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import Trace from 'src/components/Trace/Trace'
import { IS_IOS } from 'src/constants/globals'
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
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { SECURITY_SCREEN_BACKGROUND_DARK, SECURITY_SCREEN_BACKGROUND_LIGHT } from 'ui/src/assets'
import FaceIcon from 'ui/src/assets/icons/faceid-thin.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import { borderRadii, imageSizes } from 'ui/src/theme'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { opacify } from 'wallet/src/utils/colors'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { touchId: isTouchIdDevice } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = useBiometricName(isTouchIdDevice)

  const onCompleteOnboarding = useCompleteOnboardingCallback(params.entryPoint, params.importType)

  const onPressNext = useCallback(async () => {
    setShowWarningModal(false)
    await onCompleteOnboarding()
  }, [onCompleteOnboarding])

  const onMaybeLaterPressed = useCallback(async () => {
    if (params?.importType === ImportType.Watch) {
      await onPressNext()
    } else {
      setShowWarningModal(true)
    }
  }, [onPressNext, params?.importType])

  const onPressEnableSecurity = useCallback(async () => {
    const authStatus = await tryLocalAuthenticate({
      // Temporary disabled due to the android AppState forground -> background triggers of biometrics popup with pin fallback
      disableDeviceFallback: Platform.OS === 'android' ? true : false,
      cancelLabel: 'Cancel',
    })

    const authTypeCapitalized =
      authenticationTypeName.charAt(0).toUpperCase() + authenticationTypeName.slice(1)

    if (
      authStatus === BiometricAuthenticationStatus.Unsupported ||
      authStatus === BiometricAuthenticationStatus.MissingEnrollment
    ) {
      IS_IOS
        ? Alert.alert(
            t('{{authTypeCapitalized}} is disabled', { authTypeCapitalized }),
            t('To use {{authenticationTypeName}}, allow access in system settings', {
              authenticationTypeName,
            }),
            [{ text: t('Go to settings'), onPress: openSettings }, { text: t('Not now') }]
          )
        : Alert.alert(
            t('{{authTypeCapitalized}} is disabled', { authTypeCapitalized }),
            t('To use {{authenticationTypeName}}, set up it first in settings', {
              authenticationTypeName,
            }),
            [{ text: t('Set up'), onPress: enroll }, { text: t('Not now') }]
          )
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      await onPressNext()
    }
  }, [t, authenticationTypeName, dispatch, onPressNext])

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
      <OnboardingScreen
        childrenGap="$none"
        subtitle={t(
          'Add an extra layer of security by requiring {{ authenticationTypeName }} to send transactions.',
          {
            authenticationTypeName,
          }
        )}
        title={t('Protect your wallet')}>
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
              intensity={isDarkMode ? (IS_IOS ? 20 : 80) : 40}
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
            <TouchableArea onPress={onMaybeLaterPressed}>
              <Text color="$accent1" textAlign="center" variant="buttonLabel2">
                {t('Maybe later')}
              </Text>
            </TouchableArea>
          </Trace>
          <Trace logPress element={ElementName.Enable}>
            <Button theme="primary" onPress={onPressEnableSecurity}>
              {t('Enable', {
                authenticationTypeName,
              })}
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
