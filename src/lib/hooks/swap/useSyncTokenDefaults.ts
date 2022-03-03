import { Currency } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { Field, Swap, swapAtom } from 'lib/state/swap'
import { useCallback, useLayoutEffect, useState } from 'react'

export type DefaultAddress = string | { [chainId: number]: string | 'NATIVE' } | 'NATIVE'

export interface TokenDefaults {
  defaultInputTokenAddress?: DefaultAddress
  defaultInputAmount?: number | string
  defaultOutputTokenAddress?: DefaultAddress
  defaultOutputAmount?: number | string
}

function useDefaultToken(
  defaultAddress: DefaultAddress | undefined,
  chainId: number | undefined
): Currency | null | undefined {
  let address = undefined
  if (typeof defaultAddress === 'string') {
    address = defaultAddress
  } else if (typeof defaultAddress === 'object' && chainId) {
    address = defaultAddress[chainId]
  }
  const token = useToken(address)
  if (chainId && address === 'NATIVE') {
    return nativeOnChain(chainId)
  }
  return token
}

export default function useSyncTokenDefaults({
  defaultInputTokenAddress,
  defaultInputAmount,
  defaultOutputTokenAddress,
  defaultOutputAmount,
}: TokenDefaults) {
  const updateSwap = useUpdateAtom(swapAtom)
  const { chainId } = useActiveWeb3React()
  const defaultInputToken = useDefaultToken(defaultInputTokenAddress, chainId)
  const defaultOutputToken = useDefaultToken(defaultOutputTokenAddress, chainId)

  const setToDefaults = useCallback(() => {
    const defaultSwapState: Swap = {
      amount: '',
      [Field.INPUT]: defaultInputToken || undefined,
      [Field.OUTPUT]: defaultOutputToken || undefined,
      independentField: Field.INPUT,
    }
    if (defaultInputToken && defaultInputAmount) {
      defaultSwapState.amount = defaultInputAmount.toString()
    } else if (defaultOutputToken && defaultOutputAmount) {
      defaultSwapState.independentField = Field.OUTPUT
      defaultSwapState.amount = defaultOutputAmount.toString()
    }
    updateSwap((swap) => ({ ...swap, ...defaultSwapState }))
  }, [defaultInputAmount, defaultInputToken, defaultOutputAmount, defaultOutputToken, updateSwap])

  const [previousChainId, setPreviousChainId] = useState(chainId)
  useLayoutEffect(() => {
    setPreviousChainId(chainId)
  }, [chainId])
  useLayoutEffect(() => {
    if (chainId && chainId !== previousChainId) {
      setToDefaults()
    }
  }, [chainId, previousChainId, setToDefaults])
}
