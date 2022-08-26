import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useMemo, useState } from 'react'

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 */
export function useSyncWidgetInputs(defaultToken: Currency) {
  const [isExactInput, setIsExactInput] = useState(false)
  const [amount, setAmount] = useState<string>()
  const onAmountChange = useCallback((field: Field, amount: string) => {
    setIsExactInput(field === Field.INPUT)
    setAmount(amount)
  }, [])

  const [tokens, setTokens] = useState<{ [Field.INPUT]?: Currency; [Field.OUTPUT]?: Currency }>({
    [Field.OUTPUT]: defaultToken,
  })
  const onSwitchTokens = useCallback(() => {
    setIsExactInput((isExactInput) => !isExactInput)
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
      setIsExactInput(selectingField === Field.INPUT)
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

  const value: SwapController = useMemo(
    () => ({ type: isExactInput ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT, amount, ...tokens }),
    [amount, isExactInput, tokens]
  )
  const valueHandlers: SwapEventHandlers = useMemo(
    () => ({ onAmountChange, onSwitchTokens, onTokenSelectorClick }),
    [onAmountChange, onSwitchTokens, onTokenSelectorClick]
  )

  return { inputs: { value, ...valueHandlers }, tokenSelector }
}
