import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { loadingTransitionCss } from 'lib/css/loading'
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

export const USDC = styled(Row)`
  ${loadingTransitionCss};
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

interface UseFormattedFieldAmountArguments {
  disabled: boolean
  currencyAmount?: CurrencyAmount<Currency>
  fieldAmount?: string
}

export function useFormattedFieldAmount({ disabled, currencyAmount, fieldAmount }: UseFormattedFieldAmountArguments) {
  return useMemo(() => {
    if (disabled) {
      return ''
    }
    if (fieldAmount !== undefined) {
      return fieldAmount
    }
    if (currencyAmount) {
      return currencyAmount.toSignificant(6)
    }
    return ''
  }, [disabled, currencyAmount, fieldAmount])
}

export default function Input({ disabled, focused }: InputProps) {
  const { i18n } = useLingui()
  const {
    [Field.INPUT]: { balance, amount: tradeCurrencyAmount, usdc },
    trade: { state: tradeState },
  } = useSwapInfo()

  const [inputAmount, updateInputAmount] = useSwapAmount(Field.INPUT)
  const [inputCurrency, updateInputCurrency] = useSwapCurrency(Field.INPUT)
  const inputCurrencyAmount = useSwapCurrencyAmount(Field.INPUT)

  // extract eagerly in case of reversal
  usePrefetchCurrencyColor(inputCurrency)

  const isRouteLoading = tradeState === TradeState.SYNCING || tradeState === TradeState.LOADING
  const isDependentField = !useIsSwapFieldIndependent(Field.INPUT)
  const isLoading = isRouteLoading && isDependentField

  //TODO(ianlapham): mimic logic from app swap page
  const mockApproved = true

  // account for gas needed if using max on native token
  const max = useMemo(() => {
    const maxAmount = maxAmountSpend(balance)
    return maxAmount?.greaterThan(0) ? maxAmount.toExact() : undefined
  }, [balance])

  const balanceColor = useMemo(() => {
    const insufficientBalance =
      balance &&
      (inputCurrencyAmount ? inputCurrencyAmount.greaterThan(balance) : tradeCurrencyAmount?.greaterThan(balance))
    return insufficientBalance ? 'error' : undefined
  }, [balance, inputCurrencyAmount, tradeCurrencyAmount])

  const amount = useFormattedFieldAmount({
    disabled,
    currencyAmount: tradeCurrencyAmount,
    fieldAmount: inputAmount,
  })

  return (
    <InputColumn gap={0.5} approved={mockApproved}>
      <TokenInput
        currency={inputCurrency}
        amount={amount}
        max={max}
        disabled={disabled}
        onChangeInput={updateInputAmount}
        onChangeCurrency={updateInputCurrency}
        loading={isLoading}
      >
        <ThemedText.Body2 color="secondary" userSelect>
          <Row>
            <USDC isLoading={isRouteLoading}>{usdc ? `$${formatCurrencyAmount(usdc, 6, 'en', 2)}` : '-'}</USDC>
            {balance && (
              <Balance color={balanceColor} focused={focused}>
                Balance: <span>{formatCurrencyAmount(balance, 4, i18n.locale)}</span>
              </Balance>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
    </InputColumn>
  )
}
