import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import FaceIcon from 'src/assets/icons/faceid.svg'
import FingerprintIcon from 'src/assets/icons/fingerprint.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import {
  biometricAuthenticationSuccessful,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { setRequiredForTransactions } from 'src/features/biometrics/slice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { touchId: isTouchIdDevice } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = isTouchIdDevice ? 'Touch' : 'Face'

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
        t('{{authenticationTypeName}} ID is disabled', { authenticationTypeName }),
        t('To use {{authenticationTypeName}} ID, allow access in system settings', {
          authenticationTypeName,
        }),
        [{ text: t('Go to settings'), onPress: openSettings }, { text: t('Not now') }]
      )
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      onPressNext()
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
        subtitle={t('{{ authenticationTypeName }} ID will be required to make transactions.', {
          authenticationTypeName,
        })}
        title={t('Protect your wallet')}>
        <Flex centered grow>
          <Box
            borderColor="background3"
            borderRadius="rounded20"
            borderWidth={4}
            style={styles.iconView}>
            {isTouchIdDevice ? (
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
          label={t('Turn on {{authenticationTypeName}} ID', { authenticationTypeName })}
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
