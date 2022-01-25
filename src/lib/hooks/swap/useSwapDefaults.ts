import { useUpdateAtom } from 'jotai/utils'
import { DefaultAddress } from 'lib/components/Swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { swapAtom } from 'lib/state/swap'
import { Field, Swap } from 'lib/state/swap'
import { useCallback, useLayoutEffect, useState } from 'react'

function useDefaultToken(
  defaultAddress: DefaultAddress | undefined,
  chainId: number | undefined
): ReturnType<typeof useToken> {
  let address = undefined
  if (typeof defaultAddress === 'string') {
    address = defaultAddress
  } else if (typeof defaultAddress === 'object' && chainId) {
    address = defaultAddress[chainId]
  }
  return useToken(address)
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
    if (defaultInputToken) {
      newSwap[Field.INPUT] = defaultInputToken
    }
    if (defaultOutputToken) {
      newSwap[Field.OUTPUT] = defaultOutputToken
    }
    if (defaultInputAmount) {
      newSwap.independentField = Field.INPUT
      newSwap.amount = defaultInputAmount
    } else if (defaultOutputAmount) {
      newSwap.independentField = Field.OUTPUT
      newSwap.amount = defaultOutputAmount
    }
    updateSwap((swap) => ({ ...swap, ...newSwap }))
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
