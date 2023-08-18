import { BlurView } from '@react-native-community/blur'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Image, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import {
  biometricAuthenticationSuccessful,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { setRequiredForTransactions } from 'src/features/biometrics/slice'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { opacify } from 'src/utils/colors'
import { openSettings } from 'src/utils/linking'
import { SECURITY_SCREEN_BACKGROUND_DARK, SECURITY_SCREEN_BACKGROUND_LIGHT } from 'ui/src/assets'
import FaceIcon from 'ui/src/assets/icons/faceid-thin.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import { theme as FixedTheme } from 'ui/src/theme/restyle'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { touchId: isTouchIdDevice } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = isTouchIdDevice ? 'Touch' : 'Face'

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
      disableDeviceFallback: true,
      cancelLabel: 'Cancel',
    })

    if (
      authStatus === BiometricAuthenticationStatus.Unsupported ||
      authStatus === BiometricAuthenticationStatus.MissingEnrollment
    ) {
      Alert.alert(
        t('{{authenticationTypeName}} ID is disabled', { authenticationTypeName }),
        t('To use {{authenticationTypeName}} ID, allow access in system settings', {
          authenticationTypeName,
        }),
        [{ text: t('Go to settings'), onPress: openSettings }, { text: t('Not now') }]
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
        childrenGap="none"
        subtitle={t(
          'Add an extra layer of security by requiring {{ authenticationTypeName }} ID to send transactions.',
          {
            authenticationTypeName,
          }
        )}
        title={t('Protect your wallet')}>
        <Flex centered shrink my="spacing12" position="relative" py="spacing24">
          <Box paddingTop="spacing24">
            <SecurityBackgroundImage />
          </Box>
          <Box
            borderRadius="rounded16"
            borderWidth={1}
            overflow="hidden"
            padding="spacing36"
            position="absolute"
            style={{
              borderColor: opacify(15, theme.colors.sporeWhite),
              backgroundColor: opacify(35, theme.colors.surface1),
            }}
            top={0}>
            <BlurView
              blurAmount={5}
              blurType="dark"
              reducedTransparencyFallbackColor="black"
              style={styles.blurView}
            />
            {isTouchIdDevice ? (
              <FingerprintIcon
                color={theme.colors.sporeWhite}
                height={theme.imageSizes.image48}
                width={theme.imageSizes.image48}
              />
            ) : (
              <FaceIcon
                color={theme.colors.sporeWhite}
                height={theme.imageSizes.image48}
                width={theme.imageSizes.image48}
              />
            )}
          </Box>
        </Flex>
        <Flex gap="spacing24">
          <Trace logPress element={ElementName.Skip}>
            <TouchableArea onPress={onMaybeLaterPressed}>
              <Text color="accent1" textAlign="center" variant="buttonLabelMedium">
                {t('Maybe later')}
              </Text>
            </TouchableArea>
          </Trace>
          <Trace logPress element={ElementName.Enable}>
            <Button
              emphasis={ButtonEmphasis.Primary}
              label={t('Turn on {{authenticationTypeName}} ID', {
                authenticationTypeName,
              })}
              onPress={onPressEnableSecurity}
            />
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
      source={isDarkMode ? SECURITY_SCREEN_BACKGROUND_DARK : SECURITY_SCREEN_BACKGROUND_LIGHT}
      style={styles.image}
    />
  )
}

const styles = StyleSheet.create({
  blurView: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FixedTheme.borderRadii.rounded16,
  },
  image: {
    height: '100%',
    resizeMode: 'contain',
  },
})
