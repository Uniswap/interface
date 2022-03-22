import { ContractTransaction } from '@ethersproject/contracts'
import { useWETHContract } from 'hooks/useContract'
import { atom, useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useMemo } from 'react'

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
  loading: boolean
  type: WrapType
}

const loadingAtom = atom(false)

export default function useWrapCallback(): UseWrapCallbackReturns {
  const { account, chainId } = useActiveWeb3React()
  const [loading, setLoading] = useAtom(loadingAtom)
  const wrappedNativeCurrencyContract = useWETHContract()
  const { amount, [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency } = useAtomValue(swapAtom)

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

  const parsedAmountIn = useMemo(
    () => tryParseCurrencyAmount(amount, inputCurrency ?? undefined),
    [inputCurrency, amount]
  )

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

  const sufficientBalance = parsedAmountIn && !currencyBalances[Field.INPUT]?.lessThan(parsedAmountIn)

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
    setLoading(true)
    const result = await (wrapType === WrapType.WRAP
      ? wrappedNativeCurrencyContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
      : wrappedNativeCurrencyContract.withdraw(`0x${parsedAmountIn.quotient.toString(16)}`)
    ).catch((e: unknown) => {
      setLoading(false)
      throw e
    })
    // resolve loading state after one confirmation
    result.wait(1).finally(() => setLoading(false))
    return Promise.resolve(result)
  }, [parsedAmountIn, wrapType, sufficientBalance, wrappedNativeCurrencyContract, setLoading])

  return useMemo(
    () => ({
      callback,
      loading,
      type: wrapType,
    }),
    [callback, loading, wrapType]
  )
}
