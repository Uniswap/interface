import { ContractTransaction } from '@ethersproject/contracts'
import { useWETHContract } from 'hooks/useContract'
import { useAtomValue } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useMemo } from 'react'

import { WRAPPED_NATIVE_CURRENCY } from '../../../constants/tokens'
import useActiveWeb3React from '../useActiveWeb3React'
import useCurrencyBalance from '../useCurrencyBalance'

export enum WrapType {
  NONE,
  WRAP,
  UNWRAP,
}
interface UseWrapCallbackReturns {
  callback: () => Promise<ContractTransaction | undefined>
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

  const callback = useCallback(async () => {
    if (wrapType === WrapType.NONE) {
      return Promise.reject('Wrapping not applicable to this asset.')
    }
    if (!parsedAmountIn) {
      return Promise.reject('Must provide an input amount to wrap.')
    }
    if (!balanceIn || balanceIn.lessThan(parsedAmountIn)) {
      return Promise.reject('Insufficient balance to wrap desired amount.')
    }
    if (!wrappedNativeCurrencyContract) {
      return Promise.reject('Wrap contract not found.')
    }

    try {
      return await (wrapType === WrapType.WRAP
        ? wrappedNativeCurrencyContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
        : wrappedNativeCurrencyContract.withdraw(`0x${parsedAmountIn.quotient.toString(16)}`))
    } catch (e) {
      // TODO(zzmp): add error handling
      console.error(e)
      return
    }
  }, [wrapType, parsedAmountIn, balanceIn, wrappedNativeCurrencyContract])

  return useMemo(() => ({ callback, type: wrapType }), [callback, wrapType])
}
