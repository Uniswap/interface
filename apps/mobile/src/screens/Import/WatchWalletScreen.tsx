import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { TFunction } from 'i18next'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Text } from 'ui/src'
import { Eye, GraduationCap } from 'ui/src/components/icons'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { createViewOnlyAccount } from 'wallet/src/features/onboarding/createViewOnlyAccount'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

const LIVE_CHECK_DELAY = 1000

const validateForm = ({
  validAddress,
  name,
  walletExists,
  isLoading,
  isSmartContractAddress,
  isValidSmartContract,
}: {
  validAddress: string | null
  name: string | null
  walletExists: boolean
  isLoading: boolean
  isSmartContractAddress: boolean
  isValidSmartContract: boolean
}): boolean => {
  return (!!validAddress || !!name) && !walletExists && !isLoading && (!isSmartContractAddress || isValidSmartContract)
}

const getErrorText = ({
  walletExists,
  isSmartContractAddress,
  isLoading,
  t,
}: {
  walletExists: boolean
  isSmartContractAddress: boolean
  isLoading: boolean
  t: TFunction
}): string | undefined => {
  if (walletExists) {
    return t('account.wallet.watch.error.alreadyImported')
  } else if (isSmartContractAddress) {
    return t('account.wallet.watch.error.smartContract')
  } else if (!isLoading) {
    return t('account.wallet.watch.error.notFound')
  }
  return undefined
}

export function WatchWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const accounts = useAccounts()
  const initialAccounts = useRef(accounts)
  const { defaultChainId } = useEnabledChains()

  useNavigationHeader(navigation)

  // Form values.
  const [value, setValue] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  // ENS and address parsing.
  const normalizedValue = normalizeTextInput(value ?? '')
  const hasSuffixIncluded = normalizedValue.includes('.')
  const { address: resolvedAddress, name } = useENS({
    nameOrAddress: normalizedValue,
    autocompleteDomain: !hasSuffixIncluded,
  })
  // TODO(WALL-7065): Handle SVM address validation as well
  const validAddress = getValidAddress({
    address: normalizedValue,
    platform: Platform.EVM,
    withEVMChecksum: true,
    log: false,
  })
  const { isSmartContractAddress, loading: isLoading } = useIsSmartContractAddress(
    (validAddress || resolvedAddress) ?? undefined,
    defaultChainId,
  )
  const address = isSmartContractAddress ? ((validAddress || resolvedAddress) ?? undefined) : undefined
  // Allow smart contracts with non-null balances
  const { data: balancesById } = usePortfolioBalances({
    evmAddress: address,
    fetchPolicy: 'cache-and-network',
  })
  const isValidSmartContract = isSmartContractAddress && !!balancesById

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const walletExists = Object.keys(initialAccounts.current).some(
    (accountAddress) =>
      // TODO(WALL-7065): Update to support solana
      areAddressesEqual({
        addressInput1: { address: accountAddress, platform: Platform.EVM },
        addressInput2: { address: resolvedAddress, platform: Platform.EVM },
      }) ||
      areAddressesEqual({
        addressInput1: { address: accountAddress, platform: Platform.EVM },
        addressInput2: { address: validAddress, platform: Platform.EVM },
      }),
  )

  // Form validation.
  const isValid = validateForm({
    validAddress,
    name,
    walletExists,
    isLoading,
    isSmartContractAddress,
    isValidSmartContract,
  })

  const errorText = !isValid ? getErrorText({ walletExists, isSmartContractAddress, isLoading, t }) : undefined

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only want to reset timer on value change
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
          inputSuffix={validAddress || hasSuffixIncluded ? undefined : ENS_SUFFIX}
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
      <Flex row>
        <Button
          testID={TestID.Next}
          mt="$spacing24"
          isDisabled={!isValid}
          variant="branded"
          size="large"
          onPress={onSubmit}
        >
          {t('common.button.continue')}
        </Button>
      </Flex>
    </SafeKeyboardOnboardingScreen>
  )
}
