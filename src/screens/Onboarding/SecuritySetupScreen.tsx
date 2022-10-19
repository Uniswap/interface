import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import FaceIcon from 'src/assets/icons/faceid.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { biometricAuthenticationSuccessful } from 'src/features/biometrics/hooks'
import { setRequiredForTransactions } from 'src/features/biometrics/slice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Security>

export function SecuritySetupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPressNext = () => {
    navigation.navigate({ name: OnboardingScreens.Outro, params, merge: true })
  }

  const onPressEnableSecurity = async () => {
    const authStatus = await tryLocalAuthenticate({
      disableDeviceFallback: true,
    })

    if (
      authStatus === BiometricAuthenticationStatus.Unsupported ||
      authStatus === BiometricAuthenticationStatus.MissingEnrollment
    ) {
      Alert.alert(t('Face ID is disabled'), t('To use Face ID, allow access in system settings'), [
        { text: t('Go to settings'), onPress: openSettings },
        {
          text: t('Not now'),
        },
      ])
    }

    if (biometricAuthenticationSuccessful(authStatus)) {
      dispatch(setRequiredForTransactions(true))
      onPressNext()
    }
  }

  return (
    <OnboardingScreen
      subtitle={t(
        'Make sure that you’re the only person who can access your app or make transactions by turning on Face ID.'
      )}
      title={t('Protect your wallet')}>
      <Flex grow alignItems="center" justifyContent="space-between">
        <Flex centered grow>
          <Box
            borderColor="backgroundAction"
            borderRadius="xl"
            borderWidth={4}
            style={styles.faceView}>
            <FaceIcon color={theme.colors.textSecondary} height={58} width={58} />
          </Box>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end" width="100%">
          <TextButton
            alignSelf="stretch"
            borderColor="backgroundOutline"
            borderRadius="lg"
            borderWidth={1}
            name={ElementName.Skip}
            px="md"
            py="md"
            testID={ElementName.Skip}
            textAlign="center"
            textColor="textPrimary"
            textVariant="buttonLabelMedium"
            onPress={onPressNext}>
            {t('Maybe later')}
          </TextButton>

          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on Face ID')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            variant="onboard"
            onPress={onPressEnableSecurity}
          />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

const styles = StyleSheet.create({
  faceView: {
    paddingBottom: 94,
    paddingHorizontal: 32,
    paddingTop: 70,
  },
})
