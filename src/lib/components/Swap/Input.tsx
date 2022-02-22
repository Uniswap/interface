import { useLingui } from '@lingui/react'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { loadingOpacityCss } from 'lib/css/loading'
import {
  useIsSwapFieldIndependent,
  useSwapAmount,
  useSwapCurrency,
  useSwapCurrencyAmount,
  useSwapInfo,
} from 'lib/hooks/swap'
import { usePrefetchCurrencyColor } from 'lib/hooks/useCurrencyColor'
import { Field } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { TradeState } from 'state/routing/types'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import Column from '../Column'
import Row from '../Row'
import TokenImg from '../TokenImg'
import TokenInput from './TokenInput'

export const LoadingRow = styled(Row)<{ $loading: boolean }>`
  ${loadingOpacityCss};
`

export const Balance = styled(ThemedText.Body2)<{ focused: boolean }>`
  opacity: ${({ focused }) => (focused ? 1 : 0)};
  transition: opacity 0.25s ${({ focused }) => (focused ? 'ease-in' : 'ease-out')};
`

const InputColumn = styled(Column)<{ approved?: boolean }>`
  margin: 0.75em;
  position: relative;

  ${TokenImg} {
    filter: ${({ approved }) => (approved ? undefined : 'saturate(0) opacity(0.4)')};
    transition: filter 0.25s;
  }
`

export interface InputProps {
  disabled: boolean
  focused: boolean
}

export default function Input({ disabled, focused }: InputProps) {
  const { i18n } = useLingui()
  const {
    trade: { state: tradeState },
    currencyBalances: { [Field.INPUT]: balance },
    currencyAmounts: { [Field.INPUT]: swapInputCurrencyAmount },
  } = useSwapInfo()
  const inputUSDC = useUSDCValue(swapInputCurrencyAmount)

  const [swapInputAmount, updateSwapInputAmount] = useSwapAmount(Field.INPUT)
  const [swapInputCurrency, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)
  const inputCurrencyAmount = useSwapCurrencyAmount(Field.INPUT)

  // extract eagerly in case of reversal
  usePrefetchCurrencyColor(swapInputCurrency)

  const isRouteLoading = tradeState === TradeState.SYNCING || tradeState === TradeState.LOADING
  const isDependentField = !useIsSwapFieldIndependent(Field.INPUT)
  const isLoading = isRouteLoading && isDependentField

  //TODO(ianlapham): mimic logic from app swap page
  const mockApproved = true

  // account for gas needed if using max on native token
  const maxAmount = useMemo(() => maxAmountSpend(balance), [balance])

  const onMax = useMemo(() => {
    if (maxAmount?.greaterThan(0)) {
      return () => updateSwapInputAmount(maxAmount.toExact())
    }
    return
  }, [maxAmount, updateSwapInputAmount])

  const balanceColor = useMemo(() => {
    const insufficientBalance =
      balance &&
      (inputCurrencyAmount ? inputCurrencyAmount.greaterThan(balance) : swapInputCurrencyAmount?.greaterThan(balance))
    return insufficientBalance ? 'error' : undefined
  }, [balance, inputCurrencyAmount, swapInputCurrencyAmount])

  return (
    <InputColumn gap={0.5} approved={mockApproved}>
      <TokenInput
        currency={swapInputCurrency}
        amount={(swapInputAmount !== undefined ? swapInputAmount : swapInputCurrencyAmount?.toSignificant(6)) ?? ''}
        disabled={disabled}
        onMax={onMax}
        onChangeInput={updateSwapInputAmount}
        onChangeCurrency={updateSwapInputCurrency}
        loading={isLoading}
      >
        <ThemedText.Body2 color="secondary">
          <Row>
            <LoadingRow $loading={isLoading}>{inputUSDC ? `$${inputUSDC.toFixed(2)}` : '-'}</LoadingRow>
            {balance && (
              <Balance color={balanceColor} focused={focused}>
                Balance: <span style={{ userSelect: 'text' }}>{formatCurrencyAmount(balance, 4, i18n.locale)}</span>
              </Balance>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
    </InputColumn>
  )
}
