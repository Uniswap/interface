import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthenticationType, supportedAuthenticationTypesAsync } from 'expo-local-authentication'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import FaceIcon from 'src/assets/icons/faceid.svg'
import FingerprintIcon from 'src/assets/icons/fingerprint.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BiometricAuthWarningModal } from 'src/components/Settings/FaceIDWarningModal'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { biometricAuthenticationSuccessful } from 'src/features/biometrics/hooks'
import { setRequiredForTransactions } from 'src/features/biometrics/slice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [isFingerprintDevice, setIsFingerprintDevice] = useState(false)

  useEffect(() => {
    async function getAuthenticationType() {
      const authenticationTypes = await supportedAuthenticationTypesAsync()
      setIsFingerprintDevice(
        authenticationTypes.length === 1 &&
          authenticationTypes.includes(AuthenticationType.FINGERPRINT)
      )
    }
    getAuthenticationType()
  }, [])

  const onPressNext = useCallback(() => {
    setShowWarningModal(false)
    navigation.navigate({ name: OnboardingScreens.Outro, params, merge: true })
  }, [navigation, params])

  const onMaybeLaterPressed = useCallback(() => {
    if (params?.importType === ImportType.Watch) {
      onPressNext()
    } else {
      setShowWarningModal(true)
    }
  }, [onPressNext, params?.importType])

  const onPressEnableSecurity = useCallback(async () => {
    const authStatus = await tryLocalAuthenticate({
      disableDeviceFallback: true,
    })

    if (
      authStatus === BiometricAuthenticationStatus.Unsupported ||
      authStatus === BiometricAuthenticationStatus.MissingEnrollment
    ) {
      Alert.alert(
        isFingerprintDevice ? t('Touch ID is disabled') : t('Face ID is disabled'),
        isFingerprintDevice
          ? t('To use Touch ID, allow access in system settings')
          : t('To use Face ID, allow access in system settings'),
        [{ text: t('Go to settings'), onPress: openSettings }, { text: t('Not now') }]
      )
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      onPressNext()
    }
  }, [isFingerprintDevice, t, dispatch, onPressNext])

  const onCloseModal = useCallback(() => setShowWarningModal(false), [])

  return (
    <>
      {showWarningModal && (
        <BiometricAuthWarningModal
          isFingerprintDevice={isFingerprintDevice}
          onClose={onCloseModal}
          onConfirm={onPressNext}
        />
      )}
      <OnboardingScreen
        childrenGap="none"
        subtitle={
          isFingerprintDevice
            ? t(
                'Make sure that you’re the only person who can access your app or make transactions by turning on Touch ID.'
              )
            : t(
                'Make sure that you’re the only person who can access your app or make transactions by turning on Face ID.'
              )
        }
        title={t('Protect your wallet')}>
        <Flex centered grow>
          <Box borderColor="background3" borderRadius="xl" borderWidth={4} style={styles.iconView}>
            {isFingerprintDevice ? (
              <FingerprintIcon color={theme.colors.textSecondary} height={58} width={58} />
            ) : (
              <FaceIcon color={theme.colors.textSecondary} height={58} width={58} />
            )}
          </Box>
        </Flex>

        <Button
          emphasis={ButtonEmphasis.Tertiary}
          label={t('Maybe later')}
          name={ElementName.Skip}
          onPress={onMaybeLaterPressed}
        />

        <Button
          label={isFingerprintDevice ? t('Turn on Touch ID') : t('Turn on Face ID')}
          name={ElementName.Enable}
          onPress={onPressEnableSecurity}
        />
      </OnboardingScreen>
    </>
  )
}

const styles = StyleSheet.create({
  iconView: {
    paddingBottom: 94,
    paddingHorizontal: 32,
    paddingTop: 70,
  },
})
