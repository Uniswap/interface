import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { isValidPrivateKey } from 'src/utils/privateKeys'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.PrivateKeyInput>

export function PrivateKeyInputScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [value, setValue] = useState<string | undefined>(undefined)
  const valid = isValidPrivateKey(value ?? '')
  const errorText = valid ? undefined : t('Invalid private key')

  const onSubmit = useCallback(() => {
    if (valid && value) {
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.PrivateKey,
          privateKey: value,
        })
      )
      navigation.navigate(OnboardingScreens.EditName)
    }
  }, [dispatch, navigation, valid, value])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={0}
      subtitle={t('Your private key will only be stored locally on your device.')}
      title={t('Enter your private key')}>
      <KeyboardAvoidingView behavior="padding" style={flex.fill}>
        <Flex pt="lg">
          <GenericImportForm
            error={errorText}
            placeholderLabel={t('private key')}
            value={value}
            onChange={(text: string | undefined) => setValue(text)}
          />
        </Flex>
      </KeyboardAvoidingView>
      <PrimaryButton
        disabled={!valid}
        label={t('Next')}
        py="md"
        textColor="white"
        textVariant="mediumLabel"
        variant="blue"
        onPress={() => onSubmit()}
      />
    </OnboardingScreen>
  )
}
