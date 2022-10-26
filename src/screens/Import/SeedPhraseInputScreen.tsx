import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions, IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { isValidMnemonic, isValidWord } from 'src/utils/mnemonics'
import { normalizeTextInput } from 'src/utils/string'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function SeedPhraseInputScreen({ navigation, route: { params } }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  useLockScreenOnBlur()

  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState<string | undefined>(undefined)
  const {
    valid: validWord,
    errorText: errorTextWord,
    tooShort,
  } = isValidWord(value ? normalizeTextInput(value, false) : null, t)
  const [errorTextPhrase, setErrorPhrase] = useState<string | undefined>()

  const showValidation = !focused || (focused && !tooShort)
  const isValid = showValidation && validWord && !errorTextPhrase
  const error = (showValidation && errorTextWord) || errorTextPhrase

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(() => {
    if (validWord && value) {
      // Check phrase validation
      const { valid: validPhrase, errorText } = isValidMnemonic(normalizeTextInput(value, false), t)
      if (!validPhrase) {
        setErrorPhrase(errorText)
        return
      }

      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.Mnemonic,
          mnemonic: value,
          indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
        })
      )
      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    }
  }, [dispatch, navigation, params, t, validWord, value])

  const onChange = (text: string | undefined) => {
    if (errorTextPhrase) {
      setErrorPhrase('')
    }
    setValue(text)
  }

  return (
    <OnboardingScreen
      subtitle={t('Your recovery phrase will only be stored locally on your device.')}
      title={t('Enter your recovery phrase')}>
      <Flex pt="lg">
        <GenericImportForm
          autoCorrect
          liveCheck
          error={error}
          placeholderLabel={t('recovery phrase')}
          showSuccess={isValid}
          value={value}
          onBlur={() => setFocused(false)}
          onChange={onChange}
          onFocus={() => setFocused(true)}
        />
      </Flex>
      <PrimaryButton
        disabled={!validWord}
        label={t('Continue')}
        name={ElementName.Next}
        testID={ElementName.Next}
        textVariant="buttonLabelLarge"
        variant="onboard"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
