import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { isValidMnemonic } from 'src/utils/mnemonics'
import { normalizeTextInput } from 'src/utils/string'

const IMPORT_WALLET_AMOUNT = 3

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function SeedPhraseInputScreen({ navigation, route: { params } }: Props) {
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
      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    }
  }, [dispatch, navigation, params, valid, value])

  return (
    <OnboardingScreen
      subtitle={t('Your recovery phrase will only be stored locally on your device.')}
      title={t('Enter your recovery phrase')}>
      <Flex pt="lg">
        <GenericImportForm
          liveCheck
          error={errorText}
          placeholderLabel={t('recovery phrase')}
          showSuccess={valid}
          value={value}
          onChange={(text: string | undefined) => setValue(text)}
          onSubmit={() => Keyboard.dismiss()}
        />
      </Flex>
      <PrimaryButton disabled={!valid} label={t('Continue')} variant="onboard" onPress={onSubmit} />
    </OnboardingScreen>
  )
}
