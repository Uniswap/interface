import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { TFunction } from 'i18next'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Text } from 'ui/src'
import { Eye, GraduationCap } from 'ui/src/components/icons'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { createViewOnlyAccount } from 'wallet/src/features/onboarding/createViewOnlyAccount'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/send/hooks/useIsSmartContractAddress'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

const LIVE_CHECK_DELAY = 1000

const validateForm = ({
  validAddress,
  name,
  walletExists,
  loading,
  isSmartContractAddress,
  isValidSmartContract,
}: {
  validAddress: string | null
  name: string | null
  walletExists: boolean
  loading: boolean
  isSmartContractAddress: boolean
  isValidSmartContract: boolean
}): boolean => {
  return (!!validAddress || !!name) && !walletExists && !loading && (!isSmartContractAddress || isValidSmartContract)
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

  useNavigationHeader(navigation)

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const hasSuffixIncluded = normalizedValue.includes('.')
  const { address: resolvedAddress, name } = useENS(UniverseChainId.Mainnet, normalizedValue, !hasSuffixIncluded)
  const validAddress = getValidAddress(normalizedValue, true, false)
  const { isSmartContractAddress, loading } = useIsSmartContractAddress(
    (validAddress || resolvedAddress) ?? undefined,
    UniverseChainId.Mainnet,
  )
  const address = isSmartContractAddress ? (validAddress || resolvedAddress) ?? undefined : undefined
  // Allow smart contracts with non-null balances
  const { data: balancesById } = usePortfolioBalances({
    address,
    fetchPolicy: 'cache-and-network',
  })
  const isValidSmartContract = isSmartContractAddress && !!balancesById

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const walletExists = Object.keys(initialAccounts.current).some(
    (accountAddress) =>
      areAddressesEqual(accountAddress, resolvedAddress) || areAddressesEqual(accountAddress, validAddress),
  )

  // Form validation.
  const isValid = validateForm({
    validAddress,
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
    <SafeKeyboardOnboardingScreen Icon={Eye} title={t('account.wallet.watch.title')}>
      <Flex $short={{ gap: '$none' }} gap="$spacing12">
        <GenericImportForm
          blurOnSubmit
          errorMessage={errorText}
          inputAlignment="flex-start"
          inputSuffix={validAddress || hasSuffixIncluded ? undefined : '.eth'}
          liveCheck={showLiveCheck}
          placeholderLabel={t('account.wallet.watch.placeholder')}
          shouldUseMinHeight={false}
          textAlign="left"
          value={value}
          onChange={onChange}
          onSubmit={(): void => {
            if (isValid) {
              dismissNativeKeyboard()
            }
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
      <Button disabled={!isValid} mt="$spacing24" testID={TestID.Next} onPress={onSubmit}>
        {t('common.button.continue')}
      </Button>
    </SafeKeyboardOnboardingScreen>
  )
}
