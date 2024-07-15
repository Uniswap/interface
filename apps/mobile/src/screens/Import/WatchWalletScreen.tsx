import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { TFunction } from 'i18next'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button, Flex, Text } from 'ui/src'
import { GraduationCap } from 'ui/src/components/icons'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { useENS } from 'wallet/src/features/ens/useENS'
import { createViewOnlyAccount } from 'wallet/src/features/onboarding/createViewOnlyAccount'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/transfer/hooks/useIsSmartContractAddress'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

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
  return (!!isAddress || !!name) && !walletExists && !loading && (!isSmartContractAddress || isValidSmartContract)
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
    return t('account.wallet.watch.error.alreadyImported')
  } else if (isSmartContractAddress) {
    return t('account.wallet.watch.error.smartContract')
  } else if (!loading) {
    return t('account.wallet.watch.error.notFound')
  }
  return undefined
}

export function WatchWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const accounts = useAccounts()
  const initialAccounts = useRef(accounts)

  useAddBackButton(navigation)

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const hasSuffixIncluded = normalizedValue.includes('.')
  const { address: resolvedAddress, name } = useENS(UniverseChainId.Mainnet, normalizedValue, !hasSuffixIncluded)
  const isAddress = getValidAddress(normalizedValue, true, false)
  const { isSmartContractAddress, loading } = useIsSmartContractAddress(
    (isAddress || resolvedAddress) ?? undefined,
    UniverseChainId.Mainnet,
  )
  // Allow smart contracts with non-null balances
  const { data: balancesById } = usePortfolioBalances({
    address: isSmartContractAddress ? (isAddress || resolvedAddress) ?? undefined : undefined,
    fetchPolicy: 'cache-and-network',
  })
  const isValidSmartContract = isSmartContractAddress && !!balancesById

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const walletExists = Object.keys(initialAccounts).some(
    (accountAddress) =>
      areAddressesEqual(accountAddress, resolvedAddress) || areAddressesEqual(accountAddress, normalizedValue),
  )

  // Form validation.
  const isValid = validateForm({
    isAddress,
    name,
    walletExists,
    loading,
    isSmartContractAddress,
    isValidSmartContract,
  })

  const errorText = !isValid ? getErrorText({ walletExists, isSmartContractAddress, loading, t }) : undefined

  const onSubmit = useCallback(async () => {
    if (isValid && value) {
      const viewOnlyAddress = resolvedAddress || normalizedValue
      const viewOnlyAccount = createViewOnlyAccount(viewOnlyAddress)

      dispatch(
        createAccountsActions.trigger({
          accounts: [viewOnlyAccount],
        }),
      )

      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
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
    <SafeKeyboardOnboardingScreen title={t('account.wallet.watch.title')}>
      <Flex $short={{ gap: '$none' }} gap="$spacing12">
        <GenericImportForm
          blurOnSubmit
          errorMessage={errorText}
          inputAlignment="flex-start"
          inputSuffix={isAddress || hasSuffixIncluded ? undefined : '.eth'}
          liveCheck={showLiveCheck}
          placeholderLabel={t('account.wallet.watch.placeholder')}
          shouldUseMinHeight={false}
          textAlign="left"
          value={value}
          onChange={onChange}
          onSubmit={(): void => {
            isValid && Keyboard.dismiss()
          }}
        />
        <Flex
          grow
          row
          alignItems="center"
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          gap="$spacing16"
          p="$spacing16"
        >
          <GraduationCap color="$neutral2" size="$icon.20" />
          <Text color="$neutral2" flexShrink={1} variant="body3">
            {t('account.wallet.watch.message')}
          </Text>
        </Flex>
      </Flex>
      <Button disabled={!isValid} testID={TestID.Next} onPress={onSubmit}>
        {t('common.button.continue')}
      </Button>
    </SafeKeyboardOnboardingScreen>
  )
}
