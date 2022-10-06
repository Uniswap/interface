import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 */
export function useSyncWidgetInputs({
  token,
  onTokenChange,
}: {
  token?: Currency
  onTokenChange?: (token: Currency) => void
}) {
  const [type, setType] = useState(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState(EMPTY_AMOUNT)
  const onAmountChange = useCallback((field: Field, amount: string) => {
    setType(toTradeType(field))
    setAmount(amount)
  }, [])

  const [tokens, setTokens] = useState<{ [Field.INPUT]?: Currency; [Field.OUTPUT]?: Currency }>({
    [Field.OUTPUT]: token,
  })

  useEffect(() => {
    if (tokens[Field.INPUT] !== token && tokens[Field.OUTPUT] !== token) {
      const token = tokens[Field.OUTPUT] || tokens[Field.INPUT]
      if (token) {
        onTokenChange?.(token)
      }
    }
  }, [onTokenChange, token, tokens])

  // Initialize with the passed token.
  useEffect(() => {
    setTokens({
      [Field.OUTPUT]: token,
    })
    setAmount(EMPTY_AMOUNT)
  }, [token])

  const onSwitchTokens = useCallback(() => {
    setType((type) => invertTradeType(type))
    setTokens((tokens) => ({
      [Field.INPUT]: tokens[Field.OUTPUT],
      [Field.OUTPUT]: tokens[Field.INPUT],
    }))
  }, [])

  const [selectorField, setSelectorField] = useState<Field>()
  const onTokenSelectorClick = useCallback((field: Field) => {
    setSelectorField(field)
    return false
  }, [])

  // Configure token selection through the interface selector (CurrencySearchModal).
  const otherField = useMemo(() => {
    if (selectorField === undefined) return
    return selectorField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  }, [selectorField])
  const onTokenSelect = useCallback(
    (token: Currency) => {
      if (selectorField === undefined || otherField === undefined) return
      if (token === tokens[otherField]) {
        onSwitchTokens()
        return
      }
      setTokens({ ...tokens, [selectorField]: token })
    },
    [onSwitchTokens, otherField, selectorField, tokens]
  )
  const tokenSelector = (
    <CurrencySearchModal
      isOpen={selectorField !== undefined}
      onDismiss={() => setSelectorField(undefined)}
      selectedCurrency={selectorField && tokens[selectorField]}
      otherSelectedCurrency={otherField && tokens[otherField]}
      onCurrencySelect={onTokenSelect}
    />
  )

  const value: SwapController = useMemo(() => ({ type, amount, ...tokens }), [amount, tokens, type])
  const valueHandlers: SwapEventHandlers = useMemo(
    () => ({ onAmountChange, onSwitchTokens, onTokenSelectorClick }),
    [onAmountChange, onSwitchTokens, onTokenSelectorClick]
  )

  return { inputs: { value, ...valueHandlers }, tokenSelector }
}

// TODO(zzmp): Move to @uniswap/widgets.
function toTradeType(modifiedField: Field) {
  switch (modifiedField) {
    case Field.INPUT:
      return TradeType.EXACT_INPUT
    case Field.OUTPUT:
      return TradeType.EXACT_OUTPUT
  }
}

// TODO(zzmp): Include in @uniswap/sdk-core (on TradeType, if possible).
function invertTradeType(tradeType: TradeType) {
  switch (tradeType) {
    case TradeType.EXACT_INPUT:
      return TradeType.EXACT_OUTPUT
    case TradeType.EXACT_OUTPUT:
      return TradeType.EXACT_INPUT
  }
}
