import { ContractTransaction } from '@ethersproject/contracts'
import { useWETHContract } from 'hooks/useContract'
import { atom, useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useEffect, useMemo } from 'react'

import { WRAPPED_NATIVE_CURRENCY } from '../../../constants/tokens'
import useActiveWeb3React from '../useActiveWeb3React'
import { useCurrencyBalances } from '../useCurrencyBalance'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}
interface UseWrapCallbackReturns {
  callback: () => Promise<ContractTransaction>
  error: WrapError
  loading: boolean
  type: WrapType
}

export enum WrapError {
  NO_ERROR = 0, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT,
  ENTER_WRAPPED_AMOUNT,
  INSUFFICIENT_NATIVE_BALANCE,
  INSUFFICIENT_WRAPPED_BALANCE,
}

interface WrapState {
  loading: boolean
  error: WrapError
}

const wrapState = atom<WrapState>({
  loading: false,
  error: WrapError.NO_ERROR,
})

export default function useWrapCallback(): UseWrapCallbackReturns {
  const { account, chainId } = useActiveWeb3React()
  const [{ loading, error }, setWrapState] = useAtom(wrapState)
  const wrappedNativeCurrencyContract = useWETHContract()
  const {
    amount,
    independentField,
    [Field.INPUT]: inputCurrency,
    [Field.OUTPUT]: outputCurrency,
  } = useAtomValue(swapAtom)

  const wrapType = useMemo(() => {
    if (!inputCurrency || !outputCurrency || !chainId) {
      return WrapType.NOT_APPLICABLE
    }
    if (inputCurrency.isNative && WRAPPED_NATIVE_CURRENCY[chainId]?.equals(outputCurrency)) {
      return WrapType.WRAP
    }
    if (WRAPPED_NATIVE_CURRENCY[chainId]?.equals(inputCurrency) && outputCurrency.isNative) {
      return WrapType.UNWRAP
    }
    return WrapType.NOT_APPLICABLE
  }, [chainId, inputCurrency, outputCurrency])

  const isExactIn = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(amount, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, amount]
  )
  const parsedAmountIn = isExactIn ? parsedAmount : undefined

  const relevantTokenBalances = useCurrencyBalances(
    account,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )
  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const hasInputAmount = Boolean(parsedAmount?.greaterThan('0'))
  const sufficientBalance = parsedAmountIn && !currencyBalances[Field.INPUT]?.lessThan(parsedAmountIn)

  useEffect(() => {
    if (sufficientBalance) {
      setWrapState((state) => ({ ...state, error: WrapError.NO_ERROR }))
    } else if (wrapType === WrapType.WRAP) {
      setWrapState((state) => ({
        ...state,
        error: hasInputAmount ? WrapError.INSUFFICIENT_NATIVE_BALANCE : WrapError.ENTER_NATIVE_AMOUNT,
      }))
    } else if (wrapType === WrapType.UNWRAP) {
      setWrapState((state) => ({
        ...state,
        error: hasInputAmount ? WrapError.INSUFFICIENT_WRAPPED_BALANCE : WrapError.ENTER_WRAPPED_AMOUNT,
      }))
    }
  }, [hasInputAmount, setWrapState, sufficientBalance, wrapType])

  const callback = useCallback(async () => {
    if (!parsedAmountIn) {
      return Promise.reject('Must provide an input amount to wrap.')
    }
    if (wrapType === WrapType.NOT_APPLICABLE) {
      return Promise.reject('Wrapping not applicable to this asset.')
    }
    if (!sufficientBalance) {
      return Promise.reject('Insufficient balance to wrap desired amount.')
    }
    if (!wrappedNativeCurrencyContract) {
      return Promise.reject('Wrap contract not found.')
    }
    setWrapState((state) => ({ ...state, loading: true }))
    const result = await (wrapType === WrapType.WRAP
      ? wrappedNativeCurrencyContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
      : wrappedNativeCurrencyContract.withdraw(`0x${parsedAmountIn.quotient.toString(16)}`))
    // resolve loading state after one confirmation
    result.wait(1).finally(() => setWrapState((state) => ({ ...state, loading: false })))
    return Promise.resolve(result)
  }, [wrappedNativeCurrencyContract, sufficientBalance, parsedAmountIn, wrapType, setWrapState])

  return useMemo(
    () => ({
      callback,
      error,
      loading,
      type: wrapType,
    }),
    [callback, error, loading, wrapType]
  )
}
