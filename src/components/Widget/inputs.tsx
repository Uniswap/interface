import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfaceSectionName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

type SwapValue = Required<SwapController>['value']
type SwapTokens = Pick<SwapValue, Field.INPUT | Field.OUTPUT> & { default?: Currency }
export type DefaultTokens = Partial<SwapTokens>

function missingDefaultToken(tokens: SwapTokens) {
  if (!tokens.default) return false
  return !tokens[Field.INPUT]?.equals(tokens.default) && !tokens[Field.OUTPUT]?.equals(tokens.default)
}

/**
 * Integrates the Widget's inputs.
 * Treats the Widget as a controlled component, using the app's own token selector for selection.
 * Enforces that token is a part of the returned value.
 */
export function useSyncWidgetInputs({
  defaultTokens,
  onDefaultTokenChange,
}: {
  defaultTokens: DefaultTokens
  onDefaultTokenChange?: (token: Currency) => void
}) {
  const trace = useTrace({ section: InterfaceSectionName.WIDGET })

  const [type, setType] = useState<SwapValue['type']>(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState<SwapValue['amount']>(EMPTY_AMOUNT)
  const [tokens, setTokens] = useState<SwapTokens>(defaultTokens)

  useEffect(() => {
    if (!tokens[Field.INPUT] && !tokens[Field.OUTPUT]) {
      setTokens((tokens) => {
        const update = {
          ...tokens,
          [Field.INPUT]: defaultTokens[Field.INPUT] ?? tokens[Field.INPUT],
          [Field.OUTPUT]: defaultTokens[Field.OUTPUT] ?? tokens[Field.OUTPUT] ?? defaultTokens.default,
          default: defaultTokens.default,
        }
        return update
      })
    }
  }, [defaultTokens, tokens])

  const onAmountChange = useCallback(
    (field: Field, amount: string, origin?: 'max') => {
      if (origin === 'max') {
        sendAnalyticsEvent(SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED, { ...trace })
      }
      setType(field === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT)
      setAmount(amount)
    },
    [trace]
  )

  const onSwitchTokens = useCallback(() => {
    sendAnalyticsEvent(SwapEventName.SWAP_TOKENS_REVERSED, { ...trace })
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
    (selectingToken: Currency) => {
      if (selectingField === undefined) return

      const otherField = invertField(selectingField)
      const isFlip = tokens[otherField]?.equals(selectingToken)
      const update: SwapTokens = {
        [selectingField]: selectingToken,
        [otherField]: isFlip ? tokens[selectingField] : tokens[otherField],
        default: tokens.default,
      }

      setType((type) => {
        // If flipping the tokens, also flip the type/amount.
        if (isFlip) {
          return invertTradeType(type)
        }

        // Setting a new token should clear its amount, if it is set.
        const activeField = type === TradeType.EXACT_INPUT ? Field.INPUT : Field.OUTPUT
        if (selectingField === activeField) {
          setAmount(() => EMPTY_AMOUNT)
        }

        return type
      })

      if (missingDefaultToken(update)) {
        onDefaultTokenChange?.(update[Field.OUTPUT] ?? selectingToken)
      }
      setTokens(update)
    },
    [onDefaultTokenChange, selectingField, tokens]
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
      // If the initial state has not yet been set, preemptively disable the widget by passing no tokens. Effectively,
      // this resets the widget - avoiding rendering stale state - because with no tokens the skeleton will be rendered.
      ...(tokens[Field.INPUT] || tokens[Field.OUTPUT] ? tokens : undefined),
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

// TODO(zzmp): Include in @uniswap/sdk-core (on TradeType, if possible).
function invertTradeType(tradeType: TradeType) {
  switch (tradeType) {
    case TradeType.EXACT_INPUT:
      return TradeType.EXACT_OUTPUT
    case TradeType.EXACT_OUTPUT:
      return TradeType.EXACT_INPUT
  }
}
