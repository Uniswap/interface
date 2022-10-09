import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useMemo, useState } from 'react'

export interface Tokens {
  [Field.INPUT]?: Currency
  [Field.OUTPUT]?: Currency
}

const EMPTY_AMOUNT = ''

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 */
export function useSyncWidgetInputs({
  tokens,
  onTokensChange,
}: {
  tokens: Tokens
  onTokensChange: (tokens: Tokens) => void
}) {
  const [amount, setAmount] = useState(EMPTY_AMOUNT)
  const [type, setType] = useState(TradeType.EXACT_INPUT)
  const onAmountChange = useCallback((field: Field, amount: string) => {
    setAmount(amount)
    setType(toTradeType(field))
  }, [])

  const onSwitchTokens = useCallback(() => {
    onTokensChange({
      [Field.INPUT]: tokens[Field.OUTPUT],
      [Field.OUTPUT]: tokens[Field.INPUT],
    })
    setType((type) => invertTradeType(type))
  }, [onTokensChange, tokens])

  const [selectingField, setSelectingField] = useState<Field>()
  const otherField = useMemo(() => {
    if (selectingField === undefined) return
    return selectingField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  }, [selectingField])
  const onTokenSelectorClick = useCallback((field: Field) => {
    setSelectingField(field)
    return false
  }, [])
  const onTokenSelect = useCallback(
    (token: Currency) => {
      if (selectingField === undefined || otherField === undefined) return
      if (token === tokens[otherField]) {
        onSwitchTokens()
        return
      }
      onTokensChange({ ...tokens, [selectingField]: token })
    },
    [onSwitchTokens, onTokensChange, otherField, selectingField, tokens]
  )
  const tokenSelector = (
    <CurrencySearchModal
      isOpen={selectingField !== undefined}
      onDismiss={() => setSelectingField(undefined)}
      selectedCurrency={selectingField && tokens[selectingField]}
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
