import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
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
  const { address: resolvedAddress, name } = useENS(ChainId.Mainnet, normalizedValue, true)
  const isAddress = isValidAddress(normalizedValue)

  // Form validation.
  const isValid = isAddress || name
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

  const onChange = (text: string | undefined) => {
    setValue(text?.trim())
  }

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={0}
      subtitle={t('Enter an Ethereum wallet address or ENS name.')}
      title={t('Enter a wallet address')}>
      <Flex pt="lg">
        <GenericImportForm
          endAdornment={isAddress ? undefined : '.eth'}
          error={errorText}
          placeholderLabel="address or ENS"
          showSuccess={Boolean(isValid)}
          value={value}
          onChange={onChange}
          onSubmit={() => Keyboard.dismiss()}
        />
      </Flex>
      <PrimaryButton disabled={!isValid} label={t('Next')} variant="onboard" onPress={onSubmit} />
    </OnboardingScreen>
  )
}
