import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
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
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useAcceptedTrade,
  useSwapActionHandlers,
  useSwapCallback,
  useUpdateSwapGasEstimate,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import { isWrapAction, requireAcceptNewTrade } from 'src/features/transactions/swap/utils'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

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
    optimismL1Fee,
    gasPrice,
    exactApproveRequired,
    swapMethodParameters,
    warnings,
    txId,
  } = derivedSwapInfo

  useUpdateSwapGasEstimate(dispatch, trade)
  const { onAcceptTrade, acceptedTrade } = useAcceptedTrade(trade)

  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )
  const newTradeToAccept = requireAcceptNewTrade(acceptedTrade, trade)

  const swapDisabled = noValidSwap || blockingWarning || newTradeToAccept

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

  return (
    <>
      <AnimatedFlex alignItems="center" entering={FadeInUp} exiting={FadeOut} flexGrow={1} gap="md">
        {/* TODO: onPressIn here should go back to prev screen */}
        <Flex gap="sm" mt="xxl">
          <AmountInput
            backgroundColor="none"
            borderWidth={0}
            editable={false}
            fontFamily={theme.textVariants.headlineLarge.fontFamily}
            fontSize={48}
            height={48}
            placeholder="0"
            px="md"
            py="none"
            showCurrencySign={isUSDInput}
            showSoftInputOnFocus={false}
            testID="amount-input-in"
            value={formattedAmounts[CurrencyField.INPUT]}
          />
          <Flex centered row gap="xs">
            <CurrencyLogo currency={currencyIn} size={28} />
            <Text color="textPrimary" variant="largeLabel">
              {currencyIn.symbol}
            </Text>
          </Flex>
        </Flex>

        <TransferArrowButton disabled bg="none" borderColor="none" />
        <Flex centered gap="md">
          <Text color="textSecondary" variant="bodySmall">
            {t('For')}
          </Text>
          {/* TODO: onPressIn here should go back to prev screen */}
          <Flex gap="sm">
            <AmountInput
              backgroundColor="none"
              borderWidth={0}
              editable={false}
              fontFamily={theme.textVariants.headlineLarge.fontFamily}
              fontSize={48}
              height={48}
              placeholder="0"
              px="md"
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
          </Flex>
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
        {!isWrapAction(wrapType) && acceptedTrade && trade && (
          <SwapDetails
            acceptedTrade={acceptedTrade}
            dispatch={dispatch}
            gasPrice={gasPrice}
            gasSpendEstimate={gasSpendEstimate}
            newTradeToAccept={newTradeToAccept}
            optimismL1Fee={optimismL1Fee}
            trade={trade}
            warnings={warnings}
            onAcceptTrade={onAcceptTrade}
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
            <Arrow color={theme.colors.textPrimary} direction="w" size={20} />
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
  const { requiredForTransactions } = useBiometricAppSettings()

  return (
    <>
      <PrimaryButton
        disabled={disabled}
        label={label}
        name={name}
        py="md"
        testID={name}
        textVariant="largeLabel"
        onPress={() => {
          notificationAsync()
          if (requiredForTransactions) {
            actionButtonTrigger()
          } else {
            onPress()
          }
        }}
      />

      {BiometricModal}
    </>
  )
}
