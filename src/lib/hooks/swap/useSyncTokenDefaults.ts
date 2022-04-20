import { Currency } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { Field, Swap, swapAtom } from 'lib/state/swap'
import { useCallback, useRef } from 'react'

import useOnSupportedNetwork from '../useOnSupportedNetwork'
import { useIsTokenListLoaded } from '../useTokenList'

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
): Currency | undefined {
  let address = undefined
  if (typeof defaultAddress === 'string') {
    address = defaultAddress
  } else if (typeof defaultAddress === 'object' && chainId) {
    address = defaultAddress[chainId]
  }
  const token = useToken(address)

  const onSupportedNetwork = useOnSupportedNetwork()

  // Only use native currency if chain ID is in supported chains. ExtendedEther will error otherwise.
  if (chainId && address === 'NATIVE' && onSupportedNetwork) {
    return nativeOnChain(chainId)
  }
  return token ?? undefined
}

export default function useSyncTokenDefaults({
  defaultInputTokenAddress,
  defaultInputAmount,
  defaultOutputTokenAddress,
  defaultOutputAmount,
}: TokenDefaults) {
  const updateSwap = useUpdateAtom(swapAtom)
  const { chainId } = useActiveWeb3React()
  const onSupportedNetwork = useOnSupportedNetwork()
  const nativeCurrency = useNativeCurrency()
  const defaultOutputToken = useDefaultToken(defaultOutputTokenAddress, chainId)
  const defaultInputToken =
    useDefaultToken(defaultInputTokenAddress, chainId) ??
    // Default the input token to the native currency if it is not the output token.
    (defaultOutputToken !== nativeCurrency && onSupportedNetwork ? nativeCurrency : undefined)

  const setToDefaults = useCallback(() => {
    const defaultSwapState: Swap = {
      amount: '',
      [Field.INPUT]: defaultInputToken,
      [Field.OUTPUT]: defaultOutputToken,
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

  const lastChainId = useRef<number | undefined>(undefined)
  const shouldSync = useIsTokenListLoaded() && chainId && chainId !== lastChainId.current
  if (shouldSync) {
    setToDefaults()
    lastChainId.current = chainId
  }
}
