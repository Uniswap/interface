import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { Flex } from 'src/components/layout'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'src/features/swap/hooks'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { ElementName } from 'src/features/telemetry/constants'

interface TransferTokenProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

export function TransferTokenForm({ state, dispatch }: TransferTokenProps) {
  const { t } = useTranslation()

  const derivedSwapInfo = useDerivedSwapInfo(state)

  const { currencies, currencyAmounts, currencyBalances, formattedAmounts } = derivedSwapInfo

  const { onSelectCurrency, onEnterExactAmount } = useSwapActionHandlers(dispatch)

  const setRecipientAddress = useCallback(() => {
    /* TODO: update redux slice */
  }, [])

  return (
    <Flex grow justifyContent="space-between" p="md">
      <Flex grow gap="lg" justifyContent="center">
        <CurrencyInputPanel
          currency={currencies[CurrencyField.INPUT]}
          currencyAmount={currencyAmounts[CurrencyField.INPUT]}
          currencyBalance={currencyBalances[CurrencyField.INPUT]}
          value={formattedAmounts[CurrencyField.INPUT]}
          onSelectCurrency={(newCurrency: Currency) =>
            onSelectCurrency(CurrencyField.INPUT, newCurrency)
          }
          onSetAmount={(value) => onEnterExactAmount(CurrencyField.INPUT, value)}
        />

        <TransferArrowButton disabled />

        <RecipientInputPanel
          recipientAddress={/* TODO: fill address when available in state */ undefined}
          setRecipientAddress={setRecipientAddress}
        />
      </Flex>

      <DecimalPad
        setValue={(newValue) => onEnterExactAmount(CurrencyField.INPUT, newValue)}
        value={formattedAmounts[CurrencyField.INPUT]}
      />

      <PrimaryButton disabled={false} label={t('Send')} name={ElementName.Submit} />
    </Flex>
  )
}
