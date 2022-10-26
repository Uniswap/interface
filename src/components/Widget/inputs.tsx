import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import { sendAnalyticsEvent } from 'analytics'
import { EventName, SectionName } from 'analytics/constants'
import { useTrace } from 'analytics/Trace'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

type SwapValue = Required<SwapController>['value']
type SwapTokens = Pick<SwapValue, Field.INPUT | Field.OUTPUT>

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 * Enforces that token is a part of the returned value.
 */
export function useSyncWidgetInputs({
  token: defaultToken,
  onTokenChange,
}: {
  token?: Currency
  onTokenChange?: (token: Currency) => void
}) {
  const trace = useTrace({ section: SectionName.WIDGET })

  const [type, setType] = useState<SwapValue['type']>(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState<SwapValue['amount']>(EMPTY_AMOUNT)
  const [tokens, setTokens] = useState<SwapTokens>({ [Field.OUTPUT]: defaultToken })

  const shouldDefault = useCallback(
    (tokens: SwapTokens) => defaultToken && !Object.values(tokens).some((token) => token?.equals(defaultToken)),
    [defaultToken]
  )
  useEffect(
    () => setTokens((tokens) => (shouldDefault(tokens) ? { [Field.OUTPUT]: defaultToken } : tokens)),
    [defaultToken, shouldDefault]
  )

  const onAmountChange = useCallback(
    (field: Field, amount: string, origin?: 'max') => {
      if (origin === 'max') {
        sendAnalyticsEvent(EventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED, { ...trace })
      }
      setType(toTradeType(field))
      setAmount(amount)
    },
    [trace]
  )

  const onSwitchTokens = useCallback(() => {
    sendAnalyticsEvent(EventName.SWAP_TOKENS_REVERSED, { ...trace })
    setType((type) => invertTradeType(type))
    setTokens((tokens) => ({
      [Field.INPUT]: tokens[Field.OUTPUT],
      [Field.OUTPUT]: tokens[Field.INPUT],
    }))
  }, [trace])

  const [selectingField, setSelectingField] = useState<Field>()
  const onTokenSelectorClick = useCallback((field: Field) => {
    setSelectingField(field)
    return false
  }, [])

  const onTokenSelect = useCallback(
    (token: Currency) => {
      if (selectingField === undefined) return
      setType(toTradeType(selectingField))

      const otherField = invertField(selectingField)
      let otherToken = tokens[otherField]
      otherToken = otherToken?.equals(token) ? tokens[selectingField] : otherToken
      const update = {
        [selectingField]: token,
        [otherField]: otherToken,
      }
      if (shouldDefault(update)) {
        onTokenChange?.(update[Field.OUTPUT] || update[Field.INPUT] || token)
      }
      setTokens(update)
    },
    [onTokenChange, selectingField, shouldDefault, tokens]
  )
  const tokenSelector = (
    <CurrencySearchModal
      isOpen={selectingField !== undefined}
      onDismiss={() => setSelectingField(undefined)}
      selectedCurrency={selectingField && tokens[selectingField]}
      otherSelectedCurrency={selectingField && tokens[invertField(selectingField)]}
      onCurrencySelect={onTokenSelect}
    />
  )

  const value: SwapValue = useMemo(
    () => ({
      type,
      amount,
      ...tokens,
    }),
    [amount, tokens, type]
  )
  const valueHandlers: SwapEventHandlers = useMemo(
    () => ({ onAmountChange, onSwitchTokens, onTokenSelectorClick }),
    [onAmountChange, onSwitchTokens, onTokenSelectorClick]
  )
  return { inputs: { value, ...valueHandlers }, tokenSelector }
}

// TODO(zzmp): Move to @uniswap/widgets.
function invertField(field: Field) {
  switch (field) {
    case Field.INPUT:
      return Field.OUTPUT
    case Field.OUTPUT:
      return Field.INPUT
  }
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
