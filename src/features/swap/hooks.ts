import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import React, { useEffect, useMemo } from 'react'
import { AnyAction } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { useTokenContract } from 'src/features/contracts/useContract'
import { useQuote } from 'src/features/prices/useQuote'
import { CurrencyField, swapFormActions, SwapFormState } from 'src/features/swap/swapFormSlice'
import { swapActions } from 'src/features/swap/swapSaga'
import { QuoteResult } from 'src/features/swap/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'
import { SagaState, SagaStatus } from 'src/utils/saga'
import { tryParseAmount } from 'src/utils/tryParseAmount'

/** Returns information dereived from the current swap state */
export function useDerivedSwapInfo(state: SwapFormState) {
  const {
    exactCurrencyField,
    exactAmount,
    [CurrencyField.INPUT]: partialCurrencyIn,
    [CurrencyField.OUTPUT]: partialCurrencyOut,
  } = state

  const currencyIn = useCurrency(partialCurrencyIn?.address, partialCurrencyIn?.chainId)
  const currencyOut = useCurrency(partialCurrencyOut?.address, partialCurrencyOut?.chainId)

  const currencies = { [CurrencyField.INPUT]: currencyIn, [CurrencyField.OUTPUT]: currencyOut }
  // TODO: get token balances

  const isExactIn = exactCurrencyField === CurrencyField.INPUT

  const amountSpecified = tryParseAmount(exactAmount, isExactIn ? currencyIn : currencyOut)
  const otherCurrency = isExactIn ? currencyOut : currencyIn

  // TODO: transform quoteResult to `Trade` with callData
  const {
    status,
    error: quoteError,
    data: quoteResult,
  } = useQuote({
    amountSpecified,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
  })

  const currencyAmounts = {
    [CurrencyField.INPUT]: isExactIn
      ? amountSpecified
      : // TODO: better handle quote not read
      currencyIn && quoteResult?.quote
      ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
      : null,
    [CurrencyField.OUTPUT]: !isExactIn
      ? amountSpecified
      : // TODO: better handle quote not ready
      currencyOut && quoteResult?.quote
      ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
      : null,
  }

  return {
    currencies,
    currencyAmounts,
    currencyBalances: {
      [CurrencyField.INPUT]: 0, // TODO
      [CurrencyField.OUTPUT]: 0, // TODO
    },
    exactCurrencyField,
    // TODO <InputError type={SwapInputErrorType={insufficient_funds, etc.}}
    // Interface leverages this to set the button text // act as a CTA
    // no parsed amount yet -> enter an amount
    // no currencies -> select a token
    // TODO: insufficient fund is input balance < max input based on quote
    inputError: '',
    trade: {
      quoteError,
      quoteResult,
      status,
    },
  }
}

/** Set of handlers wrapping actions involving user input */
export function useSwapActionHandlers(dispatch: React.Dispatch<AnyAction>) {
  const onSelectCurrency = (field: CurrencyField, currency: Currency) =>
    dispatch(
      swapFormActions.selectCurrency({
        field,
        address: currency.isToken ? currency.address : 'ETH',
        chainId: currency.chainId,
      })
    )
  const onSwitchCurrencies = () => dispatch(swapFormActions.switchCurrencySides())
  const onEnterExactAmount = (field: CurrencyField, exactAmount: string) =>
    dispatch(swapFormActions.enterExactAmount({ field, exactAmount }))

  return {
    onSelectCurrency,
    onSwitchCurrencies,
    onEnterExactAmount,
  }
}

/** Callback to submit trades and track progress */
export function useSwapCallback(
  trade?: QuoteResult,
  onSuccess?: () => void
): {
  swapState: SagaState | null
  swapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  const { amount, methodParameters } = trade || {}
  const chainId = trade?.route[0]?.[0].tokenIn.chainId

  // TODO: fallback to mainnet required?
  const tokenContract = useTokenContract(
    chainId ?? ChainId.MAINNET,
    trade?.route[0]?.[0].tokenIn.address
  )

  // TODO: use useSagaStatus?
  const swapState = useAppSelector((state) => state.saga.swap)

  useEffect(() => {
    if (swapState.status === SagaStatus.Success) {
      onSuccess?.()
      appDispatch(swapActions.reset())
    }
  }, [appDispatch, onSuccess, swapState])

  return useMemo(() => {
    if (!account || !amount || !chainId || !methodParameters || !tokenContract) {
      return {
        swapCallback: () => {
          logger.error(
            'hooks',
            'useSwapCallback',
            'Missing swapCallback parameters. Is the provider enabled?'
          )
        },
        swapState: null,
      }
    }

    return {
      swapCallback: () => {
        appDispatch(
          swapActions.trigger({
            account,
            txAmount: amount,
            chainId,
            methodParameters,
            contract: tokenContract,
            spender: SWAP_ROUTER_ADDRESSES[chainId],
          })
        )
      },
      swapState,
    }
  }, [account, amount, chainId, appDispatch, methodParameters, swapState, tokenContract])
}
