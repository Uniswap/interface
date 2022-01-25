import { NativeCurrency } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { DefaultAddress } from 'lib/components/Swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { Field, Swap, swapAtom } from 'lib/state/swap'
import { useCallback, useEffect, useState } from 'react'

function useDefaultToken(
  defaultAddress: DefaultAddress | undefined,
  chainId: number | undefined
): ReturnType<typeof useToken> | NativeCurrency {
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

export default function useSwapDefaults(
  defaultInputAddress: DefaultAddress | undefined,
  defaultInputAmount: string | undefined,
  defaultOutputAddress: DefaultAddress | undefined,
  defaultOutputAmount: string | undefined
) {
  const updateSwap = useUpdateAtom(swapAtom)
  const { chainId } = useActiveWeb3React()
  const defaultInputToken = useDefaultToken(defaultInputAddress, chainId)
  const defaultOutputToken = useDefaultToken(defaultOutputAddress, chainId)

  const setToDefaults = useCallback(() => {
    const newSwap: Partial<Swap> = {}
    newSwap[Field.INPUT] = defaultInputToken || undefined
    newSwap[Field.OUTPUT] = defaultOutputToken || undefined
    // independentField is Field.INPUT unless defaultOutputAmount is set
    newSwap.independentField = Field.INPUT
    if (defaultInputAmount && defaultInputToken) {
      newSwap.amount = defaultInputAmount
    } else if (defaultOutputAmount && defaultOutputToken) {
      newSwap.independentField = Field.OUTPUT
      newSwap.amount = defaultOutputAmount
    }
    updateSwap((swap) => ({ ...swap, ...newSwap }))
  }, [defaultInputToken, defaultOutputToken, defaultInputAmount, defaultOutputAmount, updateSwap])

  const [previousChainId, setPreviousChainId] = useState(chainId)
  useEffect(() => {
    setPreviousChainId(chainId)
  }, [chainId])

  useEffect(() => {
    if (chainId && chainId !== previousChainId) {
      setToDefaults()
    }
  }, [chainId, previousChainId, setToDefaults])
}
