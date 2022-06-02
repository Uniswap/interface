import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, KeyboardAvoidingView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { isValidMnemonic } from 'src/utils/mnemonics'
import { SagaStatus } from 'src/utils/saga'
import { normalizeTextInput } from 'src/utils/string'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const IMPORT_WALLET_AMOUNT = 5

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function SeedPhraseInputScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const [value, setValue] = useState<string | undefined>(undefined)
  const { valid, errorText } = isValidMnemonic(value ? normalizeTextInput(value) : null, t)

  const accounts = useAccounts()
  const nativeAccountAddresses = Object.values(accounts)
    .filter((a) => a.type === AccountType.Native)
    .map((a) => a.address)

  // when accounts finished adding, navigate to wallet selection page
  const { status } = useSagaStatus(importAccountSagaName, () =>
    navigation.navigate(OnboardingScreens.SelectWallet, { addresses: nativeAccountAddresses })
  )
  const loadingAccounts = status === SagaStatus.Started

  // add all accounst from mnemonic
  const onSubmit = useCallback(() => {
    if (valid && value) {
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.Mnemonic,
          mnemonic: value,
          indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
        })
      )
    }
  }, [dispatch, valid, value])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={0}
      subtitle={t('Your seed phrase will only be stored locally on your device.')}
      title={t('Enter your seed phrase')}>
      {loadingAccounts ? (
        <ActivityIndicator />
      ) : (
        <KeyboardAvoidingView behavior="padding" style={flex.fill}>
          <Flex pt="lg">
            <GenericImportForm
              error={errorText}
              placeholderLabel={t('seed phrase')}
              value={value}
              onChange={(text: string | undefined) => setValue(text)}
            />
          </Flex>
        </KeyboardAvoidingView>
      )}
      <PrimaryButton
        disabled={!valid || loadingAccounts}
        label={t('Next')}
        variant="onboard"
        onPress={() => onSubmit()}
      />
    </OnboardingScreen>
  )
}
