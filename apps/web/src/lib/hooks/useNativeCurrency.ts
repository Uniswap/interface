import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export default function useNativeCurrency(chainId: UniverseChainId | null | undefined): NativeCurrency | Token {
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(UniverseChainId.Mainnet),
    [chainId],
  )
}
