import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 */
export function useSyncWidgetInputs(defaultToken?: Currency) {
  const [type, setType] = useState(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState(EMPTY_AMOUNT)
  const onAmountChange = useCallback((field: Field, amount: string) => {
    setType(toTradeType(field))
    setAmount(amount)
  }, [])

  const [tokens, setTokens] = useState<{ [Field.INPUT]?: Currency; [Field.OUTPUT]?: Currency }>({
    [Field.OUTPUT]: defaultToken,
  })

  useEffect(() => {
    setTokens({
      [Field.OUTPUT]: defaultToken,
    })
    setAmount(EMPTY_AMOUNT)
  }, [defaultToken])

  const onSwitchTokens = useCallback(() => {
    setType((type) => invertTradeType(type))
    setTokens((tokens) => ({
      [Field.INPUT]: tokens[Field.OUTPUT],
      [Field.OUTPUT]: tokens[Field.INPUT],
    }))
  }, [])

  const [selectingField, setSelectingField] = useState<Field>()
  const otherField = useMemo(() => (selectingField === Field.INPUT ? Field.OUTPUT : Field.INPUT), [selectingField])
  const [selectingToken, otherToken] = useMemo(() => {
    if (selectingField === undefined) return [undefined, undefined]
    return [tokens[selectingField], tokens[otherField]]
  }, [otherField, selectingField, tokens])
  const onTokenSelectorClick = useCallback((field: Field) => {
    setSelectingField(field)
    return false
  }, [])
  const onTokenSelect = useCallback(
    (token: Currency) => {
      if (selectingField === undefined) return
      setType(TradeType.EXACT_INPUT)
      setTokens(() => {
        return {
          [otherField]: token === otherToken ? selectingToken : otherToken,
          [selectingField]: token,
        }
      })
    },
    [otherField, otherToken, selectingField, selectingToken]
  )
  const tokenSelector = (
    <CurrencySearchModal
      isOpen={selectingField !== undefined}
      onDismiss={() => setSelectingField(undefined)}
      selectedCurrency={selectingToken}
      otherSelectedCurrency={otherToken}
      onCurrencySelect={onTokenSelect}
    />
  )

  const value: SwapController['value'] = useMemo(() => ({ type, amount, ...tokens }), [amount, tokens, type])
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
