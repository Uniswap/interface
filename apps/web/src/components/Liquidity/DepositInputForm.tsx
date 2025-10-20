import { Currency } from '@uniswap/sdk-core'
import { useTokenBalanceWithBuffer } from 'components/Liquidity/Create/hooks/useDepositInfo'
import { useNativeTokenPercentageBufferExperiment } from 'components/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import { DepositInfo } from 'components/Liquidity/types'
import { useCurrencyInfo } from 'hooks/Tokens'
import { ReactNode, useEffect, useRef } from 'react'
import { PositionField } from 'types/position'
import { Flex, FlexProps } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { CurrencyField } from 'uniswap/src/types/currency'

const INPUT_BORDER_RADIUS = '$rounded20'
const sharedPanelStyle = {
  borderTopLeftRadius: INPUT_BORDER_RADIUS,
  borderTopRightRadius: INPUT_BORDER_RADIUS,
  backgroundColor: '$surface2',
}

function borderRadiusStyles(component?: ReactNode): FlexProps {
  return {
    borderBottomLeftRadius: component ? '$rounded0' : INPUT_BORDER_RADIUS,
    borderBottomRightRadius: component ? '$rounded0' : INPUT_BORDER_RADIUS,
  }
}

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
  // refs must be used to control input focus rather than the focus prop because if the focus prop is used and the amounts are updated,
  // the focus will be stolen and brought back to the deposit form
  const token0InputRef = useRef<CurrencyInputPanelRef>(null)
  const token1InputRef = useRef<CurrencyInputPanelRef>(null)
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()

  const token0BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN0], bufferPercentage)
  const token1BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN1], bufferPercentage)

  // TODO(WEB-4920): when the backend returns the logo info make sure that there is no call being made
  // to graphql to retrieve it
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)

  useEffect(() => {
    if (autofocus) {
      token0InputRef.current?.textInputRef.current?.focus()
    }
  }, [autofocus])

  const handleUserInput = (field: PositionField) => {
    return (newValue: string) => {
      onUserInput(field, newValue)
    }
  }
  const handleOnSetMax = (field: PositionField) => {
    return (amount: string) => {
      if (field === PositionField.TOKEN0) {
        token0InputRef.current?.textInputRef.current?.focus()
      } else {
        token1InputRef.current?.textInputRef.current?.focus()
      }

      onSetMax(field, amount)
    }
  }

  return (
    <Flex gap="$gap4">
      {!deposit0Disabled && (
        <Flex gap={2}>
          <CurrencyInputPanel
            ref={token0InputRef}
            customPanelStyle={{
              ...sharedPanelStyle,
              ...borderRadiusStyles(token0UnderCardComponent),
            }}
            currencyInfo={token0CurrencyInfo}
            currencyField={CurrencyField.INPUT}
            currencyAmount={currencyAmounts?.[PositionField.TOKEN0]}
            currencyBalance={token0BalanceWithBuffer}
            onSetExactAmount={handleUserInput(PositionField.TOKEN0)}
            onToggleIsFiatMode={() => undefined}
            usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN0]}
            onSetPresetValue={handleOnSetMax(PositionField.TOKEN0)}
            value={formattedAmounts?.[PositionField.TOKEN0]}
            onPressIn={() => token0InputRef.current?.textInputRef.current?.focus()}
            isLoading={amount0Loading}
          />
          {token0UnderCardComponent && <UnderCardComponent>{token0UnderCardComponent}</UnderCardComponent>}
        </Flex>
      )}
      {!deposit1Disabled && (
        <Flex gap={2}>
          <CurrencyInputPanel
            ref={token1InputRef}
            customPanelStyle={{
              ...sharedPanelStyle,
              py: '$spacing16',
              ...borderRadiusStyles(token1UnderCardComponent),
            }}
            currencyInfo={token1CurrencyInfo}
            currencyField={CurrencyField.INPUT}
            currencyAmount={currencyAmounts?.[PositionField.TOKEN1]}
            currencyBalance={token1BalanceWithBuffer}
            onSetExactAmount={handleUserInput(PositionField.TOKEN1)}
            onToggleIsFiatMode={() => undefined}
            usdValue={currencyAmountsUSDValue?.[PositionField.TOKEN1]}
            onSetPresetValue={handleOnSetMax(PositionField.TOKEN1)}
            value={formattedAmounts?.[PositionField.TOKEN1]}
            onPressIn={() => token1InputRef.current?.textInputRef.current?.focus()}
            isLoading={amount1Loading}
          />
          {token1UnderCardComponent && <UnderCardComponent>{token1UnderCardComponent}</UnderCardComponent>}
        </Flex>
      )}
    </Flex>
  )
}
