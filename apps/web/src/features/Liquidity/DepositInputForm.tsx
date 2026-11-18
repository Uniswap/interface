import { Currency } from '@uniswap/sdk-core'
import { Flex } from '@universe/mycelium'
import { ComponentProps, ReactNode, useEffect, useRef } from 'react'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useTokenBalanceWithBuffer } from '~/features/Liquidity/Create/hooks/useDepositInfo'
import { useNativeTokenPercentageBufferExperiment } from '~/features/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import { useCurrencyInfo } from '~/hooks/currency/useCurrencyInfo'
import { DepositInfo } from '~/types/liquidity'
import { PositionField } from '~/types/position'

type Radius = '$rounded4' | '$rounded16' | '$rounded20'
type PanelRadii = { top: Radius; bottom: Radius }

// `cards` is two separate rounded cards; `stacked` joins them into one block with tight inner corners.
const PANEL_RADII: Record<'cards' | 'stacked', [PanelRadii, PanelRadii]> = {
  cards: [
    { top: '$rounded20', bottom: '$rounded20' },
    { top: '$rounded20', bottom: '$rounded20' },
  ],
  stacked: [
    { top: '$rounded16', bottom: '$rounded4' },
    { top: '$rounded4', bottom: '$rounded16' },
  ],
}

// The styles flow into CurrencyInputPanel's own (Tamagui-typed) prop, so the
// annotation derives from the consumer rather than importing ui/src here.
function panelStyle(
  radii: PanelRadii,
  underCard?: ReactNode,
): ComponentProps<typeof CurrencyInputPanel>['customPanelStyle'] {
  return {
    backgroundColor: '$surface2',
    borderTopLeftRadius: radii.top,
    borderTopRightRadius: radii.top,
    borderBottomLeftRadius: underCard ? '$none' : radii.bottom,
    borderBottomRightRadius: underCard ? '$none' : radii.bottom,
  }
}

function UnderCardComponent({ children, radius }: { children: ReactNode; radius: Radius }) {
  return (
    <Flex
      backgroundColor="$surface2"
      borderBottomLeftRadius={radius}
      borderBottomRightRadius={radius}
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
  actualGasFee?: string
  variant?: 'cards' | 'stacked'
  /**
   * Shows a side the range doesn't take as a locked panel reading 0, rather than removing it, so the form
   * keeps its shape as the range moves.
   */
  keepDisabledFieldsVisible?: boolean
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
  actualGasFee,
  variant = 'cards',
  keepDisabledFieldsVisible = false,
}: InputFormProps) {
  const [token0Radii, token1Radii] = PANEL_RADII[variant]
  // refs must be used to control input focus rather than the focus prop because if the focus prop is used and the amounts are updated,
  // the focus will be stolen and brought back to the deposit form
  const token0InputRef = useRef<CurrencyInputPanelRef>(null)
  const token1InputRef = useRef<CurrencyInputPanelRef>(null)
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()

  const token0BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN0], bufferPercentage)
  const token1BalanceWithBuffer = useTokenBalanceWithBuffer(currencyBalances?.[PositionField.TOKEN1], bufferPercentage)

  // TODO(WEB-4920): when the backend returns the logo info make sure that there is no separate token
  // metadata call being made to retrieve it
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

  // A locked side shows no amount, so it falls back to the input's muted 0 placeholder. Without a balance
  // it also drops the presets and Max that would set one; hidePresets would take the token pill with them.
  const lockedPanelProps = {
    disabled: true,
    value: '',
    currencyAmount: undefined,
    currencyBalance: undefined,
    usdValue: undefined,
  }
  const token0Locked = keepDisabledFieldsVisible && deposit0Disabled
  const token1Locked = keepDisabledFieldsVisible && deposit1Disabled

  return (
    <Flex gap="$gap4">
      {(!deposit0Disabled || token0Locked) && (
        <Flex gap={2}>
          <CurrencyInputPanel
            ref={token0InputRef}
            customPanelStyle={panelStyle(token0Radii, token0UnderCardComponent)}
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
            actualGasFee={token0?.isNative ? actualGasFee : undefined}
            {...(token0Locked && lockedPanelProps)}
          />
          {token0UnderCardComponent && (
            <UnderCardComponent radius={token0Radii.bottom}>{token0UnderCardComponent}</UnderCardComponent>
          )}
        </Flex>
      )}
      {(!deposit1Disabled || token1Locked) && (
        <Flex gap={2}>
          <CurrencyInputPanel
            ref={token1InputRef}
            customPanelStyle={{ ...panelStyle(token1Radii, token1UnderCardComponent), py: '$spacing16' }}
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
            actualGasFee={token1?.isNative ? actualGasFee : undefined}
            {...(token1Locked && lockedPanelProps)}
          />
          {token1UnderCardComponent && (
            <UnderCardComponent radius={token1Radii.bottom}>{token1UnderCardComponent}</UnderCardComponent>
          )}
        </Flex>
      )}
    </Flex>
  )
}
