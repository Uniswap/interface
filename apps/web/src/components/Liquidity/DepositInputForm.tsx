import { Currency } from '@uniswap/sdk-core'
import { DepositInfo } from 'components/Liquidity/types'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useTokenBalanceWithBuffer } from 'pages/Pool/Positions/create/hooks'
import { useNativeTokenPercentageBufferExperiment } from 'pages/Pool/Positions/create/hooks/useNativeTokenPercentageBufferExperiment'
import { ReactNode, useState } from 'react'
import { PositionField } from 'types/position'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'

function UnderCardComponent({ children }: { children: ReactNode }) {
  return (
    <Flex
      backgroundColor="$surface2"
      borderBottomLeftRadius="$rounded20"
      borderBottomRightRadius="$rounded20"
      py="$spacing8"
      px="$spacing16"
    >
      {children}
    </Flex>
  )
}

type InputFormProps = {
  token0?: Currency
  token1?: Currency
  onUserInput: (field: PositionField, newValue: string) => void
  onSetMax: (field: PositionField, amount: string) => void
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
  token0UnderCardComponent?: ReactNode
  token1UnderCardComponent?: ReactNode
  amount0Loading: boolean
  amount1Loading: boolean
  autofocus?: boolean
} & DepositInfo

export function DepositInputForm({
  token0,
  token1,
  currencyAmounts,
  currencyBalances,
  currencyAmountsUSDValue,
  formattedAmounts,
  onUserInput,
  onSetMax,
  deposit0Disabled,
  deposit1Disabled,
  token0UnderCardComponent,
  token1UnderCardComponent,
  amount0Loading,
  amount1Loading,
  autofocus = true,
}: InputFormProps) {
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()
  const [focusedInputField, setFocusedInputField] = useState(autofocus ? PositionField.TOKEN0 : undefined)

  const token0BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN0], bufferPercentage)
  const token1BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN1], bufferPercentage)

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
      {!deposit0Disabled && (
        <Flex gap={2}>
          <CurrencyInputPanel
            focus={focusedInputField === PositionField.TOKEN0}
            borderTopLeftRadius="$rounded20"
            borderTopRightRadius="$rounded20"
            borderBottomLeftRadius={token0UnderCardComponent ? '$rounded0' : '$rounded20'}
            borderBottomRightRadius={token0UnderCardComponent ? '$rounded0' : '$rounded20'}
            backgroundColor="$surface2"
            currencyInfo={token0CurrencyInfo}
            currencyField={CurrencyField.INPUT}
            currencyAmount={currencyAmounts?.[PositionField.TOKEN0]}
            currencyBalance={token0BalanceWithBuffer}
            onSetExactAmount={handleUserInput(PositionField.TOKEN0)}
            onToggleIsFiatMode={() => undefined}
            usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN0]}
            onSetPresetValue={handleOnSetMax(PositionField.TOKEN0)}
            value={formattedAmounts?.[PositionField.TOKEN0]}
            onPressIn={() => setFocusedInputField(PositionField.TOKEN0)}
            isLoading={amount0Loading}
          />
          {token0UnderCardComponent && <UnderCardComponent>{token0UnderCardComponent}</UnderCardComponent>}
        </Flex>
      )}
      {!deposit1Disabled && (
        <Flex gap={2}>
          <CurrencyInputPanel
            focus={focusedInputField === PositionField.TOKEN1}
            py="$spacing16"
            borderTopLeftRadius="$rounded20"
            borderTopRightRadius="$rounded20"
            borderBottomLeftRadius={token1UnderCardComponent ? '$rounded0' : '$rounded20'}
            borderBottomRightRadius={token1UnderCardComponent ? '$rounded0' : '$rounded20'}
            backgroundColor="$surface2"
            currencyInfo={token1CurrencyInfo}
            currencyField={CurrencyField.INPUT}
            currencyAmount={currencyAmounts?.[PositionField.TOKEN1]}
            currencyBalance={token1BalanceWithBuffer}
            onSetExactAmount={handleUserInput(PositionField.TOKEN1)}
            onToggleIsFiatMode={() => undefined}
            usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN1]}
            onSetPresetValue={handleOnSetMax(PositionField.TOKEN1)}
            value={formattedAmounts?.[PositionField.TOKEN1]}
            onPressIn={() => setFocusedInputField(PositionField.TOKEN1)}
            isLoading={amount1Loading}
          />
          {token1UnderCardComponent && <UnderCardComponent>{token1UnderCardComponent}</UnderCardComponent>}
        </Flex>
      )}
    </Flex>
  )
}
