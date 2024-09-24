import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'

export default function useNativeCurrency(chainId: InterfaceChainId | null | undefined): NativeCurrency | Token {
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(UniverseChainId.Mainnet),
    [chainId],
  )
}
