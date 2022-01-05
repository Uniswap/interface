import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import React, { useEffect, useMemo } from 'react'
import { AnyAction } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { useEthBalance, useTokenBalance } from 'src/features/balances/hooks'
import { useTokenContract } from 'src/features/contracts/useContract'
import { CurrencyField, swapFormActions, SwapFormState } from 'src/features/swap/swapFormSlice'
import { swapActions } from 'src/features/swap/swapSaga'
import { Trade, useTrade } from 'src/features/swap/useTrade'
import { getWrapType, isWrapAction } from 'src/features/swap/utils'
import { tokenWrapActions, WrapType } from 'src/features/swap/wrapSaga'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { SagaState, SagaStatus } from 'src/utils/saga'
import { tryParseAmount } from 'src/utils/tryParseAmount'

const DEFAULT_SLIPPAGE_TOLERANCE_PERCENT = new Percent(DEFAULT_SLIPPAGE_TOLERANCE, 100)

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo(state: SwapFormState) {
  const {
    exactCurrencyField,
    exactAmount,
    [CurrencyField.INPUT]: partialCurrencyIn,
    [CurrencyField.OUTPUT]: partialCurrencyOut,
  } = state

  const activeAccount = useActiveAccount()

  const currencyIn = useCurrency(partialCurrencyIn?.address, partialCurrencyIn?.chainId)
  const currencyOut = useCurrency(partialCurrencyOut?.address, partialCurrencyOut?.chainId)

  const currencies = { [CurrencyField.INPUT]: currencyIn, [CurrencyField.OUTPUT]: currencyOut }

  const { balance: tokenInBalance } = useTokenBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )
  const { balance: tokenOutBalance } = useTokenBalance(
    currencyOut?.isToken ? currencyOut : undefined,
    activeAccount?.address
  )
  const { balance: nativeInBalance } = useEthBalance(
    currencyIn?.chainId ?? ChainId.MAINNET,
    activeAccount?.address
  )
  const { balance: nativeOutBalance } = useEthBalance(
    currencyOut?.chainId ?? ChainId.MAINNET,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(
    () => tryParseAmount(exactAmount, isExactIn ? currencyIn : currencyOut),
    [currencyIn, currencyOut, exactAmount, isExactIn]
  )
  const otherCurrency = isExactIn ? currencyOut : currencyIn

  const skipQuote = isWrapAction(wrapType)
  const {
    status,
    error: quoteError,
    trade,
  } = useTrade({
    amountSpecified: skipQuote ? null : amountSpecified,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
  })

  const currencyAmounts = skipQuote
    ? {
        [CurrencyField.INPUT]: amountSpecified,
        [CurrencyField.OUTPUT]: amountSpecified,
      }
    : {
        [CurrencyField.INPUT]:
          exactCurrencyField === CurrencyField.INPUT ? amountSpecified : trade?.inputAmount,
        [CurrencyField.OUTPUT]:
          exactCurrencyField === CurrencyField.OUTPUT ? amountSpecified : trade?.outputAmount,
      }

  return {
    currencies,
    currencyAmounts,
    currencyBalances: {
      [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
      [CurrencyField.OUTPUT]: currencyOut?.isNative ? nativeOutBalance : tokenOutBalance,
    },
    exactCurrencyField,
    trade: {
      quoteError,
      status,
      trade,
    },
    wrapType,
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
  trade?: Trade | undefined | null,
  onSuccess?: () => void
): {
  swapState: SagaState | null
  swapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()
  const navigation = useAppStackNavigation()

  const { amount, methodParameters } = trade?.quote || {}
  const chainId = trade?.inputAmount.currency.chainId

  // TODO: fallback to mainnet required?
  const tokenContract = useTokenContract(
    chainId ?? ChainId.MAINNET,
    trade?.inputAmount.currency.isToken ? trade?.inputAmount.currency.wrapped.address : undefined
  )

  // TODO: use useSagaStatus?
  const swapState = useAppSelector((state) => state.saga.swap)

  useEffect(() => {
    if (swapState.status === SagaStatus.Success || swapState.status === SagaStatus.Failure) {
      onSuccess?.()
      appDispatch(swapActions.reset())
    }
  }, [appDispatch, onSuccess, swapState])

  return useMemo(() => {
    if (!account || !amount || !chainId || !methodParameters) {
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
            chainId,
            contract: tokenContract,
            methodParameters,
            swapRouterAddress: SWAP_ROUTER_ADDRESSES[chainId],
            transactionInfo: tradeToTransactionInfo(trade),
            txAmount: amount,
          })
        )
        navigation.goBack()
      },
      swapState,
    }
  }, [
    account,
    amount,
    chainId,
    methodParameters,
    tokenContract,
    swapState,
    appDispatch,
    trade,
    navigation,
  ])
}

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType
) {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()
  const navigation = useAppStackNavigation()

  return useMemo(() => {
    if (!isWrapAction(wrapType)) {
      return {
        wrapCallback: () =>
          logger.error('hooks', 'useWrapCallback', 'Wrap callback invoked for non-wrap actions'),
      }
    }

    if (!account || !inputCurrencyAmount) {
      return {
        wrapCallback: () =>
          logger.error(
            'hooks',
            'useWrapCallback',
            'Wrap callback invoked without active account, input currency or weth contract'
          ),
      }
    }

    return {
      wrapCallback: () => {
        appDispatch(
          tokenWrapActions.trigger({
            account,
            inputCurrencyAmount,
          })
        )
        navigation.goBack()
      },
    }
  }, [account, appDispatch, inputCurrencyAmount, navigation, wrapType])
}

function tradeToTransactionInfo(
  trade: Trade
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  return trade.tradeType === TradeType.EXACT_INPUT
    ? {
        type: TransactionType.SWAP,
        inputCurrencyId: currencyId(trade.inputAmount.currency),
        outputCurrencyId: currencyId(trade.outputAmount.currency),
        tradeType: TradeType.EXACT_INPUT,
        inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        minimumOutputCurrencyAmountRaw: trade
          .minimumAmountOut(DEFAULT_SLIPPAGE_TOLERANCE_PERCENT)
          .quotient.toString(),
      }
    : {
        type: TransactionType.SWAP,
        inputCurrencyId: currencyId(trade.inputAmount.currency),
        outputCurrencyId: currencyId(trade.outputAmount.currency),
        tradeType: TradeType.EXACT_OUTPUT,
        outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        maximumInputCurrencyAmountRaw: trade
          .maximumAmountIn(DEFAULT_SLIPPAGE_TOLERANCE_PERCENT)
          .quotient.toString(),
      }
}
