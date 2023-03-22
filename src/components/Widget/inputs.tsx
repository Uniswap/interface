import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfaceSectionName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, Field, SwapController, SwapEventHandlers, TradeType } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { isSupportedChain } from 'constants/chains'
import usePrevious from 'hooks/usePrevious'
import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_AMOUNT = ''

type SwapValue = Required<SwapController>['value']
export type SwapTokens = Pick<SwapValue, Field.INPUT | Field.OUTPUT> & { default?: Currency }
export type DefaultTokens = Partial<SwapTokens>

function missingDefaultToken(tokens: SwapTokens) {
  if (!tokens.default) return false
  return !tokens[Field.INPUT]?.equals(tokens.default) && !tokens[Field.OUTPUT]?.equals(tokens.default)
}

function currenciesEqual(a: Currency | undefined, b: Currency | undefined) {
  if (a && b) {
    return a.equals(b)
  } else {
    return !a && !b
  }
}

function tokensEqual(a: SwapTokens | undefined, b: SwapTokens | undefined) {
  if (!a || !b) {
    return !a && !b
  }
  return (
    currenciesEqual(a[Field.INPUT], b[Field.INPUT]) &&
    currenciesEqual(a[Field.OUTPUT], b[Field.OUTPUT]) &&
    currenciesEqual(a.default, b.default)
  )
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
  onDefaultTokenChange?: (tokens: SwapTokens) => void
}) {
  const trace = useTrace({ section: InterfaceSectionName.WIDGET })

  const { chainId } = useWeb3React()
  const previousChainId = usePrevious(chainId)

  const [type, setType] = useState<SwapValue['type']>(TradeType.EXACT_INPUT)
  const [amount, setAmount] = useState<SwapValue['amount']>(EMPTY_AMOUNT)
  const [tokens, setTokens] = useState<SwapTokens>({
    ...defaultTokens,
    [Field.OUTPUT]: defaultTokens[Field.OUTPUT] ?? defaultTokens.default,
  })

  // The most recent set of defaults, which can be used to check when the defaults are actually changing.
  const baseTokens = usePrevious(defaultTokens)
  useEffect(() => {
    if (!tokensEqual(baseTokens, defaultTokens)) {
      const input = defaultTokens[Field.INPUT]
      const output = defaultTokens[Field.OUTPUT] ?? defaultTokens.default
      setTokens({
        ...defaultTokens,
        [Field.OUTPUT]: currenciesEqual(output, input) ? undefined : output,
      })
    }
  }, [baseTokens, defaultTokens])

  /**
   * Clear the tokens if the chain changes.
   */
  useEffect(() => {
    if (chainId !== previousChainId && !!previousChainId && isSupportedChain(chainId)) {
      setTokens({
        ...defaultTokens,
        [Field.OUTPUT]: defaultTokens[Field.OUTPUT] ?? defaultTokens.default,
      })
      setAmount(EMPTY_AMOUNT)
    }
  }, [chainId, defaultTokens, previousChainId, tokens])

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
        onDefaultTokenChange?.({
          ...update,
          default: update[Field.OUTPUT] ?? selectingToken,
        })
        return
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
      showCommonBases
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
