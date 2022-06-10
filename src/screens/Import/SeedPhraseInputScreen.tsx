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
import { isValidMnemonic } from 'src/utils/mnemonics'
import { normalizeTextInput } from 'src/utils/string'

const IMPORT_WALLET_AMOUNT = 3

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function SeedPhraseInputScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const [value, setValue] = useState<string | undefined>(undefined)
  const { valid, errorText } = isValidMnemonic(value ? normalizeTextInput(value) : null, t)

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(() => {
    if (valid && value) {
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.Mnemonic,
          mnemonic: value,
          indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
        })
      )
      navigation.navigate(OnboardingScreens.SelectWallet)
    }
  }, [dispatch, navigation, valid, value])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={0}
      subtitle={t('Your seed phrase will only be stored locally on your device.')}
      title={t('Enter your seed phrase')}>
      <KeyboardAvoidingView behavior="padding" style={flex.fill}>
        <Flex pt="lg">
          <GenericImportForm
            error={errorText}
            placeholderLabel={t('seed phrase')}
            showSuccess={valid}
            value={value}
            onChange={(text: string | undefined) => setValue(text)}
            onSubmit={onSubmit}
          />
        </Flex>
      </KeyboardAvoidingView>
      <PrimaryButton
        disabled={!valid}
        label={t('Next')}
        variant="onboard"
        onPress={() => onSubmit()}
      />
    </OnboardingScreen>
  )
}
