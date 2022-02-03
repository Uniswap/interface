import { Currency } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { DefaultAddress } from 'lib/components/Swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { Field, Swap, swapAtom } from 'lib/state/swap'
import { useCallback, useLayoutEffect, useState } from 'react'

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

interface UseSwapDefaultsArgs {
  defaultInputAddress?: DefaultAddress
  defaultInputAmount?: string
  defaultOutputAddress?: DefaultAddress
  defaultOutputAmount?: string
}

export default function useSyncSwapDefaults({
  defaultInputAddress,
  defaultInputAmount,
  defaultOutputAddress,
  defaultOutputAmount,
}: UseSwapDefaultsArgs) {
  const updateSwap = useUpdateAtom(swapAtom)
  const { chainId } = useActiveWeb3React()
  const defaultInputToken = useDefaultToken(defaultInputAddress, chainId)
  const defaultOutputToken = useDefaultToken(defaultOutputAddress, chainId)

  const setToDefaults = useCallback(() => {
    const defaultSwapState: Swap = {
      amount: '',
      [Field.INPUT]: defaultInputToken || undefined,
      [Field.OUTPUT]: defaultOutputToken || undefined,
      independentField: Field.INPUT,
    }
    if (defaultInputAmount && defaultInputToken) {
      defaultSwapState.amount = defaultInputAmount
    } else if (defaultOutputAmount && defaultOutputToken) {
      defaultSwapState.independentField = Field.OUTPUT
      defaultSwapState.amount = defaultOutputAmount
    }
    updateSwap((swap) => ({ ...swap, ...defaultSwapState }))
  }, [defaultInputToken, defaultOutputToken, defaultInputAmount, defaultOutputAmount, updateSwap])

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
