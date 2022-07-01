import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { LongPressButton } from 'src/components/buttons/LongPressButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Arrow } from 'src/components/icons/Arrow'
import { AmountInput } from 'src/components/input/AmountInput'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import {
  useDerivedSwapInfo,
  useSwapCallback,
  useUpdateSwapGasEstimate,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { getHumanReadableSwapInputStatus } from 'src/features/transactions/swap/validate'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface SwapFormProps {
  state: TransactionState
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
}

// TODO:
// -check erc20 permits
// -handle price impact too high
// TODO: token warnings
export function SwapReview({ state, dispatch, onNext, onPrev }: SwapFormProps) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const theme = useAppTheme()

  const {
    currencies,
    currencyAmounts,
    formattedAmounts,
    trade: { trade: trade },
    wrapType,
    isUSDInput = false,
  } = derivedSwapInfo

  useUpdateSwapGasEstimate(dispatch, trade)
  const { gasSpendEstimate, gasPrice, exactApproveRequired } = state
  const swapInputStatusMessage = getHumanReadableSwapInputStatus(activeAccount, derivedSwapInfo, t)
  const swapDisabled = Boolean(!(isWrapAction(wrapType) || trade) || swapInputStatusMessage)

  const { swapCallback } = useSwapCallback(
    trade,
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    onNext
  )

  const { wrapCallback } = useWrapCallback(currencyAmounts[CurrencyField.INPUT], wrapType, onNext)

  if (!currencies[CurrencyField.OUTPUT] || !currencies[CurrencyField.INPUT]) return null

  const currencyIn = currencies[CurrencyField.INPUT] as Currency
  const currencyOut = currencies[CurrencyField.OUTPUT] as Currency
  return (
    <>
      <Flex centered flexGrow={1} gap="xs">
        <Text color="textSecondary" variant="bodySmall">
          {t('Swap')}
        </Text>
        {/* TODO: onPressIn here should go back to prev screen */}
        <AmountInput
          borderWidth={0}
          editable={false}
          fontFamily={theme.textVariants.headlineLarge.fontFamily}
          fontSize={48}
          height={48}
          mb="xs"
          placeholder="0"
          px="none"
          py="none"
          showCurrencySign={isUSDInput}
          showSoftInputOnFocus={false}
          testID="amount-input-in"
          value={formattedAmounts[CurrencyField.INPUT]}
        />
        <Flex centered gap="none">
          <Flex centered row gap="xs">
            <CurrencyLogo currency={currencyIn} size={28} />
            <Text color="mainForeground" variant="largeLabel">
              {currencyIn.symbol}
            </Text>
          </Flex>
          <TransferArrowButton disabled borderColor="none" />
        </Flex>

        <Text color="textSecondary" variant="bodySmall">
          {t('for')}
        </Text>
        {/* TODO: onPressIn here should go back to prev screen */}
        <AmountInput
          borderWidth={0}
          editable={false}
          fontFamily={theme.textVariants.headlineLarge.fontFamily}
          fontSize={48}
          height={48}
          mb="xs"
          placeholder="0"
          px="none"
          py="none"
          showCurrencySign={isUSDInput}
          showSoftInputOnFocus={false}
          testID="amount-input-out"
          value={formattedAmounts[CurrencyField.OUTPUT]}
        />
        <Flex centered row gap="xs">
          <CurrencyLogo currency={currencyOut} size={28} />
          <Text color="mainForeground" variant="largeLabel">
            {currencyOut.symbol}
          </Text>
        </Flex>
      </Flex>
      <Flex flexGrow={1} gap="sm" justifyContent="flex-end" mb="xl" mt="xs" px="sm">
        {!isWrapAction(wrapType) && trade && (
          <SwapDetails
            currencyIn={currencyAmounts[CurrencyField.INPUT]}
            currencyOut={currencyAmounts[CurrencyField.OUTPUT]}
            trade={trade}
          />
        )}
        <Flex row gap="xs">
          <Button
            alignItems="center"
            borderColor="backgroundOutline"
            borderRadius="lg"
            borderWidth={1}
            flexDirection="row"
            justifyContent="center"
            px="md"
            py="sm"
            onPress={onPrev}>
            <Arrow color={theme.colors.textSecondary} direction="w" size={20} />
          </Button>
          <Flex grow>
            <ActionButton
              callback={isWrapAction(wrapType) ? wrapCallback : swapCallback}
              disabled={swapDisabled}
              label={
                wrapType === WrapType.Wrap
                  ? t('Hold to wrap')
                  : wrapType === WrapType.Unwrap
                  ? t('Hold to unwrap')
                  : t('Hold to swap')
              }
              name={
                wrapType === WrapType.Wrap
                  ? ElementName.Wrap
                  : wrapType === WrapType.Unwrap
                  ? ElementName.Unwrap
                  : ElementName.Swap
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  callback: () => void
}

function ActionButton({ callback, disabled, label, name }: ActionButtonProps) {
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(callback)

  return (
    <>
      <LongPressButton
        disabled={disabled}
        label={label}
        name={name}
        onComplete={() => {
          notificationAsync()
          actionButtonTrigger()
        }}
      />

      {BiometricModal}
    </>
  )
}
