import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useEffect, useMemo } from 'react'
import { AnyAction } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useAppNavigation } from 'src/app/navigation/types'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { useEthBalance, useTokenBalance } from 'src/features/balances/hooks'
import { useTokenContract } from 'src/features/contracts/useContract'
import { CurrencyField, swapFormActions, SwapFormState } from 'src/features/swap/swapFormSlice'
import { swapActions } from 'src/features/swap/swapSaga'
import { Trade } from 'src/features/swap/types'
import { useTrade } from 'src/features/swap/useTrade'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
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

  const activeAccount = useActiveAccount()

  const currencyIn = useCurrency(partialCurrencyIn?.address, partialCurrencyIn?.chainId)
  const currencyOut = useCurrency(partialCurrencyOut?.address, partialCurrencyOut?.chainId)

  const currencies = { [CurrencyField.INPUT]: currencyIn, [CurrencyField.OUTPUT]: currencyOut }

  const [tokenInBalance] = useTokenBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )
  const [tokenOutBalance] = useTokenBalance(
    currencyOut?.isToken ? currencyOut : undefined,
    activeAccount?.address
  )
  const nativeInBalance = useEthBalance(
    currencyIn?.chainId ?? ChainId.MAINNET,
    activeAccount?.address
  )
  const nativeOutBalance = useEthBalance(
    currencyOut?.chainId ?? ChainId.MAINNET,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT

  const amountSpecified = tryParseAmount(exactAmount, isExactIn ? currencyIn : currencyOut)
  const otherCurrency = isExactIn ? currencyOut : currencyIn

  // TODO: transform quoteResult to `Trade` with callData
  const {
    status,
    error: quoteError,
    trade,
  } = useTrade({
    amountSpecified,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
  })

  const currencyAmounts = {
    [CurrencyField.INPUT]: trade?.inputAmount,
    [CurrencyField.OUTPUT]: trade?.outputAmount,
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

  const navigation = useAppNavigation()

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
        navigation.navigate(Screens.Home)
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
    navigation,
  ])
}
