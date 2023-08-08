import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName } from 'src/features/telemetry/constants'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { getValidAddress } from 'wallet/src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WatchWallet>

const LIVE_CHECK_DELAY = 1000

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
  const { address: resolvedAddress, name } = useENS(ChainId.Mainnet, normalizedValue, true)
  const isAddress = getValidAddress(normalizedValue, true, false)
  const { isSmartContractAddress, loading } = useIsSmartContractAddress(
    isAddress ?? undefined,
    ChainId.Mainnet
  )

  const onCompleteOnboarding = useCompleteOnboardingCallback(params.entryPoint, params.importType)

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

  const subtitleSize = useResponsiveProp({
    xs: 'bodyMicro',
    sm: 'subheadSmall',
  })

  const addressSize = useResponsiveProp({
    xs: 'buttonLabelMicro',
    sm: 'buttonLabelSmall',
  })

  const itemSpacing = useResponsiveProp({
    xs: 'none',
    sm: 'spacing8',
  })

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Enter an Ethereum wallet address (starting with 0x) or ENS name (ending in .eth).'
      )}
      title={t('Enter a wallet address')}>
      <Flex gap={itemSpacing}>
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
          <Text color="DEP_textTertiary" mx="spacing4" textAlign="center" variant={subtitleSize}>
            Not sure? Try adding{' '}
            <Text color="DEP_accentAction" variant={addressSize} onPress={onPressDemoWallet}>
              uniswapdemo.eth
            </Text>
          </Text>
        </Flex>
      </Flex>
      <Button
        disabled={!isValid}
        label={t('Continue')}
        testID={ElementName.Next}
        onPress={onSubmit}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
