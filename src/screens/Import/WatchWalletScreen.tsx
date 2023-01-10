import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { useAccounts } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { getValidAddress } from 'src/utils/addresses'
import { normalizeTextInput } from 'src/utils/string'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

const LIVE_CHECK_DELAY = 1000

export function WatchWalletScreen({ navigation, route: { params } }: Props): ReactElement {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const accounts = useAccounts()
  const importedAddresses = Object.keys(accounts)

  useEffect(() => {
    const shouldRenderBackButton = navigation.getState().index === 0
    if (shouldRenderBackButton) {
      navigation.setOptions({
        headerLeft: () => <BackButton />,
      })
    }
  }, [navigation, theme.colors.textPrimary])

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const { address: resolvedAddress, name } = useENS(ChainId.Mainnet, normalizedValue, true)
  const isAddress = getValidAddress(normalizedValue, true, false)
  const { isSmartContractAddress, loading } = useIsSmartContractAddress(
    isAddress ?? undefined,
    ChainId.Mainnet
  )

  // Form validation.
  const walletExists =
    (resolvedAddress && importedAddresses.includes(resolvedAddress)) ||
    importedAddresses.includes(normalizedValue)
  const isValid = (isAddress || name) && !walletExists && !loading && !isSmartContractAddress

  let errorText
  if (!isValid && walletExists) {
    errorText = t('This address is already imported')
  } else if (!isValid && isSmartContractAddress) {
    errorText = t('Address is a smart contract')
  } else if (!isValid && !loading) {
    errorText = t('Address does not exist')
  }

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
      navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
    }
  }, [dispatch, isValid, navigation, normalizedValue, params, resolvedAddress, value])

  const onChange = (text: string | undefined): void => {
    if (value !== text?.trim()) {
      setShowLiveCheck(false)
    }
    setValue(text?.trim())
  }

  const onPressDemoWallet = (): void => {
    setValue('uniswapdemo')
    setShowLiveCheck(false)
  }

  useEffect(() => {
    const delayFn = setTimeout(() => {
      setShowLiveCheck(true)
    }, LIVE_CHECK_DELAY)

    return () => {
      clearTimeout(delayFn)
    }
  }, [value])

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Enter an Ethereum wallet address (starting with 0x) or ENS name (ending in .eth).'
      )}
      title={t('Enter a wallet address')}>
      <Flex gap="xs" pt="lg">
        <GenericImportForm
          blurOnSubmit
          errorMessage={errorText}
          inputSuffix={isAddress ? undefined : '.eth'}
          liveCheck={showLiveCheck}
          placeholderLabel="address or ENS"
          showSuccess={Boolean(isValid)}
          value={value}
          onChange={onChange}
          onSubmit={(): void => {
            isValid && Keyboard.dismiss()
          }}
        />
        <Flex>
          <Text color="textTertiary" mx="xxs" textAlign="center" variant="subheadSmall">
            Not sure? Try adding{' '}
            <Text color="accentAction" variant="buttonLabelSmall" onPress={onPressDemoWallet}>
              uniswapdemo.eth
            </Text>
          </Text>
        </Flex>
      </Flex>
      <Button
        disabled={!isValid}
        label={t('Continue')}
        name={ElementName.Next}
        onPress={onSubmit}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
