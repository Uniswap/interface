import { AnyAction } from '@reduxjs/toolkit'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Arrow } from 'src/components/icons/Arrow'
import { AmountInput } from 'src/components/input/AmountInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { WarningAction } from 'src/components/warnings/types'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallback,
  useUpdateSwapGasEstimate,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import {
  CurrencyField,
  WarningModalType,
} from 'src/features/transactions/transactionState/transactionState'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
  derivedSwapInfo: DerivedSwapInfo
}

// TODO:
// -handle price impact too high
// TODO: token warnings
export function SwapReview({ dispatch, onNext, onPrev, derivedSwapInfo }: SwapFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencies,
    currencyAmounts,
    formattedAmounts,
    trade: { trade: trade },
    wrapType,
    isUSDInput = false,
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    warnings,
    txId,
  } = derivedSwapInfo

  useUpdateSwapGasEstimate(dispatch, trade)
  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const swapDisabled = Boolean(
    !(isWrapAction(wrapType) || trade) ||
      warnings.some(
        (warning) =>
          warning.action === WarningAction.DisableSubmit ||
          warning.action === WarningAction.DisableReview
      )
  )

  const { swapCallback } = useSwapCallback(
    trade,
    gasSpendEstimate,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    onNext,
    txId
  )

  const onSwap = () => {
    if (warnings.some((warning) => warning.action === WarningAction.WarnBeforeSubmit)) {
      onShowSwapWarning(WarningModalType.ACTION)
      return
    }

    swapCallback()
  }

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    onNext,
    txId
  )

  if (
    !currencies[CurrencyField.OUTPUT] ||
    !currencies[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT]
  )
    return null

  const currencyIn = currencies[CurrencyField.INPUT] as Currency
  const currencyOut = currencies[CurrencyField.OUTPUT] as Currency
  const currencyAmountOut = currencyAmounts[CurrencyField.OUTPUT] as CurrencyAmount<Currency>

  return (
    <>
      <AnimatedFlex centered entering={FadeInUp} exiting={FadeOut} flexGrow={1} gap="xs">
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
            <Text color="textPrimary" variant="largeLabel">
              {currencyIn.symbol}
            </Text>
          </Flex>
          <TransferArrowButton disabled bg="none" borderColor="none" />
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
          <Text color="textPrimary" variant="largeLabel">
            {currencyOut.symbol}
          </Text>
        </Flex>
      </AnimatedFlex>
      <AnimatedFlex
        entering={FadeInUp}
        exiting={FadeOut}
        flexGrow={1}
        gap="sm"
        justifyContent="flex-end"
        mb="xl"
        mt="xs"
        px="sm">
        {!isWrapAction(wrapType) && trade && (
          <SwapDetails
            currencyOut={currencyAmountOut}
            dispatch={dispatch}
            trade={trade}
            warnings={warnings}
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
              disabled={swapDisabled}
              label={
                wrapType === WrapType.Wrap
                  ? t('Wrap')
                  : wrapType === WrapType.Unwrap
                  ? t('Unwrap')
                  : t('Swap')
              }
              name={
                wrapType === WrapType.Wrap
                  ? ElementName.Wrap
                  : wrapType === WrapType.Unwrap
                  ? ElementName.Unwrap
                  : ElementName.Swap
              }
              onPress={isWrapAction(wrapType) ? onWrap : onSwap}
            />
          </Flex>
        </Flex>
      </AnimatedFlex>
    </>
  )
}

type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  onPress: () => void
}

export function ActionButton({ onPress, disabled, label, name }: ActionButtonProps) {
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(onPress)

  return (
    <>
      <PrimaryButton
        disabled={disabled}
        label={label}
        name={name}
        py="md"
        onPress={() => {
          notificationAsync()
          actionButtonTrigger()
        }}
      />

      {BiometricModal}
    </>
  )
}
