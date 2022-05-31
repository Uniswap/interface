import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { isValidEnsName } from 'src/features/ens/parseENSAddress'
import { useENSAddress } from 'src/features/ens/useENSAddress'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { isValidAddress } from 'src/utils/addresses'
import { normalizeTextInput } from 'src/utils/string'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

export function WatchWalletScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const name = isValidEnsName(normalizedValue) ? normalizedValue : undefined
  const { address: resolvedAddress } = useENSAddress(ChainId.Mainnet, name)

  // Form validation.
  const isValid = isValidAddress(normalizedValue) || (name && resolvedAddress)
  const errorText = !isValid ? t('Address does not exist') : undefined

  const onSubmit = useCallback(() => {
    if (isValid && value) {
      if (resolvedAddress) {
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.Address,
            address: resolvedAddress,
          })
        )
      } else {
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.Address,
            address: normalizedValue,
          })
        )
      }
      navigation.navigate(OnboardingScreens.Notifications)
    }
  }, [dispatch, isValid, navigation, normalizedValue, resolvedAddress, value])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={0}
      subtitle={t('Enter an Ethereum wallet address or ENS name.')}
      title={t('Enter a wallet address')}>
      <KeyboardAvoidingView behavior="padding" style={flex.fill}>
        <Flex pt="lg">
          <GenericImportForm
            error={errorText}
            placeholderLabel="address or ENS"
            value={value}
            onChange={(text: string | undefined) => setValue(text)}
          />
        </Flex>
      </KeyboardAvoidingView>
      <PrimaryButton
        disabled={!isValid}
        label={t('Next')}
        py="md"
        textColor="white"
        textVariant="mediumLabel"
        variant="blue"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
