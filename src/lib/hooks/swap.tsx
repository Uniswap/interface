import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useAtomValue } from 'jotai/utils'
import {
  Field,
  stateAtom,
  SwapState,
  useSwitchCurrencies,
  useUpdateCurrency,
  useUpdateTypedInput,
} from 'lib/state/swap'
import { tryParseAmount } from 'lib/utils/tryParseAmount'
import { ReactNode, useCallback, useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { useCurrencyBalances } from 'state/wallet/hooks'

import useENS from '../../hooks/useENS'
import useSwapSlippageTolerance from '../../hooks/useSwapSlippageTolerance'
import { isAddress } from '../../utils'
import { useBestTrade } from './trade'
import useActiveWeb3React from './useActiveWeb3React'
import useCurrency from './useCurrency'

export function useSwapState(): SwapState {
  return useAtomValue(stateAtom)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
} {
  const updateCurrency = useUpdateCurrency()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      const currencyId = currency.isToken ? currency.address : currency.isNative ? 'ETH' : ''
      updateCurrency({
        field,
        currencyId,
      })
    },
    [updateCurrency]
  )

  const switchCurrenciesWidget = useSwitchCurrencies()
  const onSwitchTokens = useCallback(() => {
    switchCurrenciesWidget()
  }, [switchCurrenciesWidget])

  const updateTypedInputWidget = useUpdateTypedInput()
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      updateTypedInputWidget({ field, typedValue })
    },
    [updateTypedInputWidget]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  parsedAmounts: {
    [Field.INPUT]: CurrencyAmount<Currency> | undefined
    [Field.OUTPUT]: CurrencyAmount<Currency> | undefined
  }
  inputError?: ReactNode
  trade: {
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
    state: TradeState
  }
  allowedSlippage: Percent
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue]
  )

  const trade = useBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  )

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency | null } = {
    [Field.INPUT]: inputCurrency,
    [Field.OUTPUT]: outputCurrency,
  }

  const parsedAmounts = useMemo(() => {
    return {
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.trade?.outputAmount,
    }
  }, [independentField, parsedAmount, trade])

  let inputError: ReactNode | undefined
  if (!account) {
    inputError = <Trans>Connect Wallet</Trans>
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? <Trans>Select a token</Trans>
  }

  if (!parsedAmount) {
    inputError = inputError ?? <Trans>Enter an amount</Trans>
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? <Trans>Enter a recipient</Trans>
  } else {
    if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
      inputError = inputError ?? <Trans>Invalid recipient</Trans>
    }
  }

  const allowedSlippage = useSwapSlippageTolerance(trade.trade ?? undefined)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade.trade?.maximumAmountIn(allowedSlippage)]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    parsedAmounts,
    inputError,
    trade,
    allowedSlippage,
  }
}
