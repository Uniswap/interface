import type { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import type { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { currencyId } from 'uniswap/src/utils/currencyId'

type PanelProps = Pick<
  CurrencyInputPanelProps,
  | 'currencyAmount'
  | 'usdValue'
  | 'value'
  | 'isFiatMode'
  | 'onSetExactAmount'
  | 'onSetPresetValue'
  | 'onToggleIsFiatMode'
>

export function useMarginAdjustAmountInput(currency: Currency | undefined): {
  tokenAmount: string
  panelProps: PanelProps
} {
  const [tokenAmount, setTokenAmount] = useState('')
  const [fiatAmount, setFiatAmount] = useState('')
  const [isFiatMode, setIsFiatMode] = useState(false)
  // A typed figure belongs to the token it was typed for: kept across a switch, it would be quoted in
  // the new token's units (and an unpriced new token never re-derives it from the fiat figure).
  const key = currencyId(currency)
  const [amountsKey, setAmountsKey] = useState(key)
  if (amountsKey !== key) {
    setAmountsKey(key)
    setTokenAmount('')
    setFiatAmount('')
    setIsFiatMode(false)
  }
  useUSDTokenUpdater({
    isFiatInput: isFiatMode,
    exactAmountToken: tokenAmount,
    exactAmountFiat: fiatAmount,
    currency,
    onFiatAmountUpdated: setFiatAmount,
    onTokenAmountUpdated: setTokenAmount,
  })
  const currencyAmount =
    (currency && getCurrencyAmount({ value: tokenAmount, valueType: ValueType.Exact, currency })) ?? undefined
  const usdValue = useUSDCValue(currencyAmount)

  return {
    tokenAmount,
    panelProps: {
      currencyAmount,
      usdValue,
      value: isFiatMode ? fiatAmount : tokenAmount,
      isFiatMode,
      onSetExactAmount: isFiatMode ? setFiatAmount : setTokenAmount,
      onSetPresetValue: (amount) => {
        setIsFiatMode(false)
        setTokenAmount(amount)
      },
      onToggleIsFiatMode: () => setIsFiatMode((prev) => !prev),
    },
  }
}
