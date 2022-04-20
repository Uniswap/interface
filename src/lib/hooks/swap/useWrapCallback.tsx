import { ContractTransaction } from '@ethersproject/contracts'
import { useWETHContract } from 'hooks/useContract'
import { useAtomValue } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'

import { WRAPPED_NATIVE_CURRENCY } from '../../../constants/tokens'
import useActiveWeb3React from '../useActiveWeb3React'
import useCurrencyBalance from '../useCurrencyBalance'

export enum WrapType {
  NONE,
  WRAP,
  UNWRAP,
}
interface UseWrapCallbackReturns {
  callback?: () => Promise<ContractTransaction>
  type: WrapType
}

export default function useWrapCallback(): UseWrapCallbackReturns {
  const { account, chainId } = useActiveWeb3React()
  const wrappedNativeCurrencyContract = useWETHContract()
  const { amount, [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency } = useAtomValue(swapAtom)

  const wrapType = useMemo(() => {
    if (chainId && inputCurrency && outputCurrency) {
      if (inputCurrency.isNative && WRAPPED_NATIVE_CURRENCY[chainId]?.equals(outputCurrency)) {
        return WrapType.WRAP
      }
      if (outputCurrency.isNative && WRAPPED_NATIVE_CURRENCY[chainId]?.equals(inputCurrency)) {
        return WrapType.UNWRAP
      }
    }
    return WrapType.NONE
  }, [chainId, inputCurrency, outputCurrency])

  const parsedAmountIn = useMemo(
    () => tryParseCurrencyAmount(amount, inputCurrency ?? undefined),
    [inputCurrency, amount]
  )
  const balanceIn = useCurrencyBalance(account, inputCurrency)

  const callback = useMemo(() => {
    if (
      wrapType === WrapType.NONE ||
      !parsedAmountIn ||
      !balanceIn ||
      balanceIn.lessThan(parsedAmountIn) ||
      !wrappedNativeCurrencyContract
    ) {
      return
    }

    return async () =>
      wrapType === WrapType.WRAP
        ? wrappedNativeCurrencyContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
        : wrappedNativeCurrencyContract.withdraw(`0x${parsedAmountIn.quotient.toString(16)}`)
  }, [wrapType, parsedAmountIn, balanceIn, wrappedNativeCurrencyContract])

  return useMemo(() => ({ callback, type: wrapType }), [callback, wrapType])
}
