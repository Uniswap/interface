import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect, useState } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName } from 'src/features/telemetry/constants'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button, Flex } from 'ui/src'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { ChainId } from 'wallet/src/constants/chains'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { useENS } from 'wallet/src/features/ens/useENS'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { getValidAddress } from 'wallet/src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

const LIVE_CHECK_DELAY = 1000

const validateForm = ({
  isAddress,
  name,
  walletExists,
  loading,
  isSmartContractAddress,
  isValidSmartContract,
}: {
  isAddress: string | null
  name: string | null
  walletExists: boolean
  loading: boolean
  isSmartContractAddress: boolean
  isValidSmartContract: boolean
}): boolean => {
  return (
    (!!isAddress || !!name) &&
    !walletExists &&
    !loading &&
    (!isSmartContractAddress || isValidSmartContract)
  )
}

const getErrorText = ({
  walletExists,
  isSmartContractAddress,
  loading,
  t,
}: {
  walletExists: boolean
  isSmartContractAddress: boolean
  loading: boolean
  t: TFunction
}): string | undefined => {
  if (walletExists) {
    return t('This address is already imported')
  } else if (isSmartContractAddress) {
    return t('Address is a smart contract')
  } else if (!loading) {
    return t('Address does not exist')
  }
  return undefined
}

export function WatchWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const accounts = useAccounts()
  const importedAddresses = Object.keys(accounts)

  useAddBackButton(navigation)

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const hasSuffixIncluded = normalizedValue.includes('.')
  const { address: resolvedAddress, name } = useENS(
    ChainId.Mainnet,
    normalizedValue,
    !hasSuffixIncluded
  )
  const isAddress = getValidAddress(normalizedValue, true, false)
  const { isSmartContractAddress, loading } = useIsSmartContractAddress(
    (isAddress || resolvedAddress) ?? undefined,
    ChainId.Mainnet
  )
  // Allow smart contracts with non-null balances
  const { data: balancesById } = usePortfolioBalances({
    address: isSmartContractAddress ? (isAddress || resolvedAddress) ?? undefined : undefined,
    shouldPoll: false,
    fetchPolicy: 'cache-and-network',
  })
  const isValidSmartContract = isSmartContractAddress && !!balancesById

  const onCompleteOnboarding = useCompleteOnboardingCallback(params.entryPoint, params.importType)

  // Form validation.
  const walletExists =
    (resolvedAddress && importedAddresses.includes(resolvedAddress)) ||
    importedAddresses.includes(normalizedValue)
  const isValid = validateForm({
    isAddress,
    name,
    walletExists,
    loading,
    isSmartContractAddress,
    isValidSmartContract,
  })

  const errorText = !isValid
    ? getErrorText({ walletExists, isSmartContractAddress, loading, t })
    : undefined

  const onSubmit = useCallback(async () => {
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
      sendMobileAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        screen: OnboardingScreens.WatchWallet,
        element: ElementName.Continue,
      })
      await onCompleteOnboarding()
    }
  }, [dispatch, isValid, normalizedValue, onCompleteOnboarding, resolvedAddress, value])

  const onChange = (text: string | undefined): void => {
    if (value !== text?.trim()) {
      setShowLiveCheck(false)
    }
    setValue(text?.trim())
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
      <Flex $short={{ gap: '$none' }} gap="$spacing8">
        <GenericImportForm
          blurOnSubmit
          errorMessage={errorText}
          inputSuffix={isAddress || hasSuffixIncluded ? undefined : '.eth'}
          liveCheck={showLiveCheck}
          placeholderLabel={t('Enter address or ENS')}
          showSuccess={Boolean(isValid)}
          value={value}
          onChange={onChange}
          onSubmit={(): void => {
            isValid && Keyboard.dismiss()
          }}
        />
      </Flex>
      <Button disabled={!isValid} testID={ElementName.Next} onPress={onSubmit}>
        {t('Continue')}
      </Button>
    </SafeKeyboardOnboardingScreen>
  )
}
