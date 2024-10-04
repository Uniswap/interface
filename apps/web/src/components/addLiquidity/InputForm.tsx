import { Currency } from '@uniswap/sdk-core'
import { AddLiquidityInfo } from 'components/addLiquidity/AddLiquidityContext'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useState } from 'react'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'

export enum Field {
  TOKEN0 = 'TOKEN0',
  TOKEN1 = 'TOKEN1',
}

type InputFormProps = {
  token0: Currency
  token1: Currency
  onUserInput: (field: Field, newValue: string) => void
  onSetMax: (field: Field, amount: string) => void
} & AddLiquidityInfo

export function InputForm({
  token0,
  token1,
  currencyAmounts,
  currencyBalances,
  currencyAmountsUSDValue,
  formattedAmounts,
  onUserInput,
  onSetMax,
}: InputFormProps) {
  const [focusedInputField, setFocusedInputField] = useState(Field.TOKEN0)

  // TODO(WEB-4920): when the backend returns the logo info make sure that there is no call being made
  // to graphql to retrieve it
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)

  const handleUserInput = (field: Field) => {
    return (newValue: string) => {
      onUserInput(field, newValue)
    }
  }
  const handleOnSetMax = (field: Field) => {
    return (amount: string) => {
      setFocusedInputField(field)
      onSetMax(field, amount)
    }
  }
  return (
    <Flex gap="$gap4">
      <CurrencyInputPanel
        enableInputOnly
        focus={focusedInputField === Field.TOKEN0}
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        currencyInfo={token0CurrencyInfo}
        currencyField={CurrencyField.INPUT}
        currencyAmount={currencyAmounts?.[Field.TOKEN0]}
        currencyBalance={currencyBalances?.[Field.TOKEN0]}
        onSetExactAmount={handleUserInput(Field.TOKEN0)}
        onToggleIsFiatMode={() => undefined}
        usdValue={currencyAmountsUSDValue?.[Field.TOKEN0]}
        onSetMax={handleOnSetMax(Field.TOKEN0)}
        value={formattedAmounts?.[Field.TOKEN0]}
        onPressIn={() => setFocusedInputField(Field.TOKEN0)}
      />

      <CurrencyInputPanel
        enableInputOnly
        focus={focusedInputField === Field.TOKEN1}
        py="$spacing16"
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        currencyInfo={token1CurrencyInfo}
        currencyField={CurrencyField.INPUT}
        currencyAmount={currencyAmounts?.[Field.TOKEN1]}
        currencyBalance={currencyBalances?.[Field.TOKEN1]}
        onSetExactAmount={handleUserInput(Field.TOKEN1)}
        onToggleIsFiatMode={() => undefined}
        usdValue={currencyAmountsUSDValue?.[Field.TOKEN1]}
        onSetMax={handleOnSetMax(Field.TOKEN1)}
        value={formattedAmounts?.[Field.TOKEN1]}
        onPressIn={() => setFocusedInputField(Field.TOKEN1)}
      />
    </Flex>
  )
}
