import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { AnyAction } from 'redux'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { Button } from 'src/components/buttons/Button'
import { CurrencyInput } from 'src/components/input/CurrencyInput'
import { Box } from 'src/components/layout/Box'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapCallback } from 'src/features/swap/hooks'
import { SwapDetailRow } from 'src/features/swap/SwapDetailsRow'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { SagaStatus } from 'src/utils/saga'

interface SwapFormProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

// TODO: handle wrap eth
// TODO: token warnings
export function SwapForm(props: SwapFormProps) {
  const { state, dispatch } = props

  const {
    currencies,
    currencyAmounts,
    // currencyBalances,
    exactCurrencyField,
    // inputError,
    trade: { quoteResult: quote, status: quoteStatus },
  } = useDerivedSwapInfo(state)

  const { onSelectCurrency, onSwitchCurrencies, onEnterExactAmount } =
    useSwapActionHandlers(dispatch)
  const { swapCallback, swapState } = useSwapCallback(quote)

  // TODO:
  // -check approval status
  // -check erc20 permits
  // -handle max amount input/show max amount button
  // -handle price impact too high

  const { t } = useTranslation()

  // TODO: clear redux state on unmount?
  // useEffect(() => {
  //   return () => {
  //     dispatched(reset())
  //   }
  // }, [])

  const swapButtonDisabled = Boolean(
    !quote || (swapState?.status && swapState.status !== SagaStatus.Success)
  )

  // TODO: move to a helper function
  let infoLabel: string = ''
  if (!currencies[CurrencyField.INPUT] || !currencies[CurrencyField.OUTPUT]) {
    infoLabel = t`Select currencies to continue`
  } else if (
    (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) ||
    (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT])
  ) {
    infoLabel = t`Select an amount to continue`
  } else if (quoteStatus === 'loading') {
    infoLabel = t`Fetching best price...`
  } else if (quoteStatus === 'error') {
    infoLabel = t`Quote error`
  } else if (swapState?.status) {
    if (swapState.status === SagaStatus.Success) {
      infoLabel = t`Swap successful`
    } else if (swapState.status === SagaStatus.Failure) {
      infoLabel = t`Swap error`
    } else {
      infoLabel = t`Swapping...`
    }
  }

  return (
    <Box paddingHorizontal="md" flex={1} justifyContent="space-between">
      <Box>
        {/* TODO: input currency selector should only token tokens in wallet */}
        <CurrencyInput
          currency={currencies[CurrencyField.INPUT]}
          currencyAmount={currencyAmounts[CurrencyField.INPUT]}
          onSelectCurrency={(newCurrency: Currency) =>
            onSelectCurrency(CurrencyField.INPUT, newCurrency)
          }
          onSetAmount={(value) => onEnterExactAmount(CurrencyField.INPUT, value)}
        />

        <Box zIndex="popover">
          <Box style={StyleSheet.absoluteFill} alignItems="center" height={34}>
            <Box
              bg="gray50"
              borderRadius="lg"
              borderColor="white"
              borderWidth={4}
              justifyContent="center"
              alignItems="center">
              <Button
                onPress={onSwitchCurrencies}
                height={30}
                width={30}
                justifyContent="center"
                alignItems="center">
                <SwapArrow height={24} width={24} />
              </Button>
            </Box>
          </Box>
        </Box>

        <CurrencyInput
          currency={currencies[CurrencyField.OUTPUT]}
          currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
          onSelectCurrency={(newCurrency: Currency) =>
            onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
          }
          onSetAmount={(value) => onEnterExactAmount(CurrencyField.OUTPUT, value)}
          backgroundColor="gray50"
        />
      </Box>
      <Box>
        <SwapDetailRow trade={quote} label={infoLabel} />

        <Button
          variant="primary"
          alignSelf="stretch"
          justifyContent="center"
          flexDirection="row"
          borderRadius="lg"
          onPress={swapCallback}
          label={swapButtonDisabled ? t`Swap` : t`Swap`}
          disabled={swapButtonDisabled}
          mt="md"
        />
      </Box>
    </Box>
  )
}
