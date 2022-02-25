import { ContractTransaction } from '@ethersproject/contracts'
import { Trans } from '@lingui/macro'
import { useWETHContract } from 'hooks/useContract'
import { atom, useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useEffect, useMemo } from 'react'

import { WRAPPED_NATIVE_CURRENCY } from '../../../constants/tokens'
import useActiveWeb3React from '../useActiveWeb3React'
import { useCurrencyBalances } from '../useCurrencyBalance'
import useNativeCurrency from '../useNativeCurrency'

export enum WrapInputError {
  NO_ERROR, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT,
  ENTER_WRAPPED_AMOUNT,
  INSUFFICIENT_NATIVE_BALANCE,
  INSUFFICIENT_WRAPPED_BALANCE,
}

export function WrapErrorText({ wrapInputError }: { wrapInputError: WrapInputError }) {
  const native = useNativeCurrency()
  const wrapped = native?.wrapped

  switch (wrapInputError) {
    case WrapInputError.ENTER_NATIVE_AMOUNT:
      return <Trans>Enter {native?.symbol} amount</Trans>
    case WrapInputError.ENTER_WRAPPED_AMOUNT:
      return <Trans>Enter {wrapped?.symbol} amount</Trans>
    case WrapInputError.INSUFFICIENT_NATIVE_BALANCE:
      return <Trans>Insufficient {native?.symbol} balance</Trans>
    case WrapInputError.INSUFFICIENT_WRAPPED_BALANCE:
      return <Trans>Insufficient {wrapped?.symbol} balance</Trans>
    case WrapInputError.NO_ERROR:
    default:
      return null
  }
}

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}
interface UseWrapCallbackReturns {
  callback: () => Promise<ContractTransaction>
  error: WrapInputError
  loading: boolean
  type: WrapType
}

interface WrapState {
  loading: boolean
  error: WrapInputError
}

const wrapState = atom<WrapState>({
  loading: false,
  error: WrapInputError.NO_ERROR,
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
    const wrappedNativeCurrency = WRAPPED_NATIVE_CURRENCY[chainId]
    if (inputCurrency.isNative && wrappedNativeCurrency.equals(outputCurrency)) {
      return WrapType.WRAP
    }
    if (wrappedNativeCurrency.equals(inputCurrency) && outputCurrency.isNative) {
      return WrapType.UNWRAP
    }
    return WrapType.NOT_APPLICABLE
  }, [chainId, inputCurrency, outputCurrency])

  const isExactIn: boolean = independentField === Field.INPUT
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
      setWrapState((state) => ({ ...state, error: WrapInputError.NO_ERROR }))
    } else if (wrapType === WrapType.WRAP) {
      setWrapState((state) => ({
        ...state,
        error: hasInputAmount ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE : WrapInputError.ENTER_NATIVE_AMOUNT,
      }))
    } else if (wrapType === WrapType.UNWRAP) {
      setWrapState((state) => ({
        ...state,
        error: hasInputAmount ? WrapInputError.INSUFFICIENT_WRAPPED_BALANCE : WrapInputError.ENTER_WRAPPED_AMOUNT,
      }))
    }
  }, [hasInputAmount, setWrapState, sufficientBalance, wrapType])

  const callback = useCallback(async () => {
    if (
      !wrappedNativeCurrencyContract ||
      !sufficientBalance ||
      !parsedAmountIn ||
      wrapType === WrapType.NOT_APPLICABLE
    ) {
      return Promise.reject()
    }
    setWrapState((state) => ({ ...state, loading: true }))
    const result = await (wrapType === WrapType.WRAP
      ? wrappedNativeCurrencyContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
      : wrappedNativeCurrencyContract.withdraw(`0x${parsedAmountIn.quotient.toString(16)}`))
    result.wait(1).then(() => setWrapState((state) => ({ ...state, loading: false })))
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
