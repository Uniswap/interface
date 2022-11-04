import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import { sendAnalyticsEvent } from 'analytics'
import { EventName, SectionName } from 'analytics/constants'
import { useTrace } from 'analytics/Trace'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

type SwapValue = Required<SwapController>['value']
type SwapTokens = Pick<SwapValue, Field.INPUT | Field.OUTPUT> & { default?: Currency }

function includesDefaultToken(tokens: SwapTokens) {
  if (!tokens.default) return true
  return tokens[Field.INPUT]?.equals(tokens.default) || tokens[Field.OUTPUT]?.equals(tokens.default)
}

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 * Enforces that token is a part of the returned value.
 */
export function useSyncWidgetInputs({
  token,
  onTokenChange,
}: {
  token?: Currency
  onTokenChange?: (token: Currency) => void
}) {
  const trace = useTrace({ section: SectionName.WIDGET })

  const [type, setType] = useState<SwapValue['type']>(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState<SwapValue['amount']>(EMPTY_AMOUNT)
  const [tokens, setTokens] = useState<SwapTokens>({ [Field.OUTPUT]: token, default: token })

  useEffect(() => {
    setTokens((tokens) => {
      const update = { ...tokens, default: token }
      if (!includesDefaultToken(update)) {
        return { [Field.OUTPUT]: update.default, default: update.default }
      }
      return update
    })
  }, [token])

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
      default: tokens.default,
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
        default: tokens.default,
      }
      if (!includesDefaultToken(update)) {
        onTokenChange?.(update[Field.OUTPUT] || update[Field.INPUT] || token)
      }
      setTokens(update)
    },
    [onTokenChange, selectingField, tokens]
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
      // If the default has not yet been handled, preemptively disable the widget by passing no tokens. Effectively,
      // this resets the widget - avoiding rendering stale state - because with no tokens the skeleton will be rendered.
      ...(token && tokens.default?.equals(token) ? tokens : undefined),
    }),
    [amount, token, tokens, type]
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
