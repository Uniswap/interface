import { Currency } from '@uniswap/sdk-core'
import { AddLiquidityInfo } from 'components/addLiquidity/AddLiquidityContext'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useState } from 'react'
import { PositionField } from 'types/position'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'

type InputFormProps = {
  token0: Currency
  token1: Currency
  onUserInput: (field: PositionField, newValue: string) => void
  onSetMax: (field: PositionField, amount: string) => void
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
  const [focusedInputField, setFocusedInputField] = useState(PositionField.TOKEN0)

  // TODO(WEB-4920): when the backend returns the logo info make sure that there is no call being made
  // to graphql to retrieve it
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)

  const handleUserInput = (field: PositionField) => {
    return (newValue: string) => {
      onUserInput(field, newValue)
    }
  }
  const handleOnSetMax = (field: PositionField) => {
    return (amount: string) => {
      setFocusedInputField(field)
      onSetMax(field, amount)
    }
  }
  return (
    <Flex gap="$gap4">
      <CurrencyInputPanel
        enableInputOnly
        focus={focusedInputField === PositionField.TOKEN0}
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        currencyInfo={token0CurrencyInfo}
        currencyField={CurrencyField.INPUT}
        currencyAmount={currencyAmounts?.[PositionField.TOKEN0]}
        currencyBalance={currencyBalances?.[PositionField.TOKEN0]}
        onSetExactAmount={handleUserInput(PositionField.TOKEN0)}
        onToggleIsFiatMode={() => undefined}
        usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN0]}
        onSetMax={handleOnSetMax(PositionField.TOKEN0)}
        value={formattedAmounts?.[PositionField.TOKEN0]}
        onPressIn={() => setFocusedInputField(PositionField.TOKEN0)}
      />

      <CurrencyInputPanel
        enableInputOnly
        focus={focusedInputField === PositionField.TOKEN1}
        py="$spacing16"
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        currencyInfo={token1CurrencyInfo}
        currencyField={CurrencyField.INPUT}
        currencyAmount={currencyAmounts?.[PositionField.TOKEN1]}
        currencyBalance={currencyBalances?.[PositionField.TOKEN1]}
        onSetExactAmount={handleUserInput(PositionField.TOKEN1)}
        onToggleIsFiatMode={() => undefined}
        usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN1]}
        onSetMax={handleOnSetMax(PositionField.TOKEN1)}
        value={formattedAmounts?.[PositionField.TOKEN1]}
        onPressIn={() => setFocusedInputField(PositionField.TOKEN1)}
      />
    </Flex>
  )
}
